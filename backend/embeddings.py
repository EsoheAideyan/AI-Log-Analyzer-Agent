import os
import faiss
import numpy as np
import sqlite3
from sentence_transformers import SentenceTransformer


MODEL_NAME = os.environ.get('EMB_MODEL', 'all-MiniLM-L6-v2')
VECTOR_DIM = 384 # model dependent; all-MiniLM-L6-v2 => 384


class EmbeddingIndex:
    def __init__(self, index_path='./data/faiss.index', meta_db='./data/metadata.db'):
        self.index_path = index_path
        self.meta_db = meta_db
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        self.model = SentenceTransformer(MODEL_NAME)
        # try load index
        try:
            self.index = faiss.read_index(index_path)
            self._load_next_id()
        except Exception:
            self.index = faiss.IndexFlatL2(VECTOR_DIM)
            self.next_id = 1
        # ensure metadata table exists
        conn = sqlite3.connect(self.meta_db)
        cur = conn.cursor()
        cur.execute('''
        CREATE TABLE IF NOT EXISTS vectors 
        (id INTEGER PRIMARY KEY, 
        event_id TEXT, 
        file_id TEXT, 
        ts TEXT, 
        level TEXT, 
        source TEXT, 
        text TEXT)
        ''')
        conn.commit()
        conn.close()


    def _load_next_id(self):
        # naive: set next_id to index.ntotal + 1
        self.next_id = int(self.index.ntotal) + 1
        return self.next_id


    def save(self):
        faiss.write_index(self.index, self.index_path)
        return True


    def add_chunks(self, chunks):
        texts = [c['text'] for c in chunks]
        metas = [c['meta'] for c in chunks]
        vecs = self.model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
        if vecs.ndim == 1:
            vecs = np.expand_dims(vecs, axis=0)
        # append to FAISS
        self.index.add(vecs.astype('float32'))
        # persist metadata
        conn = sqlite3.connect(self.meta_db)
        cur = conn.cursor()
        base_id = int(self.index.ntotal) - len(texts) + 1
        for i, m in enumerate(metas):
            _id = base_id + i
            cur.execute('INSERT INTO vectors (id, event_id, file_id, ts, level, source, text) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (_id, m.get('event_id'), m.get('file_id'), m.get('ts'), m.get('level'), m.get('source'), texts[i]))
        conn.commit()
        conn.close()
        self.save()


    def search(self, query, top_k=6):
        # Encode query to vector
        query_vec = self.model.encode([query], show_progress_bar=False, convert_to_numpy=True)
        if query_vec.ndim == 1:
            query_vec = np.expand_dims(query_vec, axis=0)
        query_vec = query_vec.astype('float32')
        
        # Search in FAISS
        distances, indices = self.index.search(query_vec, top_k)
        
        # Retrieve metadata for results
        conn = sqlite3.connect(self.meta_db)
        cur = conn.cursor()
        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx < 0:  # FAISS returns -1 for invalid indices
                continue
            cur.execute('SELECT id, event_id, file_id, ts, level, source, text FROM vectors WHERE id = ?', (int(idx) + 1,))
            row = cur.fetchone()
            if row:
                results.append({
                    'id': row[0],
                    'event_id': row[1],
                    'file_id': row[2],
                    'ts': row[3],
                    'level': row[4],
                    'source': row[5],
                    'text': row[6],
                    'distance': float(dist)
                })
        conn.close()
        return results
