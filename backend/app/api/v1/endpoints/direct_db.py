from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.db.session import get_db

router = APIRouter(
    prefix="/db",
    tags=["Direct Database Access"],
    responses={404: {"description": "Not found"}},
)

class SQLQuery(BaseModel):
    query: str
    params: Optional[Dict[str, Any]] = {}

@router.post("/execute", summary="Execute raw SQL query")
def execute_sql(sql: SQLQuery, db: Session = Depends(get_db)):
    try:
        statement = text(sql.query)
        result = db.execute(statement, sql.params or {})
        
        if result.returns_rows:
            rows = result.mappings().all()
            return [dict(row) for row in rows]
        else:
            db.commit()
            return {"status": "success", "rowcount": result.rowcount}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.get("/tables", summary="List database tables")
def list_tables(db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        result = db.execute(query)
        return [row[0] for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/structure", summary="Get database structure")
def get_structure(db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        """)
        result = db.execute(query)
        
        structure = {}
        for row in result:
            table, col, dtype = row[0], row[1], row[2]
            if table not in structure:
                structure[table] = []
            structure[table].append({"column": col, "type": dtype})
            
        return structure
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
