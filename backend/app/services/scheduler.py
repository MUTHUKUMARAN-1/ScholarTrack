import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.database import SessionLocal
from app.collectors.pipeline import run_collection_all

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def scheduled_collection_job():
    logger.info("Running scheduled background scholarship collection...")
    db = SessionLocal()
    try:
        runs = run_collection_all(db, use_live_network=True)
        logger.info(f"Scheduled collection completed. Processed {len(runs)} sources.")
    except Exception as exc:
        logger.error(f"Error during scheduled collection: {exc}", exc_info=True)
    finally:
        db.close()


def start_scheduler():
    if not settings.SCHEDULER_ENABLED:
        logger.info("Background scheduler is disabled by configuration.")
        return

    if not scheduler.running:
        scheduler.add_job(
            scheduled_collection_job,
            trigger=IntervalTrigger(minutes=settings.DEFAULT_COLLECTION_INTERVAL_MINUTES),
            id="periodic_scholarship_collection",
            name="Periodic Scholarship Data Collection",
            replace_existing=True,
        )
        scheduler.start()
        logger.info(f"Background scheduler started with interval {settings.DEFAULT_COLLECTION_INTERVAL_MINUTES}m.")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler shut down.")
