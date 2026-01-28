import os
import time
import requests
from dotenv import load_dotenv
from notion_client import Client
from datetime import datetime

# Load environment variables
load_dotenv()

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")
BACKEND_URL = "http://127.0.0.1:8000/integrations/notion/sync"

def get_property_value(page, property_name, default=None):
    """Safe extraction of Notion property values"""
    props = page.get("properties", {})
    if property_name not in props:
        return default
    
    prop = props[property_name]
    prop_type = prop.get("type")
    
    if prop_type == "title":
        # Extract plain text from title array
        title_obj = prop.get("title", [])
        if title_obj:
            return title_obj[0].get("plain_text", default)
        return default
        
    elif prop_type == "rich_text":
        text_obj = prop.get("rich_text", [])
        if text_obj:
            return text_obj[0].get("plain_text", default)
        return default
        
    elif prop_type == "number":
        return prop.get("number", default)
        
    elif prop_type == "select":
        select_obj = prop.get("select")
        if select_obj:
            return select_obj.get("name", default)
        return default
        
    elif prop_type == "status":
        status_obj = prop.get("status")
        if status_obj:
            return status_obj.get("name", default)
        return default
        
    return default

def sync_notion():
    if not NOTION_API_KEY or not NOTION_DATABASE_ID:
        print("Error: NOTION_API_KEY or NOTION_DATABASE_ID not set in .env")
        return

    print("Initializing P.I.S. Notion Sync Service...")
    notion = Client(auth=NOTION_API_KEY)

    while True:
        print(f"\n[{datetime.now()}] Syncing Notion Database...")
        
        try:
            # 1. Fetch Pages (Filter: Status != Done)
            # You might need to adjust the property name "Status" to match your DB
            response = notion.databases.query(
                **{
                    "database_id": NOTION_DATABASE_ID,
                    "filter": {
                        "property": "Status",
                        "status": {
                            "does_not_equal": "Done"
                        }
                    }
                }
            )
            
            pages_to_sync = []
            
            for page in response.get("results", []):
                # 2. Extract & Map Data
                # Adjust 'Name' to match your Title property name
                title = get_property_value(page, "Name", "Untitled Task") 
                
                # Adjust 'Status' to match your Status property name
                status = get_property_value(page, "Status", "In Progress")
                
                # Check for an 'Energy' property (Number or Select)
                # If your property is named differently, change it here.
                # If it's a Select (Low/Med/High), you might need mapping logic.
                # Here we assume it's a Number 1-10 or we default to 5.
                energy = get_property_value(page, "Energy", 5)
                
                # 3. Construct Payload Object
                pages_to_sync.append({
                    "id": page["id"],
                    "title": title,
                    "status": status,
                    # backend schema expects 'pages' list of objects with id, title, status
                    # The backend logic currently defaults energy/context for new tasks in the sync endpoint
                    # If we want to pass energy, we'd need to update the backend schema to accept it in NotionPage
                })

            if pages_to_sync:
                print(f"Found {len(pages_to_sync)} active pages. Sending to Backend...")
                
                # 4. Push to Backend
                payload = { "pages": pages_to_sync }
                res = requests.post(BACKEND_URL, json=payload)
                
                if res.status_code == 200:
                    print(f"✅ Sync Success: {res.json()}")
                else:
                    print(f"❌ Backend Error: {res.text}")
            else:
                print("No active pages found to sync.")

        except Exception as e:
            print(f"Error during sync: {e}")

        print("Sleeping for 10 minutes...")
        time.sleep(600)

if __name__ == "__main__":
    try:
        sync_notion()
    except KeyboardInterrupt:
        print("\nStopping Notion Sync.")
