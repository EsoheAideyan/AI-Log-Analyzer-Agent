import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .log_parser import parse_log_file, get_log_summary

app = FastAPI()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/upload")
async def upload_log(file: UploadFile = File(...)):
    """
    Upload a log file to the server.
    
    This endpoint receives a log file, saves it, and returns metadata about it.
    """
    # Validate file type (optional - you can be more strict)
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Create a safe filename
    safe_filename = file.filename.replace(" ", "_")
    file_path = UPLOAD_DIR / safe_filename
    
    # Save the file
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Parse the log file
        log_entries = parse_log_file(file_path)
        summary = get_log_summary(log_entries)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        return {
            "message": "File uploaded successfully",
            "filename": safe_filename,
            "file_size": file_size,
            "file_path": str(file_path),
            "parsed_summary": len(log_entries),
            "summary": summary,
            "sample_entries": log_entries[:5]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")