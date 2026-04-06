import os
import faiss
import numpy as np
import sqlite3
from sentence_transformers import SentenceTransformer


MODEL_NAME = os.environ.get('EMB_MODEL', 'all-MiniLM-L6-v2')
VECTOR_DIM = 384  # model dependent; all-MiniLM-L6-v2 => 384

# Optional hard cap on squared L2 (only if SEARCH_USE_DISTANCE_FILTER=true or max_l2_distance passed).
USE_DISTANCE_FILTER = os.environ.get('SEARCH_USE_DISTANCE_FILTER', '').lower() in ('1', 'true', 'yes')
DEFAULT_MAX_L2_DISTANCE = float(os.environ.get('SEARCH_MAX_L2_DISTANCE', '1.2'))
# Search-only: keep neighbors within this margin (squared L2) of the best match — drops weak semantic hits.
DEFAULT_RELEVANCE_MARGIN = float(os.environ.get('SEARCH_RELEVANCE_MARGIN', '0.75'))


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
        self.index.add(vecs.astype('float32'))
        conn = sqlite3.connect(self.meta_db)
        cur = conn.cursor()
        base_id = int(self.index.ntotal) - len(texts) + 1
        for i, m in enumerate(metas):
            _id = base_id + i
            cur.execute(
                'INSERT INTO vectors (id, event_id, file_id, ts, level, source, text) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (_id, m.get('event_id'), m.get('file_id'), m.get('ts'), m.get('level'), m.get('source'), texts[i]),
            )
        conn.commit()
        conn.close()
        self.save()

    def search(
        self,
        query,
        max_results=500,
        file_id=None,
        max_l2_distance=None,
        relevance_margin=None,
    ):
        """
        Nearest neighbors by FAISS (squared L2). Optional:
        - max_l2_distance: hard ceiling (if USE_DISTANCE_FILTER or explicit).
        - relevance_margin: if set (or default for search API), drop rows farther than
          best_match_distance + margin so weak semantic hits are not all returned.
        """
        ntotal = int(getattr(self.index, 'ntotal', 0) or 0)
        if ntotal == 0:
            return []

        cap = min(max(1, int(max_results)), 10000)

        use_thresh = max_l2_distance is not None or USE_DISTANCE_FILTER
        if max_l2_distance is not None:
            thresh = float(max_l2_distance)
        elif USE_DISTANCE_FILTER:
            thresh = DEFAULT_MAX_L2_DISTANCE
        else:
            thresh = None

        apply_relevance = relevance_margin is not None
        margin = float(relevance_margin) if relevance_margin is not None else DEFAULT_RELEVANCE_MARGIN

        query_vec = self.model.encode([query], show_progress_bar=False, convert_to_numpy=True)
        if query_vec.ndim == 1:
            query_vec = np.expand_dims(query_vec, axis=0)
        query_vec = query_vec.astype('float32')

        # Pool size: enough candidates to trim by relevance without always returning cap weak hits.
        if apply_relevance:
            pool_limit = min(ntotal, max(cap * 8, 400, 100))
        elif file_id:
            pool_limit = min(ntotal, max(cap * 50, 500, 100))
        else:
            pool_limit = min(ntotal, max(cap, 50))

        conn = sqlite3.connect(self.meta_db)
        cur = conn.cursor()

        def collect_pool(inner: int, limit: int):
            out = []
            distances, indices = self.index.search(query_vec, inner)
            for idx, dist in zip(indices[0], distances[0]):
                if idx < 0:
                    continue
                if thresh is not None and dist > thresh:
                    break
                cur.execute(
                    'SELECT id, event_id, file_id, ts, level, source, text FROM vectors WHERE id = ?',
                    (int(idx) + 1,),
                )
                row = cur.fetchone()
                if not row:
                    continue
                if file_id and row[2] != file_id:
                    continue
                out.append({
                    'id': row[0],
                    'event_id': row[1],
                    'file_id': row[2],
                    'ts': row[3],
                    'level': row[4],
                    'source': row[5],
                    'text': row[6],
                    'distance': float(dist),
                })
                if len(out) >= limit:
                    break
            return out

        results = collect_pool(pool_limit, pool_limit)
        if file_id and len(results) < cap and pool_limit < ntotal:
            pool2 = min(ntotal, max(pool_limit * 2, 5000, cap * 50))
            if pool2 > pool_limit:
                results = collect_pool(pool2, pool2)

        if apply_relevance and results:
            best = results[0]['distance']
            results = [r for r in results if r['distance'] <= best + margin][:cap]
        else:
            results = results[:cap]

        conn.close()
        return results
