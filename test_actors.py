import asyncio
import os
import requests
import firebase_admin
from firebase_admin import credentials, auth

def main():
    service_account_path = os.path.join(os.environ["USERPROFILE"], "iCloudDrive", "vCISO", "firebase-service-account.json")
    if not os.path.exists(service_account_path):
        print("Service account file not found.")
        return
        
    cred = credentials.Certificate(service_account_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred, {'projectId': 'gen-lang-client-0873796692'})

    # Mint a custom token for demo account
    custom_token = auth.create_custom_token("Y90nJ2sC8Caj0H1fGf0N9bWcTrC3") # From frontend browser memory earlier

    # Get API key using powershell because lazy
    import subprocess
    api_key_res = subprocess.run(['powershell', '-Command', 'Invoke-RestMethod -Uri "https://vciso-frontend-457240052356.us-central1.run.app/api/config/firebase" | Select-Object -ExpandProperty apiKey'], capture_output=True, text=True)
    api_key = api_key_res.stdout.strip()
    
    # Exchange custom token for an ID token
    res = requests.post(f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}", json={"token": custom_token.decode("utf-8"), "returnSecureToken": True})
    
    data = res.json()
    if "idToken" not in data:
        print("Failed to get ID token", data)
        return
        
    id_token = data["idToken"]
    headers = {"Authorization": f"Bearer {id_token}"}
    
    # Hit the actors endpoint
    actors_res = requests.get("https://vciso-backend-457240052356.us-central1.run.app/api/v1/threat-intel/actors?org_id=default", headers=headers)
    print("STATUS:", actors_res.status_code)
    try:
        print("BODY:", actors_res.json())
    except Exception:
        print("BODY:", actors_res.text)

if __name__ == "__main__":
    main()
