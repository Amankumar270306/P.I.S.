from O365 import Account
import requests
import time
import datetime

# --- CONFIGURATION ---
# Register your app in Azure Portal (App Registrations) to get these credentials.
CLIENT_ID = 'YOUR_CLIENT_ID_HERE'
CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE'
BACKEND_URL = 'http://127.0.0.1:8000/integrations/outlook/webhook'

credentials = (CLIENT_ID, CLIENT_SECRET)
scopes = ['basic', 'message_all']

def sync_outlook():
    print("Initializing P.I.S. Outlook Sync Service...")
    
    account = Account(credentials)
    
    # Authenticate (Will print a URL to visit if not already authenticated)
    if not account.is_authenticated:
        account.authenticate(scopes=scopes)
        print("Authenticated successfully!")

    mailbox = account.mailbox()
    inbox = mailbox.get_folder(folder_name='Inbox')

    while True:
        print(f"\n[{datetime.datetime.now()}] Checking Inbox...")
        
        # Look back 10 minutes to overlap and ensure we don't miss anything due to sync delays
        delta = datetime.timedelta(minutes=10)
        query_time = datetime.datetime.now() - delta
        
        # Query for recent messages
        # Note: O365 library query syntax may vary, this is a standard pattern
        query = inbox.new_query().on_attribute('receivedDateTime').greater_equal(query_time)
        messages = inbox.get_messages(limit=25, query=query)

        for message in messages:
            try:
                # 1. Filter: Skip huge newsletters
                if len(message.body_preview) > 5000:
                    print(f"Skipping large email: {message.subject}")
                    continue
                
                # 2. Prepare Payload
                payload = {
                    "subject": message.subject,
                    "sender": message.sender.address,
                    "body": message.body_preview, # Use preview for summary
                    # "outlook_id": message.object_id # Use if we need exact deduping on backend
                }
                
                # 3. Send to P.I.S. Brain (Backend)
                response = requests.post(BACKEND_URL, json=payload)
                data = response.json()
                
                if data.get("action_taken") == "task_created":
                    print(f"✅ Created Task for: {message.subject}")
                else:
                    print(f"Checked: {message.subject} (No Action)")
                    
            except Exception as e:
                print(f"Error processing message: {e}")

        print("Sleeping for 5 minutes...")
        time.sleep(300)

if __name__ == "__main__":
    try:
        sync_outlook()
    except KeyboardInterrupt:
        print("\nStopping Sync Service.")
