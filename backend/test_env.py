#!/usr/bin/env python3
"""Quick script to test if environment variables are loaded correctly"""

import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Check if API key is loaded
api_key = os.getenv('OPENAI_API_KEY')
openai_model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

print("=" * 50)
print("Environment Variable Check")
print("=" * 50)
print(f"OPENAI_API_KEY exists: {api_key is not None}")
print(f"OPENAI_API_KEY length: {len(api_key) if api_key else 0}")
print(f"OPENAI_API_KEY starts with 'sk-': {api_key.startswith('sk-') if api_key else False}")
print(f"OPENAI_MODEL: {openai_model}")
print("=" * 50)

if api_key:
    # Show first and last few characters (for verification)
    if len(api_key) > 10:
        masked = api_key[:10] + "..." + api_key[-10:]
        print(f"API Key (masked): {masked}")
    else:
        print(f"API Key: {api_key}")
    print("✅ API Key is configured!")
else:
    print("❌ API Key is NOT configured!")
    print("\nTroubleshooting:")
    print("1. Check if .env file exists in backend/ directory")
    print("2. Check if .env file has: OPENAI_API_KEY=sk-proj-...")
    print("3. Make sure there are NO spaces around the = sign")
    print("4. Make sure the API key is on its own line")

print("=" * 50)
