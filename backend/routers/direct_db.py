from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from database import get_db

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
    """
    Execute a raw SQL query against the database.
    WARNING: This is a high-privilege endpoint.
    """
    try:
        # Wrap the query in sqlalchemy text()
        statement = text(sql.query)
        result = db.execute(statement, sql.params or {})
        
        # Determine if it's a SELECT query to return rows
        if result.returns_rows:
            # Convert rows to list of dicts
            rows = result.mappings().all()
            # Convert to regular dicts for JSON serialization
            return [dict(row) for row in rows]
        else:
            # Commit for INSERT/UPDATE/DELETE
            db.commit()
            return {"status": "success", "rowcount": result.rowcount}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.get("/tables", summary="List database tables")
def list_tables(db: Session = Depends(get_db)):
    """
    List all tables in the public schema.
    """
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
    """
    Get detailed structure (columns, types) for all tables.
    """
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
            table = row[0]
            col = row[1]
            dtype = row[2]
            
            if table not in structure:
                structure[table] = []
            
            structure[table].append({"column": col, "type": dtype})
            
        return structure
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
