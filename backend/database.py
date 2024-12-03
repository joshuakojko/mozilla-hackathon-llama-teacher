import sqlite3
from datetime import datetime
import os
from dataclasses import dataclass
from pathlib import Path
from contextlib import contextmanager
import uuid

@dataclass
class Chat:
    chat_id: str
    created_at: datetime
    updated_at: datetime
    title: str

@dataclass
class Message:
    message_id: int
    chat_id: str
    role: str
    content: str
    created_at: datetime

class Database:
    seed_script = '''
    PRAGMA foreign_keys = ON;
    
    CREATE TABLE IF NOT EXISTS chats (
        chat_id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        title TEXT NOT NULL DEFAULT 'New Chat'
    );
    
    CREATE TABLE IF NOT EXISTS messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE
    );
    
    CREATE TRIGGER IF NOT EXISTS update_chat_timestamp 
    AFTER UPDATE ON chats
    BEGIN
        UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = NEW.chat_id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_chat_timestamp_on_message
    AFTER INSERT ON messages
    BEGIN
        UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = NEW.chat_id;
    END;
    '''

    def __init__(self, db_path: str):
        '''Initialize database if needed'''
        self.db_path = db_path
        dir_path = os.path.dirname(self.db_path)
        Path(dir_path).mkdir(parents=True, exist_ok=True)

        try:
            with self.get_connection() as conn:
                conn.executescript(self.seed_script)
        except sqlite3.Error as e:
            print(f"Error connecting to database: {e}")
            raise e

    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(
            self.db_path,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
            isolation_level=None
        )
        try:
            yield conn
        finally:
            conn.close()

class ChatDatabase:
    def __init__(self, db: Database):
        self.db = db
        self.message_db = MessageDatabase(db)

    def get_all_chats(self) -> list[Chat]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor().execute('''
                SELECT * FROM chats
                ORDER BY updated_at DESC
            ''')
            return [Chat(*chat) for chat in cursor.fetchall()]
        
    def create_chat(self, title: str) -> Chat:
        new_chat_id = str(uuid.uuid4())
        with self.db.get_connection() as conn:
           cursor = conn.cursor()
           try:
               cursor.execute('''
                   INSERT INTO chats (chat_id, title) VALUES (?, ?)
               ''', (new_chat_id, title))
               
               initial_message = (
                   "Hi, I'm Llama Tutor, a personalized learning assistant. "
                   "Feel free to ask me questions about homework, lecture notes, or upcoming tests!"
               )
               cursor.execute('''
                   INSERT INTO messages (chat_id, role, content)
                   VALUES (?, ?, ?)
               ''', (new_chat_id, "assistant", initial_message))
               
               cursor.execute('''
                   SELECT * FROM chats WHERE chat_id = ?
               ''', (new_chat_id,))
               
               chat_data = cursor.fetchone()
               return Chat(*chat_data)
           except Exception as e:
               raise

class MessageDatabase:
    def __init__(self, db: Database):
        self.db = db
    
    def get_chat_messages(self, chat_id: str) -> list[Message]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor().execute('''
                SELECT * FROM messages
                WHERE chat_id = ?
                ORDER BY message_id ASC, created_at ASC
            ''', (chat_id,))
            return [Message(*message) for message in cursor.fetchall()]
    
    def add_message(self, chat_id: str, role: str, content: str):
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)
            ''', (chat_id, role, content))
            
            cursor.execute('''
                SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1
            ''', (chat_id,))
            
            result = cursor.fetchone()
            if result is None:
                raise ValueError(f"Failed to retrieve the inserted message for chat ID {chat_id}.")
            
            return Message(*result)