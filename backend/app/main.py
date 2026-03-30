from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.api.v1.router import api_router
from app.db.seed import seed_permanent_lists

try:
    import app.models  # Ensures all models are imported before metadata creation
    Base.metadata.create_all(bind=engine)

    # Seed permanent task lists on startup
    _db = SessionLocal()
    try:
        seed_permanent_lists(_db)
    finally:
        _db.close()
except Exception as e:
    print("Database initialization skipped or failed:", e)

app = FastAPI(
    title="P.I.S. AI Engine",
    description="Backend API for Personal Intelligence Scheduler, optimized for AI Agents.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom dependency mounting for header -> uuid translation was historically middleware in main.oy 
# Let's map it into a middleware here:
from fastapi import Request
import uuid
@app.middleware("http")
async def intercept_user_header(request: Request, call_next):
    # This was previously setting a global state `current_user_id` inside direct endpoints. 
    # With Depends(), we don't strictly need global context but let's keep it harmless.
    response = await call_next(request)
    return response

app.include_router(api_router)
