"""
Batch processing endpoints for portfolio-level scoring.
Handles CSV uploads, job management, and result retrieval.
"""

import logging
import os
from typing import Optional, List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.models.schemas import BatchJobResponse, BatchResultResponse, ErrorResponse
from app.models.database import BatchJob, BatchResult
from app.services.batch_processor import BatchProcessor
from app.api.v1.endpoints.scoring import get_scoring_service
from app.services.scorer import ScoringService
from app.database.session import get_db
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/batch", tags=["batch_processing"])


def get_batch_processor(
    db: Session = Depends(get_db),
    scoring_service: ScoringService = Depends(get_scoring_service),
) -> BatchProcessor:
    """Dependency: get initialized BatchProcessor."""
    return BatchProcessor(scoring_service=scoring_service, db=db)


@router.post(
    "/upload",
    response_model=BatchJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        202: {"description": "Job created and queued"},
        413: {"description": "File too large"},
        422: {"model": ErrorResponse},
    },
)
async def upload_batch(
    file: UploadFile = File(...),
    job_name: Optional[str] = None,
    db: Session = Depends(get_db),
    processor: BatchProcessor = Depends(get_batch_processor),
) -> BatchJobResponse:
    """Upload CSV file for batch portfolio scoring."""
    try:
        # Check file size
        contents = await file.read()
        file_size_mb = len(contents) / (1024 * 1024)
        
        if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE_MB}MB",
            )
            
        # Create uploads folder inside workspace
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        unique_filename = f"batch_{uuid4()}.csv"
        csv_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Save file to disk
        with open(csv_path, "wb") as f:
            f.write(contents)
            
        # Create job
        job_response = processor.create_batch_job(csv_file_path=csv_path, job_name=job_name)
        
        # Log to audit trail
        from app.services.governance import GovernanceService
        gov_service = GovernanceService(db)
        gov_service.log_event(
            event_type="batch",
            action="batch_upload",
            status="success",
            job_id=job_response.job_id,
            details={"job_name": job_response.job_name, "total_records": job_response.total_records},
        )
        
        return job_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}",
        )


@router.get(
    "/{job_id}",
    response_model=BatchJobResponse,
)
async def get_batch_status(
    job_id: str,
    processor: BatchProcessor = Depends(get_batch_processor),
) -> BatchJobResponse:
    """Get status and progress of a batch job."""
    try:
        return processor.get_batch_status(job_id)
    except Exception as e:
        logger.error(f"Status retrieval error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch job {job_id} not found",
        )


@router.get(
    "/{job_id}/results",
    response_model=List[BatchResultResponse],
)
async def get_batch_results(
    job_id: str,
    limit: int = 100,
    offset: int = 0,
    processor: BatchProcessor = Depends(get_batch_processor),
) -> List[BatchResultResponse]:
    """Get results from completed batch job with pagination."""
    try:
        return processor.get_batch_results(job_id, limit=limit, offset=offset)
    except Exception as e:
        logger.error(f"Results retrieval error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve results: {str(e)}",
        )


@router.get(
    "/{job_id}/summary",
    response_model=dict,
)
async def get_batch_summary(
    job_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get portfolio-level summary metrics for batch job."""
    job = db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch job {job_id} not found",
        )
        
    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Summary metrics are only available for completed jobs. Current status: {job.status}",
        )
        
    return job.summary_metrics or {}


@router.post(
    "/{job_id}/cancel",
    response_model=BatchJobResponse,
)
async def cancel_batch(
    job_id: str,
    processor: BatchProcessor = Depends(get_batch_processor),
) -> BatchJobResponse:
    """Cancel pending or processing batch job."""
    try:
        return processor.cancel_batch(job_id)
    except Exception as e:
        logger.error(f"Cancellation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to cancel batch job: {str(e)}",
        )


@router.get(
    "/{job_id}/download",
)
async def download_batch_results(
    job_id: str,
    format: str = "csv",
    processor: BatchProcessor = Depends(get_batch_processor),
):
    """Download batch results as CSV or JSON."""
    try:
        filepath = await processor.export_batch_results(job_id, format=format)
        
        if not os.path.exists(filepath):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export file was not generated"
            )
            
        filename = os.path.basename(filepath)
        media_type = "text/csv" if format == "csv" else "application/json"
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type=media_type,
        )
    except Exception as e:
        logger.error(f"Download error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download results: {str(e)}",
        )


@router.get(
    "/",
    response_model=List[BatchJobResponse],
)
async def list_batch_jobs(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> List[BatchJobResponse]:
    """List all batch jobs with optional status filter."""
    try:
        query = db.query(BatchJob)
        if status:
            query = query.filter(BatchJob.status == status)
            
        jobs = query.order_by(BatchJob.created_at.desc()).offset(offset).limit(limit).all()
        
        return [
            BatchJobResponse(
                job_id=j.job_id,
                job_name=j.job_name,
                status=j.status,
                total_records=j.total_records,
                processed_records=j.processed_records,
                created_at=j.created_at,
                started_at=j.started_at,
                completed_at=j.completed_at,
                summary_metrics=j.summary_metrics,
            )
            for j in jobs
        ]
    except Exception as e:
        logger.error(f"Jobs listing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list batch jobs: {str(e)}",
        )