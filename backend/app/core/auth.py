import os
from fastapi import HTTPException, Security, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
from app.db.session import get_db
from sqlalchemy.orm import Session
from sqlalchemy.future import select
import logging
logger = logging.getLogger(__name__)
# We will create app.models.user shortly
# from app.models.user import User 

# Initialize Firebase Admin
# In production, use a service account key file path or default credentials
if not firebase_admin._apps:
    try:
        # If running in GCP, it can use default credentials
        # Cloud Run does not automatically inject GOOGLE_CLOUD_PROJECT, so we explicitly define it.
        # Alternatively, we could fetch from gcp metadata server or env vars.
        options = {}
        if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            # When using application default credentials, Firebase Admin SDK needs the project ID explicitly
            options = {'projectId': 'gen-lang-client-0873796692'}
            
        firebase_admin.initialize_app(options=options)
    except ValueError as e:
        logger.warning(f"Failed to initialize Firebase app: {e}")

security = HTTPBearer(auto_error=False)

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifies the Firebase ID token in the Authorization header."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    token = credentials.credentials
    
    # Allow mock token for local development
    if token == "mock-token" or os.environ.get("ENVIRONMENT") == "local":
        return {
            "uid": "mock-uid",
            "email": "demo@vciso.local",
            "roles": ["admin"],
            "org_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        }
        
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Error verifying Firebase token: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {str(e)}")

async def get_current_user(
    decoded_token: dict = Depends(verify_firebase_token),
    # db: Session = Depends(get_db)
):
    """
    Retrieves the current user from the database based on the Firebase UID.
    If the user doesn't exist, this function could create it.
    """
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    
    # Extract roles from the decoded token (custom claims in Firebase)
    # For the mock user or if none exist, we default to providing admin capabilities during dev
    roles = decoded_token.get("roles", ["admin", "analyst"])

    # Return a mock dictionary for now until we build the User model
    return {
        "firebase_uid": firebase_uid, 
        "email": email,
        "roles": roles,
        "org_id": decoded_token.get("org_id", "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    }

def require_role(required_role: str):
    """
    Dependency factory to enforce role-based access control.
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        roles = current_user.get("roles", [])
        if required_role not in roles:
            logger.warning(f"Access denied: User {current_user.get('email')} lacks required role '{required_role}'")
            raise HTTPException(
                status_code=403, 
                detail=f"Operation not permitted. Requires role: {required_role}"
            )
        return current_user
    return role_checker
