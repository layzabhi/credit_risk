"""
Batch processor service: handles portfolio-level scoring and result aggregation.
Manages async job queue, progress tracking, and results export.
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
import uuid
import os

import pandas as pd
from sqlalchemy.orm import Session

from app.models.schemas import ScoringRequest, BatchJobResponse, BatchResultResponse
from app.models.database import BatchJob, BatchResult
from app.services.scorer import ScoringService
from app.core.exceptions import ValidationException, ApplicationException
from app.database.session import get_db_context

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    """Batch job status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BatchProcessor:
    """
    Portfolio batch processing service.
    
    Workflow:
    1. Parse CSV upload (validate schema)
    2. Create batch job record
    3. Queue scoring tasks
    4. Process asyncly with progress tracking
    5. Aggregate results
    6. Generate portfolio metrics
    7. Export results
    """
    
    # Global job queue and status tracker
    _jobs: Dict[str, BatchJobResponse] = {}
    _job_tasks: Dict[str, asyncio.Task] = {}
    
    def __init__(
        self,
        scoring_service: ScoringService,
        db: Session,
    ):
        """
        Initialize batch processor.
        
        Args:
            scoring_service: ScoringService for inference
            db: Database session
        """
        self.scoring_service = scoring_service
        self.db = db
        logger.info("BatchProcessor initialized")
    
    def create_batch_job(
        self,
        csv_file_path: str,
        job_name: Optional[str] = None,
    ) -> BatchJobResponse:
        """
        Create and queue batch job from CSV file.
        
        Args:
            csv_file_path: Path to uploaded CSV file
            job_name: Optional descriptive name
            
        Returns:
            BatchJobResponse with job_id and initial status
            
        Raises:
            ValidationException: If CSV parsing fails
        """
        job_id = str(uuid.uuid4())
        
        try:
            # Parse CSV
            df = pd.read_csv(csv_file_path)
            logger.info(f"Parsed CSV with {len(df)} rows")
            
            # Validate schema
            required_columns = [
                "age", "gender", "education_level", "marital_status",
                "income", "credit_score", "loan_amount", "loan_purpose",
                "employment_status", "years_at_current_job", "payment_history",
                "debt_to_income_ratio", "assets_value", "number_of_dependents",
                "previous_defaults",
            ]
            
            missing_cols = set(required_columns) - set(df.columns)
            if missing_cols:
                raise ValidationException(
                    message="CSV schema validation failed",
                    details={"missing_columns": list(missing_cols)},
                )
            
            # Create DB record
            db_job = BatchJob(
                job_id=job_id,
                job_name=job_name or f"Batch_{job_id[:8]}",
                status=JobStatus.PENDING.value,
                total_records=len(df),
                processed_records=0,
                failed_records=0,
                csv_file_path=csv_file_path,
                created_at=datetime.utcnow(),
            )
            self.db.add(db_job)
            self.db.commit()
            logger.info(f"Created batch job: {job_id}")
            
            # Create response object
            job_response = BatchJobResponse(
                job_id=job_id,
                job_name=db_job.job_name,
                status=JobStatus.PENDING.value,
                total_records=len(df),
                processed_records=0,
                created_at=db_job.created_at,
            )
            
            self._jobs[job_id] = job_response
            
            # Queue async processing task and store reference
            task = asyncio.create_task(self._process_batch(job_id, df))
            self._job_tasks[job_id] = task
            
            return job_response
        
        except pd.errors.ParserError as e:
            logger.error(f"CSV parsing failed: {e}")
            raise ValidationException(
                message="CSV parsing failed",
                details={"error": str(e)},
            )
        except Exception as e:
            logger.error(f"Batch job creation failed: {e}", exc_info=True)
            raise ApplicationException(
                message="Batch job creation failed",
                details={"error": str(e)},
            )
    
    async def _process_batch(self, job_id: str, df: pd.DataFrame):
        """Process batch asynchronously in a separate database session context."""
        try:
            # Create a separate connection session context for background safety
            with get_db_context() as db:
                db_job = db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
                if not db_job:
                    logger.error(f"Job {job_id} not found in DB inside background task")
                    return
                
                # Update status to processing
                db_job.status = JobStatus.PROCESSING.value
                db_job.started_at = datetime.utcnow()
                db.commit()
                
                if job_id in self._jobs:
                    self._jobs[job_id].status = JobStatus.PROCESSING.value
                    self._jobs[job_id].started_at = db_job.started_at
                
                logger.info(f"Processing batch {job_id}: {len(df)} records")
                
                results = []
                for idx, row in df.iterrows():
                    # Handle task cancellation
                    try:
                        current_task = asyncio.current_task()
                        if current_task and current_task.cancelled():
                            logger.info(f"Background task for batch job {job_id} was cancelled")
                            return
                    except Exception as ce:
                        logger.warning(f"Error checking cancellation status: {ce}")
                    
                    try:
                        # Convert row to ScoringRequest
                        row_dict = row.to_dict()
                        # Ensure applicant_id is set
                        if "applicant_id" not in row_dict or pd.isna(row_dict["applicant_id"]):
                            row_dict["applicant_id"] = str(uuid.uuid4())
                            
                        request = ScoringRequest(**row_dict)
                        
                        # Score applicant
                        response = self.scoring_service.score_applicant(request)
                        
                        # Store result record
                        db_result = BatchResult(
                            batch_result_id=str(uuid.uuid4()),
                            job_id=job_id,
                            applicant_id=response.applicant_id,
                            risk_rating=response.risk_rating.value,
                            default_probability=response.default_probability,
                            confidence_score=response.confidence_score,
                            result_data=response.dict(),
                            created_at=datetime.utcnow(),
                        )
                        db.add(db_result)
                        results.append(response)
                        
                        # Update progress
                        db_job.processed_records += 1
                        db.commit()
                        
                        if job_id in self._jobs:
                            self._jobs[job_id].processed_records = db_job.processed_records
                            
                    except Exception as e:
                        logger.warning(f"Failed to score record {idx} for job {job_id}: {e}")
                        db_job.failed_records = (db_job.failed_records or 0) + 1
                        db.commit()
                        continue
                    
                    # Yield event loop every 10 records
                    if (idx + 1) % 10 == 0:
                        await asyncio.sleep(0.01)
                
                # Compute aggregate metrics if we scored any successfully
                if results:
                    ratings_dist = pd.Series([r.risk_rating.value for r in results]).value_counts().to_dict()
                    probabilities = [r.default_probability for r in results]
                    
                    db_job.status = JobStatus.COMPLETED.value
                    db_job.completed_at = datetime.utcnow()
                    db_job.summary_metrics = {
                        "ratings_distribution": ratings_dist,
                        "mean_probability": float(pd.Series(probabilities).mean()),
                        "std_probability": float(pd.Series(probabilities).std()) if len(probabilities) > 1 else 0.0,
                        "min_probability": float(min(probabilities)),
                        "max_probability": float(max(probabilities)),
                    }
                    db.commit()
                    
                    if job_id in self._jobs:
                        self._jobs[job_id].status = JobStatus.COMPLETED.value
                        self._jobs[job_id].completed_at = db_job.completed_at
                        self._jobs[job_id].summary_metrics = db_job.summary_metrics
                else:
                    db_job.status = JobStatus.FAILED.value
                    db_job.completed_at = datetime.utcnow()
                    db_job.error_message = "All records in batch failed to score"
                    db.commit()
                    
                    if job_id in self._jobs:
                        self._jobs[job_id].status = JobStatus.FAILED.value
                        
                logger.info(f"Batch {job_id} processing complete")
                
        except asyncio.CancelledError:
            logger.warning(f"Batch task {job_id} cancelled.")
            # Set status in database to cancelled
            try:
                with get_db_context() as db:
                    db_job = db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
                    if db_job:
                        db_job.status = JobStatus.CANCELLED.value
                        db.commit()
            except Exception as ex:
                logger.error(f"Failed to update cancelled status in DB: {ex}")
                
            if job_id in self._jobs:
                self._jobs[job_id].status = JobStatus.CANCELLED.value
                
        except Exception as e:
            logger.error(f"Batch processing failed for {job_id}: {e}", exc_info=True)
            try:
                with get_db_context() as db:
                    db_job = db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
                    if db_job:
                        db_job.status = JobStatus.FAILED.value
                        db_job.error_message = str(e)
                        db.commit()
            except Exception as ex:
                logger.error(f"Failed to update failed status in DB: {ex}")
                
            if job_id in self._jobs:
                self._jobs[job_id].status = JobStatus.FAILED.value
                
        finally:
            # Clean up task reference
            self._job_tasks.pop(job_id, None)
    
    def get_batch_status(self, job_id: str) -> BatchJobResponse:
        """Get batch job status and progress."""
        if job_id not in self._jobs:
            # Load from DB if not in memory
            db_job = self.db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
            if not db_job:
                raise ApplicationException(
                    message="Batch job not found",
                    details={"job_id": job_id},
                )
            
            # Reconstruct response from DB
            job_response = BatchJobResponse(
                job_id=db_job.job_id,
                job_name=db_job.job_name,
                status=db_job.status,
                total_records=db_job.total_records,
                processed_records=db_job.processed_records,
                created_at=db_job.created_at,
                started_at=db_job.started_at,
                completed_at=db_job.completed_at,
                summary_metrics=db_job.summary_metrics,
            )
            self._jobs[job_id] = job_response
        
        return self._jobs[job_id]
    
    def get_batch_results(
        self,
        job_id: str,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[BatchResultResponse]:
        """Retrieve batch results with pagination."""
        # Verify job exists
        self.get_batch_status(job_id)  # Load from DB or cache
        
        # Query results from DB
        db_results = (
            self.db.query(BatchResult)
            .filter(BatchResult.job_id == job_id)
            .order_by(BatchResult.created_at)
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        return [
            BatchResultResponse(
                batch_result_id=r.batch_result_id,
                job_id=r.job_id,
                applicant_id=r.applicant_id,
                risk_rating=r.risk_rating,
                default_probability=r.default_probability,
                confidence_score=r.confidence_score,
                created_at=r.created_at,
            )
            for r in db_results
        ]
    
    def cancel_batch(self, job_id: str) -> BatchJobResponse:
        """Cancel pending or processing batch job."""
        job_response = self.get_batch_status(job_id)
        
        if job_response.status not in [JobStatus.PENDING.value, JobStatus.PROCESSING.value]:
            raise ApplicationException(
                message="Cannot cancel completed or failed jobs",
                details={"status": job_response.status},
            )
        
        # Cancel async task if exists
        if job_id in self._job_tasks:
            self._job_tasks[job_id].cancel()
            logger.info(f"Cancelled async task for job {job_id}")
        
        # Update status
        db_job = self.db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
        if db_job:
            db_job.status = JobStatus.CANCELLED.value
            self.db.commit()
        
        job_response.status = JobStatus.CANCELLED.value
        
        logger.info(f"Batch job {job_id} cancelled")
        return job_response
    
    async def export_batch_results(
        self,
        job_id: str,
        format: str = "csv",
    ) -> str:
        """Export batch results to file."""
        # Query all results
        db_results = (
            self.db.query(BatchResult)
            .filter(BatchResult.job_id == job_id)
            .all()
        )
        
        data = [
            {
                "applicant_id": r.applicant_id,
                "risk_rating": r.risk_rating,
                "default_probability": r.default_probability,
                "confidence_score": r.confidence_score,
            }
            for r in db_results
        ]
        
        if not data:
            raise ApplicationException(
                message="No results found to export",
                details={"job_id": job_id},
            )
            
        df = pd.DataFrame(data)
        
        # Create temporary directory inside workspace to conform to workspace rules
        # Never write outside workspace unless allowed. The workspace path is c:\All Projects\credit_risk_project
        export_dir = Path("c:/All Projects/credit_risk_project/exports")
        export_dir.mkdir(parents=True, exist_ok=True)
        
        if format == "csv":
            filepath = export_dir / f"batch_results_{job_id}.csv"
            df.to_csv(filepath, index=False)
            logger.info(f"Exported {len(df)} results to {filepath}")
            return str(filepath)
        elif format == "json":
            filepath = export_dir / f"batch_results_{job_id}.json"
            df.to_json(filepath, orient="records", indent=2)
            logger.info(f"Exported {len(df)} results to {filepath}")
            return str(filepath)
        else:
            raise ValidationException(
                message="Unsupported export format",
                details={"format": format},
            )