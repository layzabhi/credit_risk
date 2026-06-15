"""
Validation helpers for credit risk scoring parameters.
Provides validators for demographic and financial inputs.
"""

def validate_age(age: int) -> bool:
    """Validate applicant age is between 18 and 100."""
    return 18 <= age <= 100


def validate_income(income: float) -> bool:
    """Validate annual income is positive."""
    return income > 0


def validate_loan_amount(amount: float) -> bool:
    """Validate requested loan amount is positive."""
    return amount > 0


def validate_credit_score(score: int) -> bool:
    """Validate FICO credit score is between 300 and 850."""
    return 300 <= score <= 850


def validate_dti(dti: float) -> bool:
    """Validate debt-to-income ratio is between 0 and 1."""
    return 0.0 <= dti <= 1.0


def validate_assets_value(assets: float) -> bool:
    """Validate assets value is non-negative."""
    return assets >= 0.0


def validate_years_at_job(years: int) -> bool:
    """Validate years at current job is between 0 and 60."""
    return 0 <= years <= 60


def validate_previous_defaults(defaults: int) -> bool:
    """Validate number of previous defaults is non-negative."""
    return defaults >= 0


def validate_number_of_dependents(dependents: int) -> bool:
    """Validate number of dependents is between 0 and 10."""
    return 0 <= dependents <= 10
