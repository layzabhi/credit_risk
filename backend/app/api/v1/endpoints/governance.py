"""
Model governance and audit endpoints.
Manages model versioning, promotion, and compliance logging.
"""

import logging
from typing import Optional, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.schemas import ModelRegistryEntry, AuditLogEntry, ErrorResponse
from app.models.database import ModelRegistry, AuditLog
from app.services.governance import GovernanceService
from app.database.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/governance", tags=["governance"])


def get_governance_service(db: Session = Depends(get_db)) -> GovernanceService:
    """Dependency: get initialized GovernanceService."""
    return GovernanceService(db)


# Model Registry Endpoints

@router.get(
    "/models",
    response_model=List[ModelRegistryEntry],
)
async def list_models(
    status: Optional[str] = None,
    gov_service: GovernanceService = Depends(get_governance_service),
) -> List[ModelRegistryEntry]:
    """List all registered models with optional status filter."""
    try:
        models = gov_service.list_models(status=status)
        return [
            ModelRegistryEntry(
                model_id=m.model_id,
                model_name=m.model_name,
                version=m.version,
                model_type=m.model_type,
                training_date=m.training_date,
                deployment_date=m.deployment_date,
                status=m.status,
                metrics={
                    "accuracy": m.accuracy or 0.0,
                    "precision": m.precision or 0.0,
                    "recall": m.recall or 0.0,
                    "f1_score": m.f1_score or 0.0,
                    "auc_roc": m.auc_roc or 0.0,
                },
                training_samples=m.training_samples,
                promoted_at=m.promoted_at,
                promoted_by=m.promoted_by,
            )
            for m in models
        ]
    except Exception as e:
        logger.error(f"Model listing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list models: {str(e)}",
        )


@router.get(
    "/models/{model_id}",
    response_model=ModelRegistryEntry,
)
async def get_model_info_endpoint(
    model_id: str,
    gov_service: GovernanceService = Depends(get_governance_service),
) -> ModelRegistryEntry:
    """Get detailed information about a specific model version."""
    try:
        m = gov_service.get_model_info(model_id)
        return ModelRegistryEntry(
            model_id=m.model_id,
            model_name=m.model_name,
            version=m.version,
            model_type=m.model_type,
            training_date=m.training_date,
            deployment_date=m.deployment_date,
            status=m.status,
            metrics={
                "accuracy": m.accuracy or 0.0,
                "precision": m.precision or 0.0,
                "recall": m.recall or 0.0,
                "f1_score": m.f1_score or 0.0,
                "auc_roc": m.auc_roc or 0.0,
            },
            training_samples=m.training_samples,
            promoted_at=m.promoted_at,
            promoted_by=m.promoted_by,
        )
    except Exception as e:
        logger.error(f"Model info retrieval error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {model_id} not found: {str(e)}",
        )


@router.post(
    "/models/{model_id}/promote",
    response_model=ModelRegistryEntry,
    status_code=status.HTTP_202_ACCEPTED,
)
async def promote_model_endpoint(
    model_id: str,
    user_id: str = "admin",
    gov_service: GovernanceService = Depends(get_governance_service),
) -> ModelRegistryEntry:
    """Promote a model version to production."""
    try:
        m = gov_service.promote_model(model_id, user_id=user_id)
        
        # Dynamically tell model loader to switch primary model
        from app.main import model_loader
        if model_loader is not None:
            model_loader.set_primary_model(m.model_name)
            
        return ModelRegistryEntry(
            model_id=m.model_id,
            model_name=m.model_name,
            version=m.version,
            model_type=m.model_type,
            training_date=m.training_date,
            deployment_date=m.deployment_date,
            status=m.status,
            metrics={
                "accuracy": m.accuracy or 0.0,
                "precision": m.precision or 0.0,
                "recall": m.recall or 0.0,
                "f1_score": m.f1_score or 0.0,
                "auc_roc": m.auc_roc or 0.0,
            },
            training_samples=m.training_samples,
            promoted_at=m.promoted_at,
            promoted_by=m.promoted_by,
        )
    except Exception as e:
        logger.error(f"Model promotion error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model promotion failed: {str(e)}",
        )


@router.post(
    "/models/{model_id}/rollback",
    response_model=ModelRegistryEntry,
)
async def rollback_model_endpoint(
    model_id: str,
    user_id: str = "admin",
    gov_service: GovernanceService = Depends(get_governance_service),
) -> ModelRegistryEntry:
    """Rollback production model to a previous version."""
    try:
        m = gov_service.rollback_model(model_id, user_id=user_id)
        
        # Dynamically switch model loader
        from app.main import model_loader
        if model_loader is not None:
            model_loader.set_primary_model(m.model_name)
            
        return ModelRegistryEntry(
            model_id=m.model_id,
            model_name=m.model_name,
            version=m.version,
            model_type=m.model_type,
            training_date=m.training_date,
            deployment_date=m.deployment_date,
            status=m.status,
            metrics={
                "accuracy": m.accuracy or 0.0,
                "precision": m.precision or 0.0,
                "recall": m.recall or 0.0,
                "f1_score": m.f1_score or 0.0,
                "auc_roc": m.auc_roc or 0.0,
            },
            training_samples=m.training_samples,
            promoted_at=m.promoted_at,
            promoted_by=m.promoted_by,
        )
    except Exception as e:
        logger.error(f"Rollback error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model rollback failed: {str(e)}",
        )


@router.get(
    "/models/compare",
    response_model=List[dict],
)
async def compare_models(
    model_ids: List[str],
    db: Session = Depends(get_db),
) -> List[dict]:
    """Compare performance metrics of multiple models side-by-side."""
    try:
        models = db.query(ModelRegistry).filter(ModelRegistry.model_id.in_(model_ids)).all()
        return [
            {
                "model_id": m.model_id,
                "model_name": m.model_name,
                "version": m.version,
                "metrics": {
                    "accuracy": m.accuracy,
                    "precision": m.precision,
                    "recall": m.recall,
                    "f1_score": m.f1_score,
                    "auc_roc": m.auc_roc,
                },
                "training_samples": m.training_samples,
                "training_date": m.training_date,
                "status": m.status,
            }
            for m in models
        ]
    except Exception as e:
        logger.error(f"Model comparison error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare models: {str(e)}",
        )


# Audit Log Endpoints

@router.get(
    "/audit",
    response_model=List[AuditLogEntry],
)
async def get_audit_logs(
    event_type: Optional[str] = None,
    days: int = 7,
    limit: int = 100,
    offset: int = 0,
    gov_service: GovernanceService = Depends(get_governance_service),
) -> List[AuditLogEntry]:
    """Get audit logs for compliance and debugging."""
    try:
        logs = gov_service.get_audit_logs(event_type=event_type, days=days, limit=limit, offset=offset)
        return [
            AuditLogEntry(
                log_id=l.log_id,
                timestamp=l.timestamp,
                event_type=l.event_type,
                user_id=l.user_id,
                applicant_id=l.applicant_id,
                job_id=l.job_id,
                action=l.action,
                status=l.status,
                details=l.details,
            )
            for l in logs
        ]
    except Exception as e:
        logger.error(f"Audit log retrieval error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve audit logs: {str(e)}",
        )


@router.get(
    "/audit/export",
)
async def export_audit_logs(
    start_date: str,  # YYYY-MM-DD
    end_date: str,    # YYYY-MM-DD
    format: str = "csv",  # csv or json
    gov_service: GovernanceService = Depends(get_governance_service),
):
    """Export audit logs for external compliance reporting."""
    try:
        filepath = gov_service.export_audit_logs(start_date, end_date, format=format)
        import os
        filename = os.path.basename(filepath)
        media_type = "text/csv" if format == "csv" else "application/json"
        return FileResponse(path=filepath, filename=filename, media_type=media_type)
    except Exception as e:
        logger.error(f"Audit export error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export audit logs: {str(e)}",
        )


@router.get(
    "/audit/summary",
    response_model=dict,
)
async def get_audit_summary(
    days: int = 7,
    db: Session = Depends(get_db),
) -> dict:
    """Get aggregate audit summary statistics."""
    try:
        start_time = datetime.utcnow() - timedelta(days=days)
        total_events = db.query(AuditLog).filter(AuditLog.timestamp >= start_time).count()
        success_count = db.query(AuditLog).filter(
            AuditLog.timestamp >= start_time, AuditLog.status == "success"
        ).count()
        error_count = db.query(AuditLog).filter(
            AuditLog.timestamp >= start_time, AuditLog.status == "failure"
        ).count()
        unique_users = db.query(AuditLog.user_id).filter(AuditLog.timestamp >= start_time).distinct().count()
        
        # Events by type
        by_type_query = db.query(AuditLog.event_type, func.count(AuditLog.log_id)).filter(
            AuditLog.timestamp >= start_time
        ).group_by(AuditLog.event_type).all()
        events_by_type = {k: v for k, v in by_type_query}
        
        success_rate = (success_count / total_events) if total_events > 0 else 1.0
        
        return {
            "total_events": total_events,
            "events_by_type": events_by_type,
            "success_rate": success_rate,
            "error_count": error_count,
            "unique_users": unique_users,
        }
    except Exception as e:
        logger.error(f"Audit summary error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute audit summary: {str(e)}",
        )


# Compliance Endpoints

@router.get(
    "/fairness-report",
    response_model=dict,
)
async def get_fairness_report(
    model_id: str,
    protected_attributes: Optional[List[str]] = None,
    gov_service: GovernanceService = Depends(get_governance_service),
) -> dict:
    """Get fairness report checking for demographic bias."""
    try:
        attrs = protected_attributes or ["gender", "age"]
        return gov_service.get_fairness_report(model_id, protected_attributes=attrs)
    except Exception as e:
        logger.error(f"Fairness report error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate fairness report: {str(e)}",
        )


@router.get(
    "/performance-report",
    response_model=dict,
)
async def get_performance_report(
    model_id: str,
    gov_service: GovernanceService = Depends(get_governance_service),
) -> dict:
    """Get model performance report from registry metrics."""
    try:
        return gov_service.get_performance_report(model_id)
    except Exception as e:
        logger.error(f"Performance report error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Failed to generate performance report: {str(e)}",
        )