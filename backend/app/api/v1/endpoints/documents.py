from fastapi import APIRouter, Depends
from uuid import UUID
from typing import List
from app.schemas.document import Document, DocumentCreate, DocumentUpdate
from app.services.document_service import DocumentService
from app.api.deps import get_document_service, require_auth

router = APIRouter()

@router.get("/", response_model=List[Document], summary="List all documents")
def read_documents(service: DocumentService = Depends(get_document_service), user_id: UUID = Depends(require_auth)):
    return service.get_all(user_id)

@router.post("/", response_model=Document, summary="Create a new document")
def create_document(doc: DocumentCreate, service: DocumentService = Depends(get_document_service), user_id: UUID = Depends(require_auth)):
    return service.create(user_id, doc)

@router.get("/{doc_id}", response_model=Document, summary="Get a document")
def read_document(doc_id: UUID, service: DocumentService = Depends(get_document_service), user_id: UUID = Depends(require_auth)):
    return service.get_by_id(doc_id)

@router.put("/{doc_id}", response_model=Document, summary="Update a document")
def update_document(doc_id: UUID, doc_update: DocumentUpdate, service: DocumentService = Depends(get_document_service), user_id: UUID = Depends(require_auth)):
    return service.update(doc_id, doc_update)

@router.delete("/{doc_id}", summary="Delete a document")
def delete_document(doc_id: UUID, service: DocumentService = Depends(get_document_service), user_id: UUID = Depends(require_auth)):
    service.delete(doc_id)
    return {"message": "Document deleted"}
