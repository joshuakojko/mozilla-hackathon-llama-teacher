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

## Getting Started

### Prerequisites

### llamafile setup
1. Download the default llamafile model:
   ```bash
   # Download the model
   wget https://huggingface.co/jartine/llava-v1.5-7B-GGUF/raw/main/llava-v1.5-7b-q4.llamafile
   chmod +x llava-v1.5-7b-q4.llamafile

   # Start the llamafile server
   ./llava-v1.5-7b-q4.llamafile --server --host 127.0.0.1 --port 8080
   ```

### Installation

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```