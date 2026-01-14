# AI Log Analyzer Agent

An intelligent log analysis system that uses RAG (Retrieval-Augmented Generation) to search, summarize, and detect anomalies in SCADA/field logs using LLM + embeddings.

## Features

- **Upload Log Files** - Drag and drop log files for processing
- **Semantic Search** - Find relevant log entries using embeddings
- **Ask Questions** - Get AI-powered answers about your logs
- **Anomaly Detection** - Automatically detect errors and critical events
- **Timeline Visualization** - View events chronologically

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (React + TypeScript)
- **Embeddings**: Sentence-Transformers (HuggingFace)
- **Vector Search**: FAISS
- **Database**: SQLite
- **LLM**: OpenAI GPT-4o-mini

## Prerequisites

- Python 3.8+ 
- Node.js 18+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo OPENAI_API_KEY=your_openai_api_key_here > .env
# Edit .env and add your actual OpenAI API key

# Run the backend server
uvicorn app:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

# Run the frontend development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs (FastAPI automatic documentation)

## Project Structure

```
ai-log-agent/
├── backend/
│   ├── app.py              # FastAPI main application
│   ├── db.py               # Database operations
│   ├── embeddings.py       # FAISS vector index management
│   ├── parsers.py          # Log file parsing
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables (create this)
├── frontend/
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── package.json        # Node dependencies
│   └── .env.local          # Environment variables (create this)
└── README.md
```

## Environment Variables

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed environment variable documentation.

### Backend (.env)
```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
EMB_MODEL=all-MiniLM-L6-v2
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage

1. **Upload Logs**: Go to the upload page and drag & drop your log files
2. **Search**: Use semantic search to find relevant log entries
3. **Ask Questions**: Ask natural language questions about your logs
4. **View Anomalies**: Check the anomalies page for errors and warnings
5. **Timeline**: View events in chronological order

## API Endpoints

- `POST /api/upload` - Upload log files
- `POST /api/search` - Semantic search in logs
- `POST /api/ask` - Ask questions about logs (RAG)
- `GET /api/anomalies` - Get detected anomalies
- `GET /api/timeline` - Get event timeline
- `GET /api/file/{file_id}/status` - Get file processing status

See http://localhost:8000/docs for interactive API documentation.

## Development

### Backend Development
```bash
cd backend
uvicorn app:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Troubleshooting

### Backend Issues

**"OPENAI_API_KEY not configured"**
- Make sure `.env` file exists in `backend/` directory
- Verify the API key is correct

**"ModuleNotFoundError"**
- Activate your virtual environment
- Run `pip install -r requirements.txt`

### Frontend Issues

**API calls failing**
- Check that backend is running on port 8000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Restart Next.js dev server after changing `.env.local`

**CORS errors**
- Backend CORS is configured to allow all origins
- Make sure backend is running

## Production Deployment

See [ENV_SETUP.md](./ENV_SETUP.md) for production deployment instructions.

## License

MIT

