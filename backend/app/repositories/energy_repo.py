from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import List, Optional
from app.models.energy import EnergyLog, ConsistencyLog

class EnergyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_energy_log_by_date(self, user_id: UUID, target_date: date) -> Optional[EnergyLog]:
        return self.db.query(EnergyLog).filter(
            EnergyLog.user_id == user_id,
            EnergyLog.date == target_date
        ).first()

    def create_energy_log(self, user_id: UUID, target_date: date, total_capacity: float = 90.0, used_capacity: float = 0.0) -> EnergyLog:
        log = EnergyLog(date=target_date, user_id=user_id, total_capacity=total_capacity, used_capacity=used_capacity)
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def update_energy_log(self, log: EnergyLog) -> EnergyLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_consistency_log_by_date(self, user_id: UUID, target_date: date) -> Optional[ConsistencyLog]:
        return self.db.query(ConsistencyLog).filter(
            ConsistencyLog.user_id == user_id,
            ConsistencyLog.date == target_date
        ).first()

    def create_consistency_log(self, log_data: dict) -> ConsistencyLog:
        db_log = ConsistencyLog(**log_data)
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def update_consistency_log(self, log: ConsistencyLog) -> ConsistencyLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_consistency_logs_by_user(self, user_id: UUID) -> List[ConsistencyLog]:
        return self.db.query(ConsistencyLog).filter(ConsistencyLog.user_id == user_id).order_by(ConsistencyLog.date).all()
