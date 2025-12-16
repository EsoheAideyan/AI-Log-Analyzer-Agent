import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional
pathlib import Path

VECTOR_STORE_DIR = Path("vector_store")
VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)

class LogEmbedder:
    