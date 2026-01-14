# parsers.py
import re
import uuid
from dateutil import parser as dtparser


LOG_REGEXES = [
    re.compile(r"\[(?P<ts>[^\]]+)\]\s*(?P<level>INFO|WARN|ERROR|DEBUG)\s*(?P<source>[^:]+):\s*(?P<msg>.*)"),
    re.compile(r"(?P<ts>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s*(?P<level>INFO|WARN|ERROR|DEBUG)\s*(?P<source>[^:]+):\s*(?P<msg>.*)"),
    re.compile(r"(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s*(?P<level>INFO|WARN|ERROR|DEBUG)\s*(?P<msg>.*)")
]


ASSET_PATTERNS = [re.compile(r"asset[=_]?(?P<asset>[A-Za-z0-9_-]+)"), re.compile(r"deviceId[=:]?(?P<asset>[A-Za-z0-9_-]+)")]



def try_parse_ts(ts_str):
    try:
        return dtparser.parse(ts_str)
    except Exception:
        return None



def extract_asset(msg):
    for rg in ASSET_PATTERNS:
        m = rg.search(msg)
        if m:
            return m.group('asset')
    return None



def parse_log_file(path):
    events = []
    with open(path, 'r', errors='ignore') as fh:
        for line_no, raw in enumerate(fh):
            line = raw.strip()
            if not line:
                continue
            parsed = None
            for rg in LOG_REGEXES:
                m = rg.match(line)
                if m:
                    gd = m.groupdict()
                    ts = try_parse_ts(gd.get('ts')) if gd.get('ts') else None
                    ev = {
                        'id': str(uuid.uuid4()),
                        'line_no': line_no,
                        'ts': ts.isoformat() if ts else None,
                        'level': gd.get('level') if gd.get('level') else 'INFO',
                        'source': gd.get('source') if gd.get('source') else 'unknown',
                        'message': gd.get('msg') if gd.get('msg') else line,
                        'asset': extract_asset(gd.get('msg') if gd.get('msg') else line)
                    }
                    events.append(ev)
                    parsed = True
                    break
            if not parsed:
                # fallback: store as raw message    
                events.append({
                    'id': str(uuid.uuid4()),
                    'line_no': line_no,
                    'ts': None,
                    'level': 'INFO',
                    'source': 'raw',
                    'message': line,
                    'asset': extract_asset(line)
                })
    return events