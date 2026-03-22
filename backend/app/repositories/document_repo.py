from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional
from app.models.document import Document

class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, user_id: UUID) -> List[Document]:
        return self.db.query(Document).filter(Document.user_id == user_id).all()

    def get_by_id(self, doc_id: UUID) -> Optional[Document]:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def create(self, doc_data: Dict[str, Any]) -> Document:
        db_doc = Document(**doc_data)
        self.db.add(db_doc)
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def update(self, db_doc: Document, update_data: Dict[str, Any]) -> Document:
        for key, value in update_data.items():
            setattr(db_doc, key, value)
        self.db.add(db_doc)
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def delete(self, db_doc: Document) -> None:
        self.db.delete(db_doc)
        self.db.commit()
