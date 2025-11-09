from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class ModerationSettingsCreate(BaseModel):
    category: str
    threshold: float
    is_enabled: bool = True

class ModerationSettingsUpdate(BaseModel):
    threshold: Optional[float] = None
    is_enabled: Optional[bool] = None

class ModerationSettingsResponse(BaseModel):
    id: int
    category: str
    threshold: float
    is_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ModerationResult(BaseModel):
    passed: bool
    category: str
    confidence: float
    warnings: list[str] = []

class ModerationLogResponse(BaseModel):
    id: int
    content: str
    category: str
    confidence: float
    flagged: bool
    action_taken: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
