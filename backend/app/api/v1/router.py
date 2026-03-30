from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, tasks, energy, documents, direct_db, chat

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tasks.tasks_router, prefix="/tasks", tags=["tasks"])
api_router.include_router(tasks.lists_router, prefix="/lists", tags=["lists"])
api_router.include_router(energy.router, prefix="/energy", tags=["energy"])
api_router.include_router(energy.system_router, prefix="/system", tags=["system"])
api_router.include_router(energy.consistency_router, prefix="/consistency", tags=["consistency"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(direct_db.router)
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
