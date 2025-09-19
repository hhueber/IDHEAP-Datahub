from fastapi import APIRouter, Depends, HTTPException, status, Response
from app.api.dependencies import get_current_user
from app.models.user import User as UserModel
from app.schemas.user import User, UserPublic

router = APIRouter()

@router.get("/me", response_model=UserPublic)
def get_current_user_profile(
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get current user's profile.
    
    Returns the complete profile information for the authenticated user,
    including private information like email address.
    """
    return current_user
