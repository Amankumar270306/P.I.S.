from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime
from uuid import UUID

class DocumentBase(BaseModel):
    title: str
    content: Optional[Any] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Any] = None

class Document(DocumentBase):
    id: UUID
    created_at: datetime
    last_edited: datetime
    
    model_config = ConfigDict(from_attributes=True)
