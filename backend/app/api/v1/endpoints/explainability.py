"""
Explainability and interpretation endpoints.
Provides SHAP-based feature importance and decision explanations.
"""

import logging
from datetime import datetime
from typing import Dict, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.schemas import ExplanationData, FeatureImportance, ErrorResponse
from app.models.database import (
    Explanation as DbExplanation,
    ScoringRequest as DbScoringRequest,
    Applicant,
)
from app.api.v1.endpoints.scoring import get_scoring_service
from app.services.scorer import ScoringService
from app.database.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/explain", tags=["explainability"])


def _resolve_scoring_request(db: Session, request_id: str) -> DbScoringRequest:
    """Resolve a scoring request by either request_id or applicant_id."""
    scoring_request = db.query(DbScoringRequest).filter(DbScoringRequest.request_id == request_id).first()
    if not scoring_request:
        # Fallback to checking by applicant_id, returning the latest scoring request
        scoring_request = (
            db.query(DbScoringRequest)
            .filter(DbScoringRequest.applicant_id == request_id)
            .order_by(DbScoringRequest.created_at.desc())
            .first()
        )
    if not scoring_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scoring request or applicant {request_id} not found"
        )
    return scoring_request


@router.get(
    "/{request_id}",
    response_model=ExplanationData,
    responses={
        200: {"description": "Explanation retrieved"},
        404: {"description": "Request not found"},
        500: {"model": ErrorResponse},
    },
)
async def get_explanation(
    request_id: str,
    db: Session = Depends(get_db),
    scoring_service: ScoringService = Depends(get_scoring_service),
) -> ExplanationData:
    """Get SHAP explanation for a specific scoring request."""
    try:
        # Resolve scoring request (supports applicant_id fallback)
        scoring_request = _resolve_scoring_request(db, request_id)
        actual_request_id = scoring_request.request_id

        # Check cache
        cached = db.query(DbExplanation).filter(DbExplanation.request_id == actual_request_id).first()
        if cached:
            top_feats = [
                FeatureImportance(
                    name=f["name"],
                    impact=f["impact"],
                    direction=f["direction"]
                )
                for f in cached.feature_importance
            ]
            return ExplanationData(
                top_features=top_feats,
                feature_importance_sum=sum(f.impact for f in top_feats),
                base_value=cached.base_value,
                shap_values=cached.shap_values,
            )
            
        # If not cached, re-compute
        applicant = db.query(Applicant).filter(Applicant.applicant_id == scoring_request.applicant_id).first()
        if not applicant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Applicant details not found for applicant {scoring_request.applicant_id}"
            )
            
        # Reconstruct pandas DataFrame
        from app.models.schemas import ScoringRequest as SchemaScoringRequest
        from app.models.enums import GenderEnum, EducationLevel, MaritalStatus, EmploymentStatus, LoanPurpose, PaymentHistory
        
        request_schema = SchemaScoringRequest(
            applicant_id=applicant.applicant_id,
            age=applicant.age,
            gender=GenderEnum(applicant.gender),
            education_level=EducationLevel(applicant.education_level),
            marital_status=MaritalStatus(applicant.marital_status),
            income=applicant.income,
            credit_score=applicant.credit_score,
            loan_amount=scoring_request.loan_amount,
            loan_purpose=LoanPurpose(scoring_request.loan_purpose),
            employment_status=EmploymentStatus(applicant.employment_status),
            years_at_current_job=applicant.years_at_current_job,
            payment_history=PaymentHistory(applicant.payment_history),
            debt_to_income_ratio=applicant.debt_to_income_ratio,
            assets_value=applicant.assets_value,
            previous_defaults=applicant.previous_defaults,
            number_of_dependents=applicant.number_of_dependents,
        )
        
        # Create DataFrames
        applicant_df = scoring_service._request_to_dataframe(request_schema)
        preprocessed_df = scoring_service.preprocessor.transform(applicant_df)
        
        # Explain
        explanation_data = scoring_service.explainer.explain(
            original_X=applicant_df,
            preprocessed_X=preprocessed_df,
            prediction=scoring_request.default_probability,
        )
        
        # Cache
        db_explanation = DbExplanation(
            explanation_id=str(uuid4()),
            request_id=actual_request_id,
            shap_values=explanation_data.shap_values,
            feature_importance=[f.dict() for f in explanation_data.top_features],
            base_value=explanation_data.base_value,
            expected_value=explanation_data.base_value,
            created_at=datetime.utcnow(),
        )
        db.add(db_explanation)
        db.commit()
        
        return explanation_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Explanation retrieval error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve explanation: {str(e)}",
        )


@router.get(
    "/{request_id}/waterfall",
    response_model=dict,
)
async def get_waterfall_plot(
    request_id: str,
    db: Session = Depends(get_db),
    scoring_service: ScoringService = Depends(get_scoring_service),
) -> dict:
    """Get SHAP waterfall plot data for visualization."""
    try:
        scoring_request = _resolve_scoring_request(db, request_id)
        applicant = db.query(Applicant).filter(Applicant.applicant_id == scoring_request.applicant_id).first()
        if not applicant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Applicant details not found for applicant {scoring_request.applicant_id}"
            )
            
        from app.models.schemas import ScoringRequest as SchemaScoringRequest
        from app.models.enums import GenderEnum, EducationLevel, MaritalStatus, EmploymentStatus, LoanPurpose, PaymentHistory
        
        request_schema = SchemaScoringRequest(
            applicant_id=applicant.applicant_id,
            age=applicant.age,
            gender=GenderEnum(applicant.gender),
            education_level=EducationLevel(applicant.education_level),
            marital_status=MaritalStatus(applicant.marital_status),
            income=applicant.income,
            credit_score=applicant.credit_score,
            loan_amount=scoring_request.loan_amount,
            loan_purpose=LoanPurpose(scoring_request.loan_purpose),
            employment_status=EmploymentStatus(applicant.employment_status),
            years_at_current_job=applicant.years_at_current_job,
            payment_history=PaymentHistory(applicant.payment_history),
            debt_to_income_ratio=applicant.debt_to_income_ratio,
            assets_value=applicant.assets_value,
            previous_defaults=applicant.previous_defaults,
            number_of_dependents=applicant.number_of_dependents,
        )
        
        applicant_df = scoring_service._request_to_dataframe(request_schema)
        preprocessed_df = scoring_service.preprocessor.transform(applicant_df)
        
        shap_values = scoring_service.explainer._compute_shap_values(preprocessed_df)
        
        return scoring_service.explainer.get_waterfall_data(
            preprocessed_df,
            shap_values
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Waterfall plot error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate waterfall plot: {str(e)}",
        )


@router.get(
    "/{request_id}/force-plot",
    response_model=dict,
)
async def get_force_plot(
    request_id: str,
    db: Session = Depends(get_db),
    scoring_service: ScoringService = Depends(get_scoring_service),
) -> dict:
    """Get SHAP force plot data."""
    try:
        scoring_request = _resolve_scoring_request(db, request_id)
        applicant = db.query(Applicant).filter(Applicant.applicant_id == scoring_request.applicant_id).first()
        if not applicant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Applicant details not found for applicant {scoring_request.applicant_id}"
            )
            
        from app.models.schemas import ScoringRequest as SchemaScoringRequest
        from app.models.enums import GenderEnum, EducationLevel, MaritalStatus, EmploymentStatus, LoanPurpose, PaymentHistory
        
        request_schema = SchemaScoringRequest(
            applicant_id=applicant.applicant_id,
            age=applicant.age,
            gender=GenderEnum(applicant.gender),
            education_level=EducationLevel(applicant.education_level),
            marital_status=MaritalStatus(applicant.marital_status),
            income=applicant.income,
            credit_score=applicant.credit_score,
            loan_amount=scoring_request.loan_amount,
            loan_purpose=LoanPurpose(scoring_request.loan_purpose),
            employment_status=EmploymentStatus(applicant.employment_status),
            years_at_current_job=applicant.years_at_current_job,
            payment_history=PaymentHistory(applicant.payment_history),
            debt_to_income_ratio=applicant.debt_to_income_ratio,
            assets_value=applicant.assets_value,
            previous_defaults=applicant.previous_defaults,
            number_of_dependents=applicant.number_of_dependents,
        )
        
        applicant_df = scoring_service._request_to_dataframe(request_schema)
        preprocessed_df = scoring_service.preprocessor.transform(applicant_df)
        
        shap_values = scoring_service.explainer._compute_shap_values(preprocessed_df)
        
        return scoring_service.explainer.get_force_plot_data(
            preprocessed_df,
            shap_values
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Force plot error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate force plot: {str(e)}",
        )


@router.post(
    "/regenerate/{request_id}",
    response_model=ExplanationData,
)
async def regenerate_explanation(
    request_id: str,
    db: Session = Depends(get_db),
    scoring_service: ScoringService = Depends(get_scoring_service),
) -> ExplanationData:
    """Force regeneration of SHAP explanations, updating cache."""
    try:
        scoring_request = _resolve_scoring_request(db, request_id)
        actual_request_id = scoring_request.request_id
        # Delete existing cached explanation
        db.query(DbExplanation).filter(DbExplanation.request_id == actual_request_id).delete()
        db.commit()
        
        # Regenerate and cache
        return await get_explanation(request_id=actual_request_id, db=db, scoring_service=scoring_service)
    except Exception as e:
        logger.error(f"Regeneration error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate explanation: {str(e)}",
        )


@router.get(
    "/model/{model_version}/importance",
    response_model=dict,
)
async def get_model_feature_importance(
    model_version: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get average feature importance for a model version across historical requests."""
    try:
        explanations = db.query(DbExplanation).join(
            DbScoringRequest, DbExplanation.request_id == DbScoringRequest.request_id
        ).filter(DbScoringRequest.model_version == model_version).all()
        
        if not explanations:
            return {"feature_names": [], "importance_values": [], "average_impact": {}}
            
        # Aggregate SHAP values
        sum_shaps = {}
        count = 0
        for exp in explanations:
            count += 1
            for feat, val in exp.shap_values.items():
                sum_shaps[feat] = sum_shaps.get(feat, 0.0) + abs(val)
                
        avg_shaps = {k: v / count for k, v in sum_shaps.items()}
        sorted_shaps = sorted(avg_shaps.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "feature_names": [x[0] for x in sorted_shaps],
            "importance_values": [x[1] for x in sorted_shaps],
            "average_impact": avg_shaps,
        }
    except Exception as e:
        logger.error(f"Model importance error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model importance: {str(e)}",
        )