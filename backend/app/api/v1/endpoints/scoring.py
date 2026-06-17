"""
Scoring endpoints for credit risk assessment.
Handles single applicant scoring requests.
"""

import logging
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.schemas import ScoringRequest, ScoringResponse, ErrorResponse
from app.models.database import Applicant, ScoringRequest as DbScoringRequest
from app.services.scorer import ScoringService, ThresholdTuner
from app.database.session import get_db
from app.core.exceptions import ValidationException, ModelException

logger = logging.getLogger(__name__)

router = APIRouter(tags=["scoring"])


def get_scoring_service(db: Session = Depends(get_db)) -> ScoringService:
    """
    Dependency: get initialized ScoringService.
    Avoids circular imports by importing model_loader dynamically.
    """
    from app.main import model_loader
    if model_loader is None or not model_loader.models:
        # Fallback if model_loader is not initialized: create a new one
        from app.services.model_loader import ModelLoader
        from app.config import settings
        loader = ModelLoader(model_dir=settings.MODELS_DIR)
        # We block synchronously for initialization in this fallback
        import asyncio
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
            
        if loop and loop.is_running():
            # In async loop, schedule loading
            import nest_asyncio
            nest_asyncio.apply()
            loop.run_until_complete(loader.load_models())
        else:
            asyncio.run(loader.load_models())
            
        import app.main
        app.main.model_loader = loader
        model_loader = loader

    try:
        model = model_loader.get_primary_model()
        preprocessor = model_loader.get_preprocessor(model_loader.primary_model)
        metadata = model_loader.get_metadata(model_loader.primary_model)
        calibration = model_loader.get_calibration_data(model_loader.primary_model)
        
        from app.services.explainer import SHAPExplainer
        explainer = SHAPExplainer(model)
        
        # Reconstruct threshold tuner if calibration data exists
        threshold_tuner = None
        if calibration:
            threshold_tuner = calibration
            
        return ScoringService(
            model_ensemble=model,
            preprocessor=preprocessor,
            explainer=explainer,
            threshold_tuner=threshold_tuner,
        )
    except Exception as e:
        logger.error(f"Failed to inject ScoringService: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Scoring service unavailable: {str(e)}"
        )


@router.post(
    "/score",
    response_model=ScoringResponse,
    responses={
        200: {"description": "Scoring successful"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
)
async def score_applicant(
    request: ScoringRequest,
    db: Session = Depends(get_db),
    scoring_service: ScoringService = Depends(get_scoring_service),
    apply_threshold_tuning: bool = True,
) -> ScoringResponse:
    """Score a single applicant for credit risk."""
    try:
        # 1. Run scorer
        response = scoring_service.score_applicant(request, apply_threshold_tuning=apply_threshold_tuning)
        
        # 2. Store applicant demographic details if not already present
        applicant = db.query(Applicant).filter(Applicant.applicant_id == response.applicant_id).first()
        if not applicant:
            applicant = Applicant(
                applicant_id=response.applicant_id,
                age=request.age,
                gender=request.gender.value,
                education_level=request.education_level.value,
                marital_status=request.marital_status.value,
                income=request.income,
                credit_score=request.credit_score,
                debt_to_income_ratio=request.debt_to_income_ratio,
                assets_value=request.assets_value,
                employment_status=request.employment_status.value,
                years_at_current_job=request.years_at_current_job,
                payment_history=request.payment_history.value,
                previous_defaults=request.previous_defaults,
                number_of_dependents=request.number_of_dependents,
                created_at=datetime.utcnow(),
            )
            db.add(applicant)
            db.commit()
            db.refresh(applicant)
            
        # 3. Store scoring request execution details
        db_request = DbScoringRequest(
            request_id=str(response.applicant_id),  # Use applicant_id as request_id for convenience
            applicant_id=response.applicant_id,
            loan_amount=request.loan_amount,
            loan_purpose=request.loan_purpose.value,
            model_version=response.model_version,
            model_name=response.model_name,
            risk_rating=response.risk_rating.value,
            default_probability=response.default_probability,
            raw_probability=response.raw_probability,
            confidence_score=response.confidence_score,
            processing_time_ms=response.processing_time_ms,
            explanations=response.explanations.dict(),
            audit_trail=response.audit_trail.dict(),
            created_at=response.scoring_timestamp,
        )
        db.add(db_request)
        db.commit()
        
        return response
        
    except ValidationException as e:
        logger.warning(f"Validation error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": e.error_code, "message": e.message},
        )
    except ModelException as e:
        logger.error(f"Model error: {e.message}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": e.error_code, "message": e.message},
        )
    except Exception as e:
        logger.error(f"Unexpected error in scoring: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "INTERNAL_SERVER_ERROR", "message": f"Scoring failed: {str(e)}"},
        )


@router.post(
    "/score/batch",
    response_model=List[ScoringResponse],
    responses={
        200: {"description": "Batch scoring successful"},
        422: {"model": ErrorResponse},
    },
)
async def score_batch(
    applicants: List[ScoringRequest],
    db: Session = Depends(get_db),
    scoring_service: ScoringService = Depends(get_scoring_service),
) -> List[ScoringResponse]:
    """Score multiple applicants (maximum 100 per request)."""
    if len(applicants) > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Maximum 100 applicants per request",
        )
        
    responses = []
    try:
        for applicant_req in applicants:
            resp = await score_applicant(
                request=applicant_req,
                db=db,
                scoring_service=scoring_service,
                apply_threshold_tuning=True,
            )
            responses.append(resp)
        return responses
    except Exception as e:
        logger.error(f"Batch scoring error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch scoring failed: {str(e)}",
        )


@router.get(
    "/score/history/{applicant_id}",
    response_model=List[ScoringResponse],
)
async def get_applicant_history(
    applicant_id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
) -> List[ScoringResponse]:
    """Get recent scoring history for a specific applicant."""
    try:
        records = (
            db.query(DbScoringRequest)
            .filter(DbScoringRequest.applicant_id == applicant_id)
            .order_by(DbScoringRequest.created_at.desc())
            .limit(limit)
            .all()
        )
        
        histories = []
        for r in records:
            histories.append(
                ScoringResponse(
                    applicant_id=r.applicant_id,
                    risk_rating=r.risk_rating,
                    default_probability=r.default_probability,
                    raw_probability=r.raw_probability,
                    confidence_score=r.confidence_score,
                    model_version=r.model_version,
                    model_name=r.model_name,
                    scoring_timestamp=r.created_at,
                    processing_time_ms=r.processing_time_ms,
                    explanations=r.explanations,
                    audit_trail=r.audit_trail,
                )
            )
        return histories
    except Exception as e:
        logger.error(f"History retrieval error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}",
        )