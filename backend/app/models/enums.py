"""
Core enumerations for Credit Risk Assessment System.
Defines demographic, financial, and risk categories.
"""

from enum import Enum


class GenderEnum(str, Enum):
    """Gender enumeration."""
    MALE = "Male"
    FEMALE = "Female"
    NON_BINARY = "Non-binary"


class EducationLevel(str, Enum):
    """Education level enumeration."""
    HIGH_SCHOOL = "High School"
    BACHELOR = "Bachelor"
    MASTER = "Master"
    PHD = "PhD"


class MaritalStatus(str, Enum):
    """Marital status enumeration."""
    SINGLE = "Single"
    MARRIED = "Married"
    DIVORCED = "Divorced"
    WIDOWED = "Widowed"


class LoanPurpose(str, Enum):
    """Loan purpose enumeration."""
    PERSONAL = "Personal"
    AUTO = "Auto"
    HOME = "Home"
    EDUCATION = "Education"
    BUSINESS = "Business"


class EmploymentStatus(str, Enum):
    """Employment status enumeration."""
    EMPLOYED = "Employed"
    SELF_EMPLOYED = "Self-employed"
    UNEMPLOYED = "Unemployed"


class PaymentHistory(str, Enum):
    """Payment history enumeration."""
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"


class RiskRating(str, Enum):
    """Risk rating enumeration."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
