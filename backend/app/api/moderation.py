from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.user import User
from app.models.moderation import ModerationSettings, ModerationLog
from app.schemas.moderation import (
    ModerationSettingsCreate,
    ModerationSettingsUpdate,
    ModerationSettingsResponse,
    ModerationLogResponse
)

router = APIRouter()

@router.post("/settings", response_model=ModerationSettingsResponse)
async def create_moderation_settings(
    settings_data: ModerationSettingsCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create moderation settings (Admin only)"""
    # Check if settings for category already exist
    existing = db.query(ModerationSettings).filter(
        ModerationSettings.category == settings_data.category
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Settings for this category already exist"
        )
    
    settings = ModerationSettings(
        category=settings_data.category,
        threshold=settings_data.threshold,
        is_enabled=settings_data.is_enabled
    )
    
    db.add(settings)
    db.commit()
    db.refresh(settings)
    
    return ModerationSettingsResponse.from_orm(settings)

@router.get("/settings", response_model=List[ModerationSettingsResponse])
async def get_moderation_settings(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all moderation settings (Admin only)"""
    settings = db.query(ModerationSettings).all()
    return [ModerationSettingsResponse.from_orm(s) for s in settings]

@router.patch("/settings/{category}", response_model=ModerationSettingsResponse)
async def update_moderation_settings(
    category: str,
    settings_data: ModerationSettingsUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update moderation settings (Admin only)"""
    settings = db.query(ModerationSettings).filter(
        ModerationSettings.category == category
    ).first()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found"
        )
    
    update_data = settings_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    return ModerationSettingsResponse.from_orm(settings)

@router.get("/logs", response_model=List[ModerationLogResponse])
async def get_moderation_logs(
    skip: int = 0,
    limit: int = 100,
    flagged_only: bool = False,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get moderation logs (Admin only)"""
    query = db.query(ModerationLog)
    
    if flagged_only:
        query = query.filter(ModerationLog.flagged == True)
    
    logs = query.order_by(ModerationLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return [ModerationLogResponse.from_orm(log) for log in logs]

@router.get("/logs/{log_id}", response_model=ModerationLogResponse)
async def get_moderation_log(
    log_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get specific moderation log (Admin only)"""
    log = db.query(ModerationLog).filter(ModerationLog.id == log_id).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log not found"
        )
    
    return ModerationLogResponse.from_orm(log)

@router.get("/stats")
async def get_moderation_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get moderation statistics (Admin only)"""
    total_logs = db.query(ModerationLog).count()
    flagged_logs = db.query(ModerationLog).filter(ModerationLog.flagged == True).count()
    
    # Get category breakdown
    categories = {}
    for category in ["hate", "violence", "weapons", "religion", "safety", "health", "harassment", "sexual"]:
        count = db.query(ModerationLog).filter(
            ModerationLog.category == category,
            ModerationLog.flagged == True
        ).count()
        categories[category] = count
    
    return {
        "total_checked": total_logs,
        "total_flagged": flagged_logs,
        "pass_rate": (total_logs - flagged_logs) / total_logs if total_logs > 0 else 1.0,
        "categories": categories
    }
