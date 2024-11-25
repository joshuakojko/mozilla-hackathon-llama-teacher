from fastapi import FastAPI, UploadFile, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
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

app = FastAPI()

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure LlamaIndex
Settings.embed_model = LlamafileEmbedding(
    base_url="http://localhost:8080",
    timeout=60000
)
Settings.llm = Llamafile(
    base_url="http://localhost:8080",
    temperature=0,
    seed=0,
    timeout=60000
)
Settings.transformations = [
    SentenceSplitter(
        chunk_size=256,
        chunk_overlap=1
    )
]

class MessageRequest(BaseModel):
    message: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str
    stream: Optional[bool] = False

index = None

# Modified chat completion endpoint
@app.post("/v1/chat/completions")
async def create_chat_completion(request: ChatRequest):
    global index
    try:
        if index is None:
            storage_context = StorageContext.from_defaults(persist_dir="./storage")
            index = load_index_from_storage(storage_context)
        
        # Configure query engine with more specific parameters
        query_engine = index.as_query_engine(
            similarity_top_k=2,
            streaming=request.stream,
            response_mode="compact",
            chunk_size=128,
            chunk_overlap=20,
        )
        
        # Get the last user message
        last_message = next((msg for msg in reversed(request.messages) if msg.role == "user"), None)
        if not last_message:
            raise HTTPException(status_code=400, detail="No user message found")
        
        # Optimize the query construction
        query = last_message.content
        if len(request.messages) > 1:
            # Limit conversation history to reduce processing time
            conversation_history = "\n".join([
                f"{msg.role}: {msg.content}" 
                for msg in request.messages[-2:]  # Only include last message for context
            ])
            query = f"Previous context:\n{conversation_history}\n\nQuestion: {query}"
        
        try:
            # Set a more reasonable timeout for the query operation
            response = await query_engine.query(query)
            
            if not response:
                raise HTTPException(
                    status_code=500,
                    detail="Empty response from query engine"
                )
                
            return {
                "message": {
                    "role": "assistant",
                    "content": str(response)
                }
            }
            
        except Exception as query_error:
            logger.error(f"Query engine error: {str(query_error)}")
            raise HTTPException(
                status_code=504,  # Gateway Timeout
                detail="Query engine timed out or failed to respond"
            )
            
    except Exception as e:
        logger.error(f"Error in chat completion: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
)

@app.post("/v1/encode")
async def encode_document(file: UploadFile):
    try:
        # Create storage directory if it doesn't exist
        storage_path = "./storage"
        os.makedirs(storage_path, exist_ok=True)
        
        # Create temporary directory
        temp_path = "./temp"
        os.makedirs(temp_path, exist_ok=True)
        temp_file_path = os.path.join(temp_path, file.filename)
        
        logger.info(f"Processing file: {file.filename}")
        
        try:
            # Save uploaded file temporarily
            content = await file.read()
            with open(temp_file_path, "wb") as f:
                f.write(content)
            
            logger.info(f"File saved to temp: {temp_file_path}")
            
            # Load documents
            reader = SimpleDirectoryReader(input_files=[temp_file_path])
            documents = reader.load_data()
            
            # Create new storage context and index without trying to load existing
            storage_context = StorageContext.from_defaults()  # Remove persist_dir here
            index = VectorStoreIndex.from_documents(
                documents,
                storage_context=storage_context,
                show_progress=True
            )
            
            # Persist the index after creation
            index.storage_context.persist(persist_dir=storage_path)
            logger.info("Index persisted successfully")
            
            return {"success": True, "message": "Document processed successfully"}
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                logger.info(f"Cleaned up temp file: {temp_file_path}")
            
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class MindmapRequest(BaseModel):
    prompt: str
    context: str | None = None

class MindmapResponse(BaseModel):
    markdown: str

router = APIRouter()

@router.post("/v1/generate-mindmap", response_model=MindmapResponse)
async def generate_mindmap(request: MindmapRequest):
    global index
    try:
        if index is None:
            storage_context = StorageContext.from_defaults(persist_dir="./storage")
            index = load_index_from_storage(storage_context)

        # Construct the prompt for mindmap generation
        base_prompt = """Generate a hierarchical mindmap in markdown format about the topic below. 
        Use only headings (##, ###, etc) and bullet points (-).
        Keep it concise and well-structured with 2-3 levels of depth.
        
        Topic: {topic}"""
        
        if request.context:
            base_prompt += "\nContext: {context}"

        # Configure query engine for structured output
        query_engine = index.as_query_engine(
            similarity_top_k=3,
            response_mode="tree",
            structured_answer_filtering=True
        )

        # Format the final prompt
        formatted_prompt = base_prompt.format(
            topic=request.prompt,
            context=request.context if request.context else ""
        )

        # Get response from query engine
        response = await query_engine.query(formatted_prompt)

        # Format the markdown with markmap metadata
        markdown_content = f"""---
title: {request.prompt}
markmap:
  colorFreezeLevel: 2
---

{str(response)}"""

        return MindmapResponse(markdown=markdown_content)

    except Exception as e:
        logger.error(f"Error generating mindmap: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate mindmap: {str(e)}"
        )