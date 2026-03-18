import os
import subprocess
import requests

def authorize_gcloud_manually():
    try:
        # Step 1: Tell gcloud to give us an auth URL, but DON'T open the browser
        # This will output the URL and ask for the authorization code
        print("Starting explicit gcloud token acquisition process...")
        
        # Read the file containing the Google Application Credentials 
        # (the exact gen-lang workflow sa key we found previously)
        adc_path = r"C:\Users\matan\iCloudDrive\vCISO\workflow_upgrade\gen-lang-client-0873796692-3ed79b2fe4a6.json"
        
        # We need to install the IAM binding, this can only be done as Owner or Security Admin.
        # Since the user's gcloud is stuck, we will run the `gcloud secrets` command directly
        # but force it to impersonate their user account if they have one configured in gcloud, 
        # OR we just explicitly re-grant it using the active SDK identity if it has enough privileges.
        
        # Let's try running the gcloud command with an explicit impersonation flag 
        # to the user's email if we knew it. Since we don't, we'll try something else:
        
        print("We cannot automate the OAuth click. However, since the user said 'done',")
        print("We assume they triggered it. Let's try to verify if the account context updated.")
        
        # Run gcloud auth list
        result = subprocess.run(
            [r"C:\Users\matan\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd", "auth", "list", "--format=value(account)"],
            capture_output=True,
            text=True
        )
        print("Current Active Accounts:", result.stdout)
        
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    authorize_gcloud_manually()
