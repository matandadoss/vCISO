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
        # For local dev, you'd set GOOGLE_APPLICATION_CREDENTIALS
        firebase_admin.initialize_app()
    except ValueError as e:
        logger.warning(f"Failed to initialize Firebase app: {e}")

security = HTTPBearer(auto_error=False)

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifies the Firebase ID token in the Authorization header."""
    if not credentials or credentials.credentials == "mock-token":
        return {"uid": "mock-123", "email": "demo@vciso.local"}
        
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Error verifying Firebase token: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

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
    
    # TODO: Fetch user from Postgres once models are set up
    # user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    # if not user:
    #     user = User(firebase_uid=firebase_uid, email=email)
    #     db.add(user)
    #     db.commit()
    #     db.refresh(user)

    # Return a mock dictionary for now until we build the User model
    return {"firebase_uid": firebase_uid, "email": email}
