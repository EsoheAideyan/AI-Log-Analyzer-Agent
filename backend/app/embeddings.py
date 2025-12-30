import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional
pathlib import Path

VECTOR_STORE_DIR = Path("vector_store")
VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)

class LogEmbedder:
    """
    Handles embedding of log entries and managing the vector store.
    """

    def __init__(slef, model_name: str = "all-MiniLM-L6-v2"):

        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.index = None
        self.log_entries = []
        self.index_path = VECTOR_STORE_DIR / "log_index.faiss"
        self.metadata_path = VECTOR_STORE_DIR / "log_metadata.pkl"

    def create_embeddings(self, log_entries: List[Dict]) -> np.ndarray:
        """
        Create embeddings for a list of log entries.
        """
        # Convert log entries to text strings
        texts = []
        for entry in log_entries:
            # Create a searchable text representation
            text_parts = []
            if entry.get('timestamp'):
                text_parts.append(f"Time: [{entry['timestamp']}]")

            if entry.get('level'):
                text_parts.append(f"Level: [{entry['level']}]")

            if entry.get('message'):
                text_parts.append(f"Message: [{entry['message']}]")

            text = " | ".join(text_parts)
            texts.append(text)

        print(f"Creating embeddings for {len(texts)} log entries...")
        embeddings = self.model.encode(texts, show_progress_bar=True)

        return embeddings.astype('float32')

    def build_index(self, log_entries: List[Dict], embeddings: np.ndarray):
        """
        Build a FAISS index from the log entries and embeddings.
        This creates a searchable vector database.
        """
        #Create a FAISS index (L2 distance)
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(embeddings)

        self.log_entries = log_entries

    def save_index(self):
        """ Save the index and metadata to disk."""
        if self.index is None:
            return

        #Save the index
        faiss.write_index(self.index, self.index_path)

        #Save the metadata
        with open(self.metadata_path, 'wb') as f:
            pickle.dump(self.log_entries, f)

        print(f"Index and metadata saved to {self.index_path} and {self.metadata_path}")

    def load_index(self):
        """ Load the index and metadata from disk. Returns True if successful, False otherwise."""
        if not self.index_path.exists() or not self.metadata_path.exists():
            return

        try:
            #Load the index
            self.index = faiss.read_index(self.index_path)

            #Load the metadata
            with open(self.metadata_path, 'rb') as f:
                self.log_entries = pickle.load(f)

            print(f"Index and metadata loaded from {self.index_path} and {self.metadata_path}")
            print(f"Loaded index with {self.index.ntotal} vectors")
            return True

        except Exception as e:
            print(f"Error loading index and metadata: {e}")
            return False
 
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search for similar log entries using semantic search.
        
        Args:
            query: Search query text
            top_k: Number of results to return
            
        Returns:
            List of log entries with similarity scores
        """

        if self.index is None or len(self.log_entries) == 0:
            return []

        #Encode the query
        query_embedding = self.model.encode([query])
        query_embedding = query_embedding.astype('float32')

        #Search the index
        distances, indices = self.index.search(query_embedding, min(top_k, len(self.log_entries)))

        results = []
    
