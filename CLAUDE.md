# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Run Backend:** `python -m app.main` or `uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload`
- **Run Frontend:** `cd frontend && npm run dev`
- **Build Frontend:** `cd frontend && npm run build`
- **Lint Frontend:** `cd frontend && npm run lint`
- **Install Backend Dependencies:** `uv sync` (or `pip install -r requirements.txt` if using pip)
- **Install Frontend Dependencies:** `cd frontend && npm install`

## Architecture & Structure

This is a full-stack application for an AI-powered recipe recommender based on uploaded food images.

### Backend (Python/FastAPI)
- **`app/main.py`**: The FastAPI application entry point. It configures CORS, mounts the API routers, and serves the frontend static files.
- **`app/api/v1/`**: Contains the API route definitions.
  - `chat.py`: Handles the chat streaming endpoint (`/api/v1/chat/stream`) and message history management.
  - `oss.py`: Handles generating presigned URLs for uploading images to Alibaba Cloud OSS (`/api/v1/oss/presign`).
- **`app/agent/personal_chef_agent.py`**: The core AI logic using LangChain and LangGraph. It defines a `create_agent` that uses OpenAI models and Tavily for web search to recommend recipes based on text prompts and image URLs. It uses `InMemorySaver` for session history.
- **`app/models/schemas.py`**: Pydantic models for request/response validation (e.g., `ChatRequest`).
- **`app/common/logger.py`**: Centralized logging configuration.

### Frontend (Next.js/React)
- **`frontend/app/`**: Next.js App Router directory containing the main pages and layouts.
- **`frontend/components/`**: Reusable React components (e.g., `ChatInput.tsx`, `ChatMessage.tsx`, `RecipeCard.tsx`).
- **`frontend/lib/`**: Utility functions and API client code (`api.ts`, `utils.ts`).
- **`frontend/types/`**: TypeScript type definitions (e.g., `chat.ts`).

## Key Technologies
- **Backend**: FastAPI, LangChain, LangGraph, OpenAI API, Tavily Search, Alibaba Cloud OSS.
- **Frontend**: Next.js (App Router), React, Tailwind CSS, TypeScript.