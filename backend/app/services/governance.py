"""
Governance service for model registry and compliance audit logging.
Manages model versioning, promotion, and regulatory compliance.
"""

import logging
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import uuid4
import os
from pathlib import Path
import pandas as pd

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.database import ModelRegistry, AuditLog, ScoringRequest, Applicant
from app.core.exceptions import NotFoundException, ConflictException
from app.utils.metrics import (
    compute_disparate_impact,
    compute_demographic_parity_difference,
    compute_equal_opportunity_difference,
)

logger = logging.getLogger(__name__)


class GovernanceService:
    """
    Model governance and audit service.
    
    Handles:
    - Model versioning and registry
    - Model promotion to production
    - Audit logging of decisions
    - Compliance reporting
    - Fairness monitoring
    """
    
    def __init__(self, db: Session):
        """
        Initialize governance service.
        
        Args:
            db: Database session
        """
        self.db = db
        logger.info("GovernanceService initialized")
    
    # Model Registry Methods
    
    def register_model(
        self,
        model_name: str,
        version: str,
        model_type: str,
        metrics: Dict[str, float],
        training_samples: int,
        model_path: str,
        preprocessor_path: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> ModelRegistry:
        """Register a new model in the registry."""
        # Check if version already exists
        existing = self.db.query(ModelRegistry).filter(ModelRegistry.version == version).first()
        if existing:
            raise ConflictException(f"Model version '{version}' already registered.")
            
        model_id = str(uuid4())
        
        db_model = ModelRegistry(
            model_id=model_id,
            model_name=model_name,
            version=version,
            model_type=model_type,
            framework="scikit-learn" if "xgboost" not in model_type.lower() else "xgboost",
            accuracy=metrics.get("accuracy"),
            precision=metrics.get("precision"),
            recall=metrics.get("recall"),
            f1_score=metrics.get("f1_score") or metrics.get("f1"),
            auc_roc=metrics.get("auc_roc") or metrics.get("auc"),
            training_samples=training_samples,
            training_date=datetime.utcnow(),
            status="inactive",
            is_production=False,
            model_path=model_path,
            preprocessor_path=preprocessor_path,
            notes=notes,
            created_at=datetime.utcnow(),
        )
        
        self.db.add(db_model)
        self.db.commit()
        self.db.refresh(db_model)
        
        # Log to audit trail
        self.log_event(
            event_type="governance",
            action="model_registration",
            status="success",
            model_id=model_id,
            details={"model_name": model_name, "version": version},
        )
        
        logger.info(f"Registered model: {model_name} v{version}")
        return db_model
    
    def get_model_info(self, model_id: str) -> Optional[ModelRegistry]:
        """Get model information from registry."""
        model = self.db.query(ModelRegistry).filter(ModelRegistry.model_id == model_id).first()
        if not model:
            raise NotFoundException(f"Model with ID '{model_id}' not found.")
        return model
    
    def list_models(self, status: Optional[str] = None) -> list[ModelRegistry]:
        """List all models with optional status filter."""
        query = self.db.query(ModelRegistry)
        if status:
            query = query.filter(ModelRegistry.status == status)
        return query.order_by(ModelRegistry.training_date.desc()).all()
    
    def promote_model(self, model_id: str, user_id: str) -> ModelRegistry:
        """Promote model to production status."""
        model = self.get_model_info(model_id)
        
        # 1. Demote other models of same type
        self.db.query(ModelRegistry).filter(
            and_(ModelRegistry.model_name == model.model_name, ModelRegistry.is_production == True)
        ).update({
            "is_production": False,
            "status": "inactive"
        })
        
        # 2. Promote current model
        model.is_production = True
        model.status = "active"
        model.promoted_at = datetime.utcnow()
        model.promoted_by = user_id
        model.deployment_date = datetime.utcnow()
        self.db.commit()
        
        # Log to audit trail
        self.log_event(
            event_type="governance",
            action="model_promotion",
            status="success",
            user_id=user_id,
            model_id=model_id,
            details={"model_name": model.model_name, "version": model.version},
        )
        
        logger.info(f"Promoted model {model.model_name} v{model.version} to production by {user_id}")
        return model
    
    def rollback_model(self, model_id: str, user_id: str) -> ModelRegistry:
        """Rollback to a specific model version."""
        # Promotion logic sets is_production=True on target, demoting others.
        # So rollback is effectively promoting a previous model version.
        return self.promote_model(model_id, user_id)
    
    # Audit Logging Methods
    
    def log_event(
        self,
        event_type: str,
        action: str,
        status: str,
        user_id: Optional[str] = None,
        user_ip: Optional[str] = None,
        applicant_id: Optional[str] = None,
        job_id: Optional[str] = None,
        request_id: Optional[str] = None,
        model_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        duration_ms: Optional[float] = None,
    ) -> AuditLog:
        """Log an event to audit trail."""
        try:
            audit_log = AuditLog(
                log_id=str(uuid4()),
                timestamp=datetime.utcnow(),
                event_type=event_type,
                action=action,
                status=status,
                user_id=user_id,
                user_ip=user_ip,
                applicant_id=applicant_id,
                job_id=job_id,
                request_id=request_id,
                model_id=model_id,
                details=details or {},
                error_message=error_message,
                duration_ms=duration_ms,
            )
            
            self.db.add(audit_log)
            self.db.commit()
            return audit_log
        except Exception as e:
            logger.error(f"Failed to log event: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def get_audit_logs(
        self,
        event_type: Optional[str] = None,
        days: int = 7,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditLog]:
        """Retrieve audit logs within a time window."""
        query = self.db.query(AuditLog)
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
            
        start_time = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AuditLog.timestamp >= start_time)
        
        return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    
    # Compliance Reporting Methods
    
    def get_fairness_report(
        self,
        model_id: str,
        protected_attributes: list[str] = ["gender", "age"],
    ) -> Dict[str, Any]:
        """Generate fairness analysis report comparing unprivileged vs privileged groups."""
        # Fetch requests joined with applicant demographic profiles
        # Note: model_version in ScoringRequest maps to the model version string
        records = self.db.query(ScoringRequest, Applicant).join(
            Applicant, ScoringRequest.applicant_id == Applicant.applicant_id
        ).filter(ScoringRequest.model_version == model_id).all()
        
        if not records:
            return {
                "model_id": model_id,
                "total_records": 0,
                "fairness_metrics": {},
                "message": "No scoring records found for this model version to compute fairness.",
            }
            
        # Parse data into lists
        preds = []  # favorable outcome (no default) is 0, default is 1
        dti = []
        genders = []
        ages = []
        
        for req, app in records:
            # favorable outcome is Low or Medium risk rating (not High risk)
            # or default_probability < 0.65
            is_favorable = 0 if req.default_probability < 0.65 else 1
            preds.append(is_favorable)
            genders.append(app.gender)
            ages.append(app.age)
            
        preds = np.array(preds)
        genders = np.array(genders)
        ages = np.array(ages)
        
        report = {
            "model_id": model_id,
            "total_records": len(records),
            "fairness_metrics": {},
        }
        
        # Gender Fairness Analysis
        if "gender" in protected_attributes:
            # Privileged: Male, Unprivileged: Female
            groups = np.where(genders == "Male", 1, 0)  # Male = 1, Female/Non-binary = 0
            di = compute_disparate_impact(preds, groups, favorable_outcome=0)
            dp = compute_demographic_parity_difference(preds, groups, favorable_outcome=0)
            
            report["fairness_metrics"]["gender"] = {
                "disparate_impact_ratio": di,
                "demographic_parity_difference": dp,
                "status": "pass" if 0.8 <= di <= 1.25 else "fail",
            }
            
        # Age Fairness Analysis
        if "age" in protected_attributes:
            # Privileged: >= 30, Unprivileged: < 30
            groups = np.where(ages >= 30, 1, 0)
            di = compute_disparate_impact(preds, groups, favorable_outcome=0)
            dp = compute_demographic_parity_difference(preds, groups, favorable_outcome=0)
            
            report["fairness_metrics"]["age"] = {
                "disparate_impact_ratio": di,
                "demographic_parity_difference": dp,
                "status": "pass" if 0.8 <= di <= 1.25 else "fail",
            }
            
        return report
    
    def get_performance_report(self, model_id: str) -> Dict[str, Any]:
        """Generate model performance report from database registry."""
        model = self.db.query(ModelRegistry).filter(ModelRegistry.version == model_id).first()
        if not model:
            # Search by model_id
            model = self.db.query(ModelRegistry).filter(ModelRegistry.model_id == model_id).first()
            
        if not model:
            raise NotFoundException(f"Model '{model_id}' not found.")
            
        return {
            "model_id": model.model_id,
            "model_name": model.model_name,
            "version": model.version,
            "metrics": {
                "accuracy": model.accuracy,
                "precision": model.precision,
                "recall": model.recall,
                "f1_score": model.f1_score,
                "auc_roc": model.auc_roc,
            },
            "training_samples": model.training_samples,
            "training_date": model.training_date.isoformat(),
            "status": model.status,
            "is_production": model.is_production,
            "notes": model.notes,
        }
    
    def export_audit_logs(
        self,
        start_date: str,
        end_date: str,
        format: str = "csv",
    ) -> str:
        """Export audit logs inside a date range to a CSV/JSON file."""
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            # Set end_dt to the end of the day
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            raise ConflictException("Invalid date format. Use YYYY-MM-DD.")
            
        logs = self.db.query(AuditLog).filter(
            and_(AuditLog.timestamp >= start_dt, AuditLog.timestamp < end_dt)
        ).all()
        
        data = [
            {
                "log_id": r.log_id,
                "timestamp": r.timestamp.isoformat(),
                "event_type": r.event_type,
                "action": r.action,
                "status": r.status,
                "user_id": r.user_id,
                "applicant_id": r.applicant_id,
                "job_id": r.job_id,
                "request_id": r.request_id,
                "model_id": r.model_id,
                "error_message": r.error_message,
                "duration_ms": r.duration_ms,
            }
            for r in logs
        ]
        
        df = pd.DataFrame(data)
        
        # Save to exports directory inside workspace
        export_dir = Path("c:/All Projects/credit_risk_project/exports")
        export_dir.mkdir(parents=True, exist_ok=True)
        
        if format == "csv":
            filepath = export_dir / f"audit_export_{start_date}_to_{end_date}.csv"
            df.to_csv(filepath, index=False)
            return str(filepath)
        elif format == "json":
            filepath = export_dir / f"audit_export_{start_date}_to_{end_date}.json"
            df.to_json(filepath, orient="records", indent=2)
            return str(filepath)
        else:
            raise ConflictException(f"Unsupported export format '{format}'. Use 'csv' or 'json'.")