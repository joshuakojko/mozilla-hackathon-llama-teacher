# Llama Teacher

A personalized AI learning assistant powered by Next.js and FastAPI. This application provides an interactive chat interface and generates learning roadmaps using local LLM capabilities, powered by llamafile for local inference.

## Features

- 💬 Real-time chat interface with an AI tutor
- 📚 Document upload and RAG
- 🗺️ Dynamic learning roadmap generation
- 🏃‍♂️ Completely local execution with llamafile

## Tech Stack

- **Frontend**
  - Next.js
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components
  - Markmap for mindmap visualization

- **Backend**
  - FastAPI
  - LlamaIndex
  - Llamafile for local LLM
  - SQLite storage for chat persistence 

## Getting Started

### Prerequisites

### llamafile setup
1. Download the default llamafile model:
   ```bash
   # Download the model
   wget https://huggingface.co/jartine/llava-v1.5-7B-GGUF/raw/main/llava-v1.5-7b-q4.llamafile
   chmod +x llava-v1.5-7b-q4.llamafile

   # Start the llamafile server
   ./llava-v1.5-7b-q4.llamafile --nobrowser --fast --embedding
   ```

### Installation

1. Install frontend dependencies:
   ```bash
   npm install
   ```
2. Start frontend server:
   ```bash
   npm run dev
   ```
3. Create virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   ```
4. Install backend dependencies
   ```bash
   pip freeze -> requirements.txt
   pip install -r requirements.txt
   ```
5. Start the backend server:
   ```bash
   python main.py
   ```
