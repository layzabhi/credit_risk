"""
Dashboard endpoints for Credit Risk Assessment API.
Provides stats, risk distribution, recent scores, and daily trends.
"""

import logging
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.database import ScoringRequest, Applicant

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get high-level summary stats for dashboard KPI cards."""
    try:
        total_scored = db.query(ScoringRequest).count()
        
        # Calculate daily increase (created in last 24h or since start of today UTC)
        # Using start of today UTC is standard for daily metrics
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_increase = db.query(ScoringRequest).filter(ScoringRequest.created_at >= today_start).count()
        
        # Risk counts (case-insensitive search to be robust)
        low_risk_count = db.query(ScoringRequest).filter(func.lower(ScoringRequest.risk_rating) == "low").count()
        medium_risk_count = db.query(ScoringRequest).filter(func.lower(ScoringRequest.risk_rating) == "medium").count()
        high_risk_count = db.query(ScoringRequest).filter(func.lower(ScoringRequest.risk_rating) == "high").count()
        
        # Percentages
        low_risk_percentage = round((low_risk_count / total_scored * 100), 1) if total_scored > 0 else 0.0
        medium_risk_percentage = round((medium_risk_count / total_scored * 100), 1) if total_scored > 0 else 0.0
        high_risk_percentage = round((high_risk_count / total_scored * 100), 1) if total_scored > 0 else 0.0
        
        return {
            "total_scored": total_scored,
            "daily_increase": daily_increase,
            "low_risk_count": low_risk_count,
            "low_risk_percentage": low_risk_percentage,
            "medium_risk_count": medium_risk_count,
            "medium_risk_percentage": medium_risk_percentage,
            "high_risk_count": high_risk_count,
            "high_risk_percentage": high_risk_percentage,
        }
    except Exception as e:
        logger.error(f"Failed to fetch dashboard stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard stats: {str(e)}",
        )


@router.get("/risk-distribution", response_model=List[Dict[str, Any]])
async def get_risk_distribution(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get risk distribution mapping for the pie chart."""
    try:
        low_count = db.query(ScoringRequest).filter(func.lower(ScoringRequest.risk_rating) == "low").count()
        med_count = db.query(ScoringRequest).filter(func.lower(ScoringRequest.risk_rating) == "medium").count()
        high_count = db.query(ScoringRequest).filter(func.lower(ScoringRequest.risk_rating) == "high").count()
        
        return [
            {"name": "Low Risk", "value": low_count},
            {"name": "Medium Risk", "value": med_count},
            {"name": "High Risk", "value": high_count},
        ]
    except Exception as e:
        logger.error(f"Failed to fetch risk distribution: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve risk distribution: {str(e)}",
        )


@router.get("/recent-scores", response_model=List[Dict[str, Any]])
async def get_recent_scores(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get the most recent 10 scoring requests for the dashboard table."""
    try:
        recent_requests = (
            db.query(ScoringRequest, Applicant)
            .join(Applicant, ScoringRequest.applicant_id == Applicant.applicant_id)
            .order_by(ScoringRequest.created_at.desc())
            .limit(10)
            .all()
        )
        
        return [
            {
                "applicant_id": req.applicant_id,
                "risk_level": req.risk_rating.lower(),
                "risk_score": req.default_probability,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "explanations": req.explanations,
                "audit_trail": req.audit_trail,
                "credit_score": app.credit_score,
                "income": app.income,
                "debt_to_income_ratio": app.debt_to_income_ratio,
            }
            for req, app in recent_requests
        ]
    except Exception as e:
        logger.error(f"Failed to fetch recent scores: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve recent scores: {str(e)}",
        )


@router.get("/scoring-trend", response_model=List[Dict[str, Any]])
async def get_scoring_trend(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get counts grouped by day and risk rating for the last 7 days scoring trend chart."""
    try:
        # Get date objects for the last 7 days (including today)
        today = datetime.utcnow().date()
        dates = [today - timedelta(days=i) for i in range(6, -1, -1)]
        date_strs = [d.strftime("%Y-%m-%d") for d in dates]
        
        # Initialize dictionary to hold counts for each day
        trend_dict = {
            d_str: {"date": d_str, "low_risk": 0, "medium_risk": 0, "high_risk": 0}
            for d_str in date_strs
        }
        
        # Fetch data starting from the earliest of the 7 days (start of day UTC)
        start_date = datetime.combine(dates[0], datetime.min.time())
        
        results = (
            db.query(
                func.date(ScoringRequest.created_at).label("day"),
                func.lower(ScoringRequest.risk_rating).label("risk"),
                func.count().label("count")
            )
            .filter(ScoringRequest.created_at >= start_date)
            .group_by("day", "risk")
            .all()
        )
        
        # Populate counts
        for day, risk, count in results:
            day_str = day.strftime("%Y-%m-%d") if hasattr(day, "strftime") else str(day)
            if day_str in trend_dict:
                if risk == "low":
                    trend_dict[day_str]["low_risk"] = count
                elif risk == "medium":
                    trend_dict[day_str]["medium_risk"] = count
                elif risk == "high":
                    trend_dict[day_str]["high_risk"] = count
                    
        return [trend_dict[d_str] for d_str in date_strs]
    except Exception as e:
        logger.error(f"Failed to fetch scoring trend: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve scoring trend: {str(e)}",
        )


@router.post("/seed", response_model=Dict[str, Any])
async def seed_dashboard_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Seed the database with mock applicant and scoring data for the dashboard."""
    try:
        # Clear existing data to ensure a clean seeding
        db.query(ScoringRequest).delete()
        db.query(Applicant).delete()
        db.commit()

        # Seed data definition
        today = datetime.utcnow()
        
        applicant_templates = [
            # Low Risk Applicants
            {"age": 45, "gender": "Female", "education_level": "PhD", "marital_status": "Married", "income": 125000.0, "credit_score": 790, "debt_to_income_ratio": 0.12, "assets_value": 450000.0, "employment_status": "Employed", "years_at_current_job": 12, "payment_history": "Good", "previous_defaults": 0, "number_of_dependents": 2, "loan_amount": 40000.0, "loan_purpose": "Home", "risk_rating": "low", "default_probability": 0.04, "confidence_score": 0.94},
            {"age": 38, "gender": "Male", "education_level": "Master", "marital_status": "Married", "income": 95000.0, "credit_score": 750, "debt_to_income_ratio": 0.18, "assets_value": 220000.0, "employment_status": "Employed", "years_at_current_job": 6, "payment_history": "Good", "previous_defaults": 0, "number_of_dependents": 1, "loan_amount": 25000.0, "loan_purpose": "Auto", "risk_rating": "low", "default_probability": 0.08, "confidence_score": 0.91},
            {"age": 52, "gender": "Female", "education_level": "Bachelor", "marital_status": "Divorced", "income": 110000.0, "credit_score": 770, "debt_to_income_ratio": 0.15, "assets_value": 310000.0, "employment_status": "Employed", "years_at_current_job": 15, "payment_history": "Good", "previous_defaults": 0, "number_of_dependents": 0, "loan_amount": 30000.0, "loan_purpose": "Home", "risk_rating": "low", "default_probability": 0.05, "confidence_score": 0.93},
            {"age": 29, "gender": "Male", "education_level": "Bachelor", "marital_status": "Single", "income": 85000.0, "credit_score": 740, "debt_to_income_ratio": 0.22, "assets_value": 85000.0, "employment_status": "Employed", "years_at_current_job": 4, "payment_history": "Good", "previous_defaults": 0, "number_of_dependents": 0, "loan_amount": 15000.0, "loan_purpose": "Personal", "risk_rating": "low", "default_probability": 0.09, "confidence_score": 0.88},
            {"age": 41, "gender": "Female", "education_level": "Master", "marital_status": "Married", "income": 140000.0, "credit_score": 810, "debt_to_income_ratio": 0.08, "assets_value": 600000.0, "employment_status": "Employed", "years_at_current_job": 8, "payment_history": "Good", "previous_defaults": 0, "number_of_dependents": 3, "loan_amount": 60000.0, "loan_purpose": "Home", "risk_rating": "low", "default_probability": 0.02, "confidence_score": 0.96},
            
            # Medium Risk Applicants
            {"age": 31, "gender": "Male", "education_level": "Bachelor", "marital_status": "Single", "income": 55000.0, "credit_score": 670, "debt_to_income_ratio": 0.35, "assets_value": 40000.0, "employment_status": "Self-employed", "years_at_current_job": 2, "payment_history": "Fair", "previous_defaults": 0, "number_of_dependents": 1, "loan_amount": 20000.0, "loan_purpose": "Business", "risk_rating": "medium", "default_probability": 0.32, "confidence_score": 0.81},
            {"age": 27, "gender": "Female", "education_level": "Bachelor", "marital_status": "Single", "income": 62000.0, "credit_score": 680, "debt_to_income_ratio": 0.28, "assets_value": 30000.0, "employment_status": "Employed", "years_at_current_job": 3, "payment_history": "Fair", "previous_defaults": 0, "number_of_dependents": 0, "loan_amount": 18000.0, "loan_purpose": "Education", "risk_rating": "medium", "default_probability": 0.28, "confidence_score": 0.84},
            {"age": 47, "gender": "Male", "education_level": "High School", "marital_status": "Married", "income": 70000.0, "credit_score": 650, "debt_to_income_ratio": 0.40, "assets_value": 150000.0, "employment_status": "Employed", "years_at_current_job": 9, "payment_history": "Good", "previous_defaults": 0, "number_of_dependents": 2, "loan_amount": 35000.0, "loan_purpose": "Home", "risk_rating": "medium", "default_probability": 0.38, "confidence_score": 0.79},
            {"age": 35, "gender": "Female", "education_level": "Master", "marital_status": "Divorced", "income": 78000.0, "credit_score": 660, "debt_to_income_ratio": 0.33, "assets_value": 90000.0, "employment_status": "Employed", "years_at_current_job": 5, "payment_history": "Fair", "previous_defaults": 0, "number_of_dependents": 1, "loan_amount": 22000.0, "loan_purpose": "Personal", "risk_rating": "medium", "default_probability": 0.34, "confidence_score": 0.82},
            {"age": 58, "gender": "Male", "education_level": "Bachelor", "marital_status": "Married", "income": 85000.0, "credit_score": 640, "debt_to_income_ratio": 0.38, "assets_value": 180000.0, "employment_status": "Employed", "years_at_current_job": 4, "payment_history": "Fair", "previous_defaults": 0, "number_of_dependents": 0, "loan_amount": 45000.0, "loan_purpose": "Home", "risk_rating": "medium", "default_probability": 0.42, "confidence_score": 0.77},

            # High Risk Applicants
            {"age": 24, "gender": "Male", "education_level": "High School", "marital_status": "Single", "income": 28000.0, "credit_score": 580, "debt_to_income_ratio": 0.48, "assets_value": 5000.0, "employment_status": "Unemployed", "years_at_current_job": 0, "payment_history": "Poor", "previous_defaults": 1, "number_of_dependents": 0, "loan_amount": 10000.0, "loan_purpose": "Personal", "risk_rating": "high", "default_probability": 0.78, "confidence_score": 0.89},
            {"age": 33, "gender": "Female", "education_level": "High School", "marital_status": "Single", "income": 42000.0, "credit_score": 590, "debt_to_income_ratio": 0.45, "assets_value": 12000.0, "employment_status": "Self-employed", "years_at_current_job": 1, "payment_history": "Poor", "previous_defaults": 2, "number_of_dependents": 2, "loan_amount": 15000.0, "loan_purpose": "Business", "risk_rating": "high", "default_probability": 0.82, "confidence_score": 0.87},
            {"age": 40, "gender": "Male", "education_level": "Bachelor", "marital_status": "Divorced", "income": 48000.0, "credit_score": 570, "debt_to_income_ratio": 0.52, "assets_value": 25000.0, "employment_status": "Employed", "years_at_current_job": 2, "payment_history": "Fair", "previous_defaults": 1, "number_of_dependents": 1, "loan_amount": 30000.0, "loan_purpose": "Auto", "risk_rating": "high", "default_probability": 0.74, "confidence_score": 0.83},
            {"age": 22, "gender": "Female", "education_level": "High School", "marital_status": "Single", "income": 32000.0, "credit_score": 560, "debt_to_income_ratio": 0.42, "assets_value": 8000.0, "employment_status": "Employed", "years_at_current_job": 1, "payment_history": "Poor", "previous_defaults": 0, "number_of_dependents": 0, "loan_amount": 12000.0, "loan_purpose": "Personal", "risk_rating": "high", "default_probability": 0.68, "confidence_score": 0.81},
            {"age": 50, "gender": "Male", "education_level": "High School", "marital_status": "Married", "income": 35000.0, "credit_score": 530, "debt_to_income_ratio": 0.58, "assets_value": 45000.0, "employment_status": "Self-employed", "years_at_current_job": 3, "payment_history": "Poor", "previous_defaults": 3, "number_of_dependents": 4, "loan_amount": 25000.0, "loan_purpose": "Home", "risk_rating": "high", "default_probability": 0.89, "confidence_score": 0.92},
        ]

        total_seeded = 0
        for i, template in enumerate(applicant_templates):
            app_id = f"APP-SEED-{1000 + i}"
            
            # Backdate created_at by a random number of days (0 to 6)
            days_back = random.randint(0, 6)
            created_time = today - timedelta(days=days_back, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            # 1. Create applicant
            applicant = Applicant(
                applicant_id=app_id,
                age=template["age"],
                gender=template["gender"],
                education_level=template["education_level"],
                marital_status=template["marital_status"],
                income=template["income"],
                credit_score=template["credit_score"],
                debt_to_income_ratio=template["debt_to_income_ratio"],
                assets_value=template["assets_value"],
                employment_status=template["employment_status"],
                years_at_current_job=template["years_at_current_job"],
                payment_history=template["payment_history"],
                previous_defaults=template["previous_defaults"],
                number_of_dependents=template["number_of_dependents"],
                created_at=created_time
            )
            db.add(applicant)
            
            # 2. Create scoring request
            req_id = f"REQ-SEED-{1000 + i}"
            
            # Explanations structure
            explanations = {
                "top_features": [
                    {"name": "credit_score", "impact": 0.35 if template["risk_rating"] == "high" else 0.15, "direction": "positive" if template["risk_rating"] == "high" else "negative"},
                    {"name": "debt_to_income_ratio", "impact": 0.25 if template["risk_rating"] == "high" else 0.05, "direction": "positive" if template["risk_rating"] == "high" else "negative"},
                    {"name": "income", "impact": 0.20 if template["risk_rating"] == "low" else 0.05, "direction": "negative" if template["risk_rating"] == "low" else "positive"},
                    {"name": "previous_defaults", "impact": 0.30 if template["previous_defaults"] > 0 else 0.0, "direction": "positive"}
                ],
                "base_value": 0.15,
                "expected_value": template["default_probability"]
            }
            
            # Audit trail structure
            audit_trail = {
                "timestamp": created_time.isoformat(),
                "user_id": "system_seeder",
                "ip_address": "127.0.0.1",
                "request_data": {
                    "applicant_id": app_id,
                    "loan_amount": template["loan_amount"]
                },
                "response_data": {
                    "risk_rating": template["risk_rating"],
                    "default_probability": template["default_probability"]
                }
            }
            
            db_request = ScoringRequest(
                request_id=req_id,
                applicant_id=app_id,
                loan_amount=template["loan_amount"],
                loan_purpose=template["loan_purpose"],
                model_version="xgboost_v1.0",
                model_name="xgboost",
                risk_rating=template["risk_rating"],
                default_probability=template["default_probability"],
                raw_probability=template["default_probability"],
                confidence_score=template["confidence_score"],
                processing_time_ms=12.5 + random.random() * 5.0,
                explanations=explanations,
                audit_trail=audit_trail,
                created_at=created_time
            )
            db.add(db_request)
            total_seeded += 1
            
        db.commit()
        return {"status": "success", "message": f"Successfully seeded {total_seeded} mock records."}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed dashboard data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed dashboard: {str(e)}",
        )
