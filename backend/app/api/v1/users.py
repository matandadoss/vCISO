import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.domain import User, Organization
from app.schemas.user import UserResponse, UserUpdate, UserInvite
from app.services.email import send_invite_email

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    org_id_str = current_user.get("org_id")
    if not org_id_str:
        raise HTTPException(status_code=400, detail="User organization not found")
    org_id = uuid.UUID(org_id_str)
        
    result = await db.execute(select(User).where(User.org_id == org_id))
    return result.scalars().all()

@router.post("/invite", response_model=UserResponse)
async def invite_user(invite: UserInvite, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    roles = current_user.get("roles", [])
    if "admin" not in roles and "Super Admin" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized to invite users")
    
    org_id = uuid.UUID(current_user.get("org_id"))
    
    # Check if user exists
    existing = await db.execute(select(User).where(User.email == invite.email, User.org_id == org_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists in organization")

    new_user = User(
        id=uuid.uuid4(),
        org_id=org_id,
        email=invite.email,
        firebase_uid=f"pending_{uuid.uuid4()}", # Dummy UID until they sign up
        role=invite.role,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Fetch Org Name for the email
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    org_name = org.name if org else "the platform"
    
    # Create the invitation link using the dummy firebase UID (or generate a specific invite token)
    frontend_url = "https://vciso-frontend-457240052356.us-central1.run.app"
    invite_link = f"{frontend_url}/auth/accept-invite?token={new_user.firebase_uid}"
    
    # Send the email asynchronously
    import asyncio
    asyncio.create_task(send_invite_email(to_email=invite.email, org_name=org_name, role=invite.role, invite_link=invite_link))
    
    return new_user

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(user_id: uuid.UUID, user_update: UserUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    roles = current_user.get("roles", [])
    if "admin" not in roles and "Super Admin" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    org_id = uuid.UUID(current_user.get("org_id"))
    result = await db.execute(select(User).where(User.id == user_id, User.org_id == org_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
        
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    roles = current_user.get("roles", [])
    if "admin" not in roles and "Super Admin" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized to delete users")
        
    org_id = uuid.UUID(current_user.get("org_id"))
    result = await db.execute(select(User).where(User.id == user_id, User.org_id == org_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Soft delete instead of hard delete
    user.is_active = False
    await db.commit()
