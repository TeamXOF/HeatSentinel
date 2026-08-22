import sys
import os
from pathlib import Path

# Add the backend root to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
import asyncio
from app.config import get_settings

async def verify_api():
    settings = get_settings()
    
    if not settings.fortyguard_api_key:
        print("ERROR: FORTYGUARD_API_KEY is missing from environment/config.")
        sys.exit(1)
        
    url = "https://api.fortyguard.com/v1/system/fetch-api-key-usage"
    
    headers = {
        "api-key": settings.fortyguard_api_key,
        "accept": "application/json"
    }
    
    print(f"Connecting to: {url}")
    print("Sending POST request to fetch usage...")
    
    async with httpx.AsyncClient() as client:
        try:
            payload = {"api_key": settings.fortyguard_api_key}
            response = await client.post(url, headers=headers, json=payload)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("SUCCESS! API Key is valid.")
                print("Response Body:")
                print(response.json())
            else:
                print("FAILED.")
                print("Response Body:")
                print(response.text)
                
        except httpx.RequestError as e:
            print(f"HTTP Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify_api())
