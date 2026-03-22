from fastapi import APIRouter, Depends
from uuid import UUID
from app.schemas.energy import IntegrationResponse, EnergyTransaction, SystemState, ConsistencyLogCreate, ConsistencyLog
from app.services.energy_service import EnergyService
from app.api.deps import get_energy_service, require_auth
from typing import List

router = APIRouter()
consistency_router = APIRouter()
system_router = APIRouter()

# --- Energy ---
@router.get("/today", summary="Get today's energy status")
def get_today_energy(service: EnergyService = Depends(get_energy_service), user_id: UUID = Depends(require_auth)):
    return service.get_today_energy(user_id)

@router.post("/reset", summary="Reset today's energy")
def reset_today_energy(service: EnergyService = Depends(get_energy_service), user_id: UUID = Depends(require_auth)):
    return service.reset_today_energy(user_id)

@router.post("/log", response_model=IntegrationResponse, summary="Log Energy Transaction")
def log_energy(payload: EnergyTransaction, service: EnergyService = Depends(get_energy_service), user_id: UUID = Depends(require_auth)):
    return service.log_energy(user_id, payload)

# --- System ---
@system_router.get("/state", response_model=SystemState, summary="Get System Pulse")
def get_system_state(service: EnergyService = Depends(get_energy_service), user_id: UUID = Depends(require_auth)):
    return service.get_system_state(user_id)

# --- Consistency ---
@consistency_router.post("/log", response_model=ConsistencyLog, summary="Log Daily Consistency")
def create_consistency_log(log: ConsistencyLogCreate, service: EnergyService = Depends(get_energy_service), user_id: UUID = Depends(require_auth)):
    # Quick bypass implementation to match existing repo
    return service.energy_repo.create_consistency_log(log.model_dump())

@consistency_router.get("/logs/{target_uid}", response_model=List[ConsistencyLog], summary="Get Consistency History")
def read_consistency_logs(target_uid: str, service: EnergyService = Depends(get_energy_service), user_id: UUID = Depends(require_auth)):
    return service.energy_repo.get_consistency_logs_by_user(UUID(target_uid))
