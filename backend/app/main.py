import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.auth import init_default_admin
from app.collectors.pipeline import seed_approved_sources, run_collection_all
from app.services.scheduler import start_scheduler, shutdown_scheduler

from app.routers import notices, sources, alerts, auth, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("scholartrack")
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ScholarTrack application lifecycle...")
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Initialize default admin & approved sources
    db = SessionLocal()
    try:
        init_default_admin(db)
        seeded_sources = seed_approved_sources(db)
        
        # Check if notices exist; if not, run initial collection
        from app.models.notice import Notice
        count = db.query(Notice).count()
        if count == 0:
            logger.info("Initial run: collecting approved sources data...")
            run_collection_all(db, use_live_network=False)
            logger.info(f"Initial collection complete. Notices in database: {db.query(Notice).count()}")
    except Exception as exc:
        logger.error(f"Error during application startup initialization: {exc}", exc_info=True)
    finally:
        db.close()

    # Start background scheduler
    start_scheduler()

    yield

    # Shutdown
    shutdown_scheduler()
    logger.info("ScholarTrack shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ScholarTrack: Verified, Source-Linked Scholarship & Fellowship Deadline Tracking Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Include Routers
app.include_router(notices.router, prefix=settings.API_V1_STR)
app.include_router(sources.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)

    return {
        "service": "ScholarTrack API",
        "status": "running",
        "docs": "/api/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ScholarTrack API",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }


if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
