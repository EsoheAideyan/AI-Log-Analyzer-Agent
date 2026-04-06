# Environment Variables Setup Guide

This document explains all the environment variables needed for the AI Log Analyzer Agent.

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Required Variables

```bash
# OpenAI API Configuration (REQUIRED for LLM features)
OPENAI_API_KEY=your_openai_api_key_here
```

**How to get it:**
- Sign up at https://platform.openai.com/
- Go to API Keys section
- Create a new secret key
- Copy and paste it here

### Optional Variables (with defaults)

```bash
# OpenAI Model Selection
OPENAI_MODEL=gpt-4o-mini          # Default: gpt-4o-mini
                                  # Options: gpt-4o-mini, gpt-4, gpt-3.5-turbo, etc.

# Embedding Model Configuration
EMB_MODEL=all-MiniLM-L6-v2        # Default: all-MiniLM-L6-v2
                                  # Other options: all-mpnet-base-v2, paraphrase-MiniLM-L6-v2

# Database Configuration
DB_PATH=./data/metadata.db        # Default: ./data/metadata.db
                                  # SQLite database for storing file metadata and events

# File Upload Configuration
UPLOAD_DIR=./uploads              # Default: ./uploads
                                  # Directory where uploaded log files are stored

# FAISS Index Configuration
FAISS_INDEX_PATH=./data/faiss.index    # Default: ./data/faiss.index
FAISS_META_DB=./data/metadata.db      # Default: ./data/metadata.db
                                       # FAISS vector index and metadata storage

# Server Configuration
PORT=8000                         # Default: 8000 (set by uvicorn)
HOST=0.0.0.0                      # Default: 0.0.0.0 (set by uvicorn)

# Search (optional)
SEARCH_MAX_L2_DISTANCE=1.2        # FAISS squared L2 distance ceiling for semantic candidates
SEARCH_SEMANTIC_POOL=2500         # How many semantic hits to consider before keyword filter (max 10000)
```

### Backend .env File Example

Create `backend/.env`:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
EMB_MODEL=all-MiniLM-L6-v2
DB_PATH=./data/metadata.db
UPLOAD_DIR=./uploads
```

## Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory (Next.js uses `.env.local` for local development):

### Required Variables

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

### Frontend .env.local File Example

Create `frontend/.env.local`:

```bash
# For local development
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production (example)
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Create .env file
cp .env.example .env  # If you create .env.example
# OR manually create .env and add your variables

# Edit .env and add your OPENAI_API_KEY
nano .env  # or use your preferred editor

# Install dependencies (if not already done)
pip install python-dotenv openai sentence-transformers faiss-cpu
```

### 2. Frontend Setup

```bash
cd frontend

# Create .env.local file
# OR manually create .env.local and add your variables

# Edit .env.local and set your backend URL
nano .env.local  # or use your preferred editor

# Install dependencies (if not already done)
npm install
```

### 3. Verify Setup

**Backend:**
- Make sure `python-dotenv` is installed: `pip install python-dotenv`
- The code automatically loads `.env` using `load_dotenv()`

**Frontend:**
- Restart your Next.js dev server after creating/updating `.env.local`
- Environment variables are loaded at build time for `NEXT_PUBLIC_*` variables

## Security Notes

⚠️ **Important:**
- Never commit `.env` or `.env.local` files to git (they're in `.gitignore`)
- The `.env.example` files are safe to commit (they contain no secrets)
- `OPENAI_API_KEY` is sensitive - keep it secret
- For production, use secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)

## Troubleshooting

### Backend Issues

**"OPENAI_API_KEY not configured" error:**
- Make sure `.env` file exists in `backend/` directory
- Check that `OPENAI_API_KEY` is set correctly
- Verify `python-dotenv` is installed
- Restart your FastAPI server

**"ModuleNotFoundError: No module named 'dotenv'"**
```bash
pip install python-dotenv
```

### Frontend Issues

**API calls failing:**
- Check that `NEXT_PUBLIC_API_URL` is set in `.env.local`
- Restart Next.js dev server after changing `.env.local`
- Verify the backend is running on the specified URL
- Check browser console for CORS errors (backend CORS is configured to allow all origins)

**Environment variable not available:**
- Make sure variable name starts with `NEXT_PUBLIC_`
- Restart Next.js dev server
- Clear browser cache if needed

## Production Deployment

### Backend (FastAPI)
- Set environment variables in your hosting platform (Heroku, AWS, etc.)
- Or use a `.env` file in production (less secure, but works)

### Frontend (Next.js)
- Set `NEXT_PUBLIC_API_URL` to your production backend URL
- Build-time variables: Set during `next build`
- Runtime variables: Use `NEXT_PUBLIC_` prefix for client-side access

## Example Production Setup

**Backend (e.g., on Heroku):**
```bash
heroku config:set OPENAI_API_KEY=sk-proj-xxx
heroku config:set OPENAI_MODEL=gpt-4o-mini
```

**Frontend (e.g., on Vercel):**
```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-backend.herokuapp.com
```

