from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import UserProfile, UserSyncRequest

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TalentIQ AI Core API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected"
    }

@router.get("/auth/me", response_model=UserProfile)
async def get_my_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    user_doc = await db.get_document("users", current_user.uid)
    if not user_doc:
        # Create default profile
        now = datetime.now(timezone.utc).isoformat()
        user_doc = {
            "id": current_user.uid,
            "email": current_user.email,
            "displayName": current_user.display_name,
            "photoUrl": current_user.photo_url,
            "organization": "Recruitment Team",
            "role": "recruiter",
            "createdAt": now,
            "updatedAt": now,
            "settings": {
                "defaultWeights": {"requiredSkills": 40, "experience": 25, "projects": 20, "educationCerts": 15}
            }
        }
        await db.set_document("users", current_user.uid, user_doc)
    
    return UserProfile(**user_doc)

@router.post("/auth/sync", response_model=UserProfile)
async def sync_user_profile(
    req: UserSyncRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.get_document("users", current_user.uid)
    if existing:
        updates = {"updatedAt": now}
        if req.displayName:
            updates["displayName"] = req.displayName
        if req.photoUrl:
            updates["photoUrl"] = req.photoUrl
        if req.organization:
            updates["organization"] = req.organization
        updated = await db.update_document("users", current_user.uid, updates)
        return UserProfile(**updated)
    else:
        user_doc = {
            "id": current_user.uid,
            "email": current_user.email,
            "displayName": req.displayName or current_user.display_name,
            "photoUrl": req.photoUrl or current_user.photo_url,
            "organization": req.organization or "Recruitment Team",
            "role": "recruiter",
            "createdAt": now,
            "updatedAt": now,
            "settings": {
                "defaultWeights": {"requiredSkills": 40, "experience": 25, "projects": 20, "educationCerts": 15}
            }
        }
        await db.set_document("users", current_user.uid, user_doc)
        return UserProfile(**user_doc)
