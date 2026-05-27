import sqlite3
import os
from datetime import datetime, timezone

DB_PATH = os.environ.get('DB_PATH', './data/metadata.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

SCHEMA = '''
CREATE TABLE IF NOT EXISTS files (
id TEXT PRIMARY KEY,
filename TEXT,
path TEXT,
uploaded_at TEXT,
parsed INTEGER DEFAULT 0
);


CREATE TABLE IF NOT EXISTS events (
id TEXT PRIMARY KEY,
file_id TEXT,
line_no INTEGER,
ts TEXT,
level TEXT,
source TEXT,
message TEXT,
asset TEXT
);
'''

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(SCHEMA)
    conn.commit()
    conn.close()

def insert_file_record(file_id, filename, path):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('INSERT OR REPLACE INTO files (id, filename, path, uploaded_at, parsed) VALUES (?, ?, ?, ?, ?)',
    (file_id, filename, path, datetime.now(timezone.utc).isoformat(), 0))
    conn.commit()
    conn.close()

def mark_file_parsed(file_id, parsed=True):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('UPDATE files SET parsed = ? WHERE id = ?', (1 if parsed else 0, file_id))
    conn.commit()
    conn.close()
    

def insert_events_bulk(file_id, events):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    rows = []
    for ev in events:
        rows.append((ev['id'], file_id, ev.get('line_no'), ev.get('ts'), ev.get('level'), ev.get('source'), ev.get('message'), ev.get('asset')))
    cur.executemany('INSERT INTO events (id, file_id, line_no, ts, level, source, message, asset) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', rows)
    conn.commit()
    conn.close()

def file_exists(file_id):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT id FROM files WHERE id = ?', (file_id,))
    ok = cur.fetchone() is not None
    conn.close()
    return ok

def get_file_status(file_id):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT id, filename, uploaded_at, parsed FROM files WHERE id = ?', (file_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return {'file_id': file_id, 'found': False}
    return {
        'file_id': row[0],
        'filename': row[1],
        'uploaded_at': row[2],
        'parsed': bool(row[3]),
        'found': True,
    }

def get_log_events(file_id):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT id, file_id, line_no, ts, level, source, message, asset FROM events WHERE file_id = ? ORDER BY line_no', (file_id,))
    rows = cur.fetchall()
    conn.close()
    events = []
    for row in rows:
        events.append({
            'id': row[0],
            'file_id': row[1],
            'line_no': row[2],
            'ts': row[3],
            'level': row[4],
            'source': row[5],
            'message': row[6],
            'asset': row[7]
        })
    return events

def get_event(event_id):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT id, file_id, line_no, ts, level, source, message, asset FROM events WHERE id = ?', (event_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {
        'id': row[0],
        'file_id': row[1],
        'line_no': row[2],
        'ts': row[3],
        'level': row[4],
        'source': row[5],
        'message': row[6],
        'asset': row[7]
    }