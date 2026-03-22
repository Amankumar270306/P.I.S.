from fastapi import HTTPException
from uuid import UUID
from app.repositories.document_repo import DocumentRepository
from app.schemas.document import DocumentCreate, DocumentUpdate

class DocumentService:
    def __init__(self, repo: DocumentRepository):
        self.repo = repo

    def get_all(self, user_id: UUID):
        return self.repo.get_all(user_id)

    def create(self, user_id: UUID, doc_in: DocumentCreate):
        data = doc_in.model_dump()
        data["user_id"] = user_id
        return self.repo.create(data)

    def get_by_id(self, doc_id: UUID):
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc

    def update(self, doc_id: UUID, doc_in: DocumentUpdate):
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        data = doc_in.model_dump(exclude_unset=True)
        return self.repo.update(doc, data)

    def delete(self, doc_id: UUID):
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        self.repo.delete(doc)
