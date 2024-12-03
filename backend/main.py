from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import logging
import sys
import uvicorn
from database import Database, ChatDatabase, MessageDatabase
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import os

from llama_index.core import (
    VectorStoreIndex,
    StorageContext,
    SimpleDirectoryReader,
    Settings,
    load_index_from_storage
)

from llama_index.embeddings.llamafile import LlamafileEmbedding
from llama_index.llms.llamafile import Llamafile
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.llms import ChatMessage

Settings.embed_model = LlamafileEmbedding(
    base_url="http://localhost:8080",
)

Settings.llm = Llamafile(
    base_url="http://localhost:8080",
    timeout=300.0,
    request_timeout=300.0,
)

Settings.transformations = [
    SentenceSplitter(
        chunk_size=256,
        chunk_overlap=5
    )
]

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

db = Database('database/sqlite3.db')
chat_db = ChatDatabase(db)
message_db = MessageDatabase(db)

class CreateChatRequest(BaseModel):
    title: str

class DocumentEmbedRequest(BaseModel):
    file_path: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[Message]
    stream: Optional[bool] = False
    max_tokens: Optional[int] = None
    max_completion_tokens: Optional[int] = None
    top_p: Optional[float] = None
    temperature: Optional[float] = None
    seed: Optional[int] = None
    presence_penalty: Optional[float] = None
    frequency_penalty: Optional[float] = None
    user: Optional[str] = None
    stop: Optional[List[str]] = None
    response_format: Optional[str] = None

def get_embedding_path(chat_id: str):
    return f"database/embeddings/{chat_id}"

@app.get('/chats')
async def get_chats():
    try:
        chats = chat_db.get_all_chats()
        return [
            {
                "chat_id": chat.chat_id,
                "title": chat.title,
                "created_at": chat.created_at.isoformat(),
                "updated_at": chat.updated_at.isoformat()
            }
            for chat in chats
        ]
    except Exception as e:
        logger.error(f"Error getting chats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/chats')
async def create_chat(request: CreateChatRequest):
    try:
        chat = chat_db.create_chat(request.title)
        messages = message_db.get_chat_messages(chat.chat_id)
        
        return {
            "chat_id": chat.chat_id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "messages": [
                {
                    "message_id": message.message_id,
                    "chat_id": message.chat_id,
                    "role": message.role,
                    "content": message.content,
                    "created_at": message.created_at.isoformat()
                }
                for message in messages
            ]
        }
    except Exception as e:
        logger.error(f"Error creating chat: {str(e)}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/chats/{chat_id}/messages')
async def get_chat_messages(chat_id: str):
    messages = message_db.get_chat_messages(chat_id)
    return [
        {
            "message_id": message.message_id,
            "chat_id": message.chat_id,
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at.isoformat()
        }
        for message in messages
    ]

@app.post('/chats/{chat_id}/completion')
async def chat_completion(chat_id: str, request: ChatRequest):
    try:
        message_db.add_message(chat_id, request.messages[-1].role, request.messages[-1].content)
        
        embedding_path = get_embedding_path(chat_id)
        embedding_dir = Path(embedding_path)
        response = None
        
        if embedding_dir.exists():
            try:
                storage_context = StorageContext.from_defaults(persist_dir=embedding_path)
                index = load_index_from_storage(storage_context)
                query_engine = index.as_query_engine(
                    similarity_top_k=3,
                    response_mode="compact",
                    timeout=300.0
                )
                user_query = request.messages[-1].content
                query_response = query_engine.query(user_query)
                logger.info(f"Query response: {query_response}")
                if query_response and str(query_response).strip():
                    response = query_response
            except Exception as e:
                logger.error(f"Error using query engine: {str(e)}")
                logger.debug("Falling back to LLM due to query engine error")

        if response is None:
            llm = Settings.llm
            chat_messages = [ChatMessage(role=msg.role, content=msg.content) for msg in request.messages]
            response = await llm.achat(
                    messages=chat_messages,
            )
            response = response.message.content
            logger.debug(f"LLM response: {response}")

        message_db.add_message(chat_id, "assistant", str(response))
        
        return {"message": str(response)}
    except Exception as e:
        logger.error(f"Error in chat completion: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/chats/{chat_id}/embed')
async def embed_chat(chat_id: str, file: UploadFile = File(...)):
    try:
        embedding_path = get_embedding_path(chat_id)

        temp_file_path = f"/tmp/{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await file.read())

        reader = SimpleDirectoryReader(input_files=[temp_file_path])
        documents = reader.load_data()
        
        if Path(embedding_path).exists():
            storage_context = StorageContext.from_defaults(persist_dir=embedding_path)
            index = load_index_from_storage(storage_context)
            for doc in documents:
                index.insert(doc)
        else:
            Path(embedding_path).mkdir(parents=True, exist_ok=True)
            index = VectorStoreIndex.from_documents(
                documents,
                show_progress=True
            )
            
        index.storage_context.persist(persist_dir=embedding_path)

        os.remove(temp_file_path)
        
        return {"message": "Successfully embedded document"}
    except Exception as e:
        logger.error(f"Error embedding document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/chats/{chat_id}/generate-mindmap')
async def generate_mindmap(chat_id: str):
    try:
        messages = message_db.get_chat_messages(chat_id)
        
        system_prompt = """Generate a structured learning roadmap in markdown format.
        The roadmap should have a main topic as heading level 1 (#),
        major categories as heading level 2 (##),
        and bullet points (-) for specific topics.
        Keep it concise and well-organized."""
        
        chat_history = "\n".join([f"{msg.role}: {msg.content}" for msg in messages])
        user_prompt = f"Based on this chat history, create a learning roadmap:\n{chat_history}"
        
        llm = Settings.llm
        response = await llm.achat(messages=[
            ChatMessage(role="system", content=system_prompt),
            ChatMessage(role="user", content=user_prompt)
        ])
        
        return {"message": response.message.content}
    except Exception as e:
        logger.error(f"Error generating mindmap: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run("main:app", host='0.0.0.0', port=8000, reload=True)