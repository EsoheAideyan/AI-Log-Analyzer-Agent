import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

def parse_log_file(path: Path) -> List[Dict]:
    """
    Parse a log file and extract structured log entries.
    
    This function handles common log formats:
    - Timestamp + Level + Message
    - ISO format timestamps
    - Simple line-by-line logs
    
    Returns a list of dictionaries with parsed log entries.
    """

    log_entries = []

    try:
        with open(str(path), 'r', encoding='utf-8', errors='ignore') as file:
            lines = file.readlines()

        for line_num, line in enumerate(lines, start=1):
            line = line.strip()
            if not line: #skip empty lines
                continue

            entry = parse_log_line(line, line_num)
            if entry:
                log_entries.append(entry)

    except Exception as e:
        print(f"Error parsing log file {path}: {str(e)}")
        return []
    
    return log_entries

def parse_log_line(line: str, line_num: int) -> Optional[Dict]:
    """
    Parse a single log line and extract structured log entry.
    
    This function handles common log formats:
    - Timestamp + Level + Message
    - ISO format timestamps
    - Simple line-by-line logs
    """

    entry = {
        'line_num': line_num,
        'raw': line,
        'timestamp': None,
        'level': None,
        'message': line
    }

    # Pattern 1: ISO format or date-time at start
    # Matches: "2024-01-01 10:00:00" or "2024-01-01T10:00:00Z"
    timestamp_pattern = r'^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[Z\s]?)'
    match = re.match(timestamp_pattern, line)

    if match:
        timestamp = match.group(1).strip()
        entry["timestamp"] = timestamp
        remaining = line[match.end():].strip()

        # Look for log level (INFO, ERROR, WARN, DEBUG, etc.)
        level_pattern = r'^\[?(\w+)\]?:?\s*'
        level_match = re.match(level_pattern, remaining, re.IGNORECASE)

        if level_match:
            entry["level"] = level_match.group(1).upper()
            entry["message"] = remaining[level_match.end():].strip()
        else:
            entry["message"] = remaining

    else:
        # Pattern 2: Log level at start (no timestamp)
        level_pattern = r'^(\w+):\s*'
        level_match = re.match(level_pattern, line, re.IGNORECASE)
        
        if level_match and level_match.group(1).upper() in ['INFO', 'ERROR', 'WARN', 'WARNING', 'DEBUG', 'TRACE', 'FATAL']:
            entry["level"] = level_match.group(1).upper()
            entry["message"] = line[level_match.end():].strip()
    
    return entry


def get_log_summary(log_entries: List[Dict]) -> Dict:
    """
    Generate a summary of parsed log entries.
    """

    total_lines = len(log_entries)
    levels = {}

    for entry in log_entries:
        level = entry.get('level', 'UNKNOWN')
        levels[level] = levels.get(level, 0) + 1

    return {
        'total_lines': total_lines,
        'levels': levels,
        "has_timestamps": any(entry.get('timestamp') for entry in log_entries)

    }



