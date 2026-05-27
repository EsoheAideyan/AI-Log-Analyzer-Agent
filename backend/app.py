# This is the main file for the backend of the application.
# It will define all API routes, wire up dependency injection for DB, FAIS, LLM provider

import os
import uuid
from dotenv import load_dotenv
import json
import sqlite3
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from parsers import parse_log_file
from db import init_db, insert_file_record, mark_file_parsed, insert_events_bulk, get_file_status, get_event, get_log_events, file_exists, DB_PATH
from embeddings import (
    EmbeddingIndex,
    DEFAULT_MAX_L2_DISTANCE,
    DEFAULT_RELEVANCE_MARGIN,
    USE_DISTANCE_FILTER,
)
from keyword_helpers import filter_sort_keyword_hits as _filter_sort_keyword_hits
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

UPLOAD_DIR = os.environ.get('UPLOAD_DIR', './uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# OpenAI configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')

app = FastAPI(title='AI Log Analyzer Agent')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
index = EmbeddingIndex(index_path='./data/faiss.index', meta_db='./data/metadata.db')

# Search: pull this many semantic candidates, then keep only rows whose message text contains query terms.
SEARCH_SEMANTIC_POOL = min(
    int(os.environ.get('SEARCH_SEMANTIC_POOL', '2500')),
    10000,
)

ENABLE_DEBUG_ENDPOINT = os.environ.get('ENABLE_DEBUG_ENDPOINT', '').lower() in ('1', 'true', 'yes')

if ENABLE_DEBUG_ENDPOINT:
    @app.get("/api/debug/env")
    async def debug_env():
        return JSONResponse({
            "OPENAI_API_KEY_configured": OPENAI_API_KEY is not None,
            "OPENAI_MODEL": OPENAI_MODEL,
        })

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    insert_file_record(file_id, file.filename, file_path)

    events = parse_log_file(file_path)
    if not events:
        mark_file_parsed(file_id, False)
        raise HTTPException(status_code=500, detail="Failed to parse log file")

    insert_events_bulk(file_id, events)
    mark_file_parsed(file_id, True)

    chunks = []
    for event in events:
        chunks.append({
            'text': event['message'],
            'meta': {
                'event_id': event['id'],
                'file_id': file_id,
                'ts': event.get('ts'),
                'level': event.get('level'),
                'source': event.get('source')
            }
        })

    if chunks:
        index.add_chunks(chunks)

    return JSONResponse(content={
        "message": "File uploaded and processed successfully",
        "file_id": file_id,
        "events_count": len(events),
    })


#GET /api/file/file_id={file_id}/status
@app.get("/api/file/{file_id}/status")
async def file_status(file_id: str):
    status = get_file_status(file_id)
    return JSONResponse(content={"message": "File status", "status": status})


#POST /api/search
@app.post("/api/search")
async def search(payload: dict):
    file_id = payload.get('file_id')
    
    query = payload.get('query')
    # Max rows to return after relevance filter (not "always N results")
    max_matches = min(int(payload.get('max_matches') or payload.get('top_k') or 100), 500)
    max_l2 = payload.get('max_l2_distance')
    if max_l2 is not None:
        max_l2 = float(max_l2)
    page = payload.get('page', 1)
    page_size = payload.get('page_size', 10)
    
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    if file_id and not file_exists(file_id):
        raise HTTPException(status_code=404, detail="file_id not found")
    
    # Calculate pagination
    if page < 1:
        page = 1
    
    ntotal = getattr(index.index, 'ntotal', 0) or 0
    if ntotal == 0:
        return JSONResponse({
            'query': query,
            'results': [],
            'total_count': 0,
            'page': page,
            'page_size': page_size,
            'total_pages': 0,
            'max_l2_distance_effective': max_l2 if max_l2 is not None else (DEFAULT_MAX_L2_DISTANCE if USE_DISTANCE_FILTER else None),
        })

    rel = payload.get('relevance_margin')
    relevance_margin = float(rel) if rel is not None else DEFAULT_RELEVANCE_MARGIN

    # Wider semantic pool so keyword filter still finds enough lines that literally match the query.
    pool_size = min(SEARCH_SEMANTIC_POOL, ntotal) if ntotal else 0
    keyword_only = payload.get('keyword_only', True)
    if isinstance(keyword_only, str):
        keyword_only = keyword_only.lower() not in ('0', 'false', 'no')

    pool = index.search(
        query,
        max_results=max(pool_size, 1),
        file_id=file_id,
        max_l2_distance=max_l2,
        relevance_margin=relevance_margin,
    )

    if keyword_only:
        all_results = _filter_sort_keyword_hits(pool, query)
    else:
        all_results = pool

    total_found = len(all_results)
    
    # Apply pagination
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_results = all_results[start_idx:end_idx]
    
    total_pages = (total_found + page_size - 1) // page_size if total_found > 0 else 0
    
    return JSONResponse({
        'query': query,
        'results': paginated_results,
        'total_count': total_found,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages,
        'max_l2_distance_effective': max_l2 if max_l2 is not None else (DEFAULT_MAX_L2_DISTANCE if USE_DISTANCE_FILTER else None),
    })

#POST /api/ask
@app.post("/api/ask")
async def ask(payload: dict):
    file_id = payload.get('file_id')
    query = payload.get('query')
    top_k = payload.get('top_k', 6)
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    if file_id and not file_exists(file_id):
        raise HTTPException(status_code=404, detail="file_id not found")
    
    results = index.search(query, max_results=int(top_k), file_id=file_id, max_l2_distance=None)

    # construct prompt (caller can swap in preferred LLM provider)
    context = "\n\n".join([h['text'] for h in results])
    prompt = f"You are an ops assistant. Use the context below (log excerpts) to answer the question. Provide a short JSON with keys: summary, probable_root_causes, actions, confidence.\n\nCONTEXT:\n{context}\n\nQUESTION:\n{query}" 
    
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    try:
        # Initialize client with minimal parameters to avoid version conflicts
        # Only pass api_key explicitly, let the library handle defaults
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Make the API call (removed timeout parameter to avoid version issues)
        llm_response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        answer = llm_response.choices[0].message.content
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        
        # Log the full error for debugging
        print(f"OpenAI API Error: {error_type}: {error_msg}")
        
        if "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=504,
                detail="OpenAI API request timed out. Please try again or check your network connection."
            )
        elif "insufficient_quota" in error_msg.lower() or "quota" in error_msg.lower() or error_type == "RateLimitError":
            raise HTTPException(
                status_code=429,
                detail="OpenAI API quota exceeded. Please check your billing and add credits to your OpenAI account at https://platform.openai.com/account/billing"
            )
        elif "api key" in error_msg.lower() or "authentication" in error_msg.lower() or "401" in error_msg:
            raise HTTPException(
                status_code=401,
                detail="OpenAI API authentication failed. Please check your API key in the .env file."
            )
        elif "proxies" in error_msg.lower():
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI client configuration error: {error_msg}. Try updating the openai library: pip install --upgrade openai"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API error ({error_type}): {error_msg}. Check your API key, network connection, and openai library version."
            )
    return JSONResponse({
        'answer': answer,
        'evidence': results
    })


#POST /api/summarize
@app.post("/api/summarize")
async def summarize(payload: dict):
    file_id = payload.get('file_id')
    if not file_id:
        raise HTTPException(status_code=400, detail="file_id is required")
    
    log_events = get_log_events(file_id)
    if not log_events:
        raise HTTPException(status_code=404, detail="No events found for file_id")
    
    # Use RAG to summarize: get relevant events via search, then LLM
    # For now, return basic summary
    error_count = sum(1 for e in log_events if e.get('level') in ['ERROR', 'CRITICAL'])
    summary_text = f"File contains {len(log_events)} events, {error_count} errors."
    
    # TODO: Add LLM-based summarization
    return JSONResponse({
        'message': 'Summarization completed',
        'summary': summary_text,
        'event_count': len(log_events),
        'error_count': error_count
    })

#GET /api/anomalies
@app.get("/api/anomalies")
async def anomalies():
    # Get anomalies from database (ERROR and CRITICAL level events)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        SELECT id, file_id, line_no, ts, level, source, message, asset 
        FROM events 
        WHERE level IN ('ERROR', 'CRITICAL', 'WARN')
        ORDER BY ts DESC
        LIMIT 100
    ''')
    rows = cur.fetchall()
    conn.close()
    
    anomalies_list = []
    for row in rows:
        anomalies_list.append({
            'id': row[0],
            'file_id': row[1],
            'line_no': row[2],
            'ts': row[3],
            'level': row[4],
            'source': row[5],
            'message': row[6],
            'asset': row[7]
        })
    
    return JSONResponse({
        'message': 'Anomalies detected',
        'anomalies': anomalies_list,
        'count': len(anomalies_list)
    })

#GET /api/timeline
@app.get("/api/timeline")
async def timeline(file_id: str = None):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    if file_id:
        cur.execute('''
            SELECT ts, level, source, message 
            FROM events 
            WHERE file_id = ? 
            ORDER BY ts ASC
        ''', (file_id,))
    else:
        cur.execute('''
            SELECT ts, level, source, message 
            FROM events 
            ORDER BY ts ASC
            LIMIT 1000
        ''')
    
    rows = cur.fetchall()
    conn.close()
    
    timeline_data = []
    for row in rows:
        timeline_data.append({
            'ts': row[0],
            'level': row[1],
            'source': row[2],
            'message': row[3]
        })
    
    return JSONResponse({
        'message': 'Timeline completed',
        'events': timeline_data,
        'count': len(timeline_data)
    })

