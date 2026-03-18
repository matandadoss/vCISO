from google.cloud import secretmanager
from google.oauth2 import service_account

def set_secret_policy():
    # Use the discovered service account that has project Owner/Editor rights
    # We found this file earlier in the workflow_upgrade directory
    client = secretmanager.SecretManagerServiceClient.from_service_account_json(
        r'C:\Users\matan\iCloudDrive\vCISO\workflow_upgrade\gen-lang-client-0873796692-3ed79b2fe4a6.json'
    )
    
    project_id = "gen-lang-client-0873796692"
    secret_id = "firebase-config"
    name = f"projects/{project_id}/secrets/{secret_id}"
    
    # Get the current IAM policy
    policy = client.get_iam_policy(request={"resource": name})
    
    # Add the Cloud Run service account
    policy.bindings.add(
        role="roles/secretmanager.secretAccessor",
        members=["serviceAccount:457240052356-compute@developer.gserviceaccount.com"]
    )
    
    # Update the policy
    new_policy = client.set_iam_policy(request={"resource": name, "policy": policy})
    print(f"Successfully updated IAM policy for {secret_id}")
    print(new_policy)

if __name__ == "__main__":
    try:
        set_secret_policy()
    except Exception as e:
        print(f"Failed: {e}")
