-- SQL DDL Schema for Credit Risk Assessment System
-- Compatible with PostgreSQL and SQLite

-- 1. Applicants Table
CREATE TABLE IF NOT EXISTS applicants (
    applicant_id VARCHAR(36) PRIMARY KEY,
    age INTEGER NOT NULL,
    gender VARCHAR(20) NOT NULL,
    education_level VARCHAR(50) NOT NULL,
    marital_status VARCHAR(20) NOT NULL,
    income FLOAT NOT NULL,
    credit_score INTEGER NOT NULL,
    debt_to_income_ratio FLOAT NOT NULL,
    assets_value FLOAT NOT NULL,
    employment_status VARCHAR(20) NOT NULL,
    years_at_current_job INTEGER NOT NULL,
    payment_history VARCHAR(20) NOT NULL,
    previous_defaults INTEGER DEFAULT 0,
    number_of_dependents INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applicants_created_at ON applicants(created_at);

-- 2. Scoring Requests Table
CREATE TABLE IF NOT EXISTS scoring_requests (
    request_id VARCHAR(36) PRIMARY KEY,
    applicant_id VARCHAR(36) NOT NULL,
    loan_amount FLOAT NOT NULL,
    loan_purpose VARCHAR(50) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    model_name VARCHAR(50) NOT NULL,
    risk_rating VARCHAR(20) NOT NULL,
    default_probability FLOAT NOT NULL,
    raw_probability FLOAT NOT NULL,
    confidence_score FLOAT NOT NULL,
    processing_time_ms FLOAT NOT NULL,
    explanations TEXT, -- JSON column represented as text
    audit_trail TEXT NOT NULL, -- JSON column represented as text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_scoring_requests_applicant_id ON scoring_requests(applicant_id);
CREATE INDEX IF NOT EXISTS idx_scoring_requests_risk_rating ON scoring_requests(risk_rating);
CREATE INDEX IF NOT EXISTS idx_scoring_requests_created_at ON scoring_requests(created_at);

-- 3. Batch Jobs Table
CREATE TABLE IF NOT EXISTS batch_jobs (
    job_id VARCHAR(36) PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    total_records INTEGER NOT NULL,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    csv_file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    summary_metrics TEXT -- JSON column represented as text
);

CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at);

-- 4. Batch Results Table
CREATE TABLE IF NOT EXISTS batch_results (
    batch_result_id VARCHAR(36) PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL,
    applicant_id VARCHAR(36) NOT NULL,
    risk_rating VARCHAR(20) NOT NULL,
    default_probability FLOAT NOT NULL,
    confidence_score FLOAT NOT NULL,
    result_data TEXT NOT NULL, -- JSON column represented as text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES batch_jobs(job_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_batch_results_job_id ON batch_results(job_id);
CREATE INDEX IF NOT EXISTS idx_batch_results_applicant_id ON batch_results(applicant_id);
CREATE INDEX IF NOT EXISTS idx_batch_results_risk_rating ON batch_results(risk_rating);

-- 5. Model Registry Table
CREATE TABLE IF NOT EXISTS model_registry (
    model_id VARCHAR(36) PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL UNIQUE,
    model_type VARCHAR(50) NOT NULL,
    framework VARCHAR(50) NOT NULL,
    accuracy FLOAT,
    precision FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    auc_roc FLOAT,
    training_samples INTEGER NOT NULL,
    training_date TIMESTAMP NOT NULL,
    training_time_hours FLOAT,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    is_production BOOLEAN DEFAULT FALSE,
    deployment_date TIMESTAMP,
    promoted_at TIMESTAMP,
    promoted_by VARCHAR(100),
    model_path VARCHAR(500) NOT NULL,
    preprocessor_path VARCHAR(500),
    metadata TEXT, -- JSON column
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_registry_name ON model_registry(model_name);
CREATE INDEX IF NOT EXISTS idx_model_registry_version ON model_registry(version);
CREATE INDEX IF NOT EXISTS idx_model_registry_is_production ON model_registry(is_production);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    user_id VARCHAR(100),
    user_ip VARCHAR(50),
    applicant_id VARCHAR(36),
    job_id VARCHAR(36),
    request_id VARCHAR(36),
    model_id VARCHAR(36),
    details TEXT NOT NULL, -- JSON column
    error_message TEXT,
    duration_ms FLOAT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_applicant_id ON audit_logs(applicant_id);

-- 7. Explanations Table
CREATE TABLE IF NOT EXISTS explanations (
    explanation_id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL UNIQUE,
    shap_values TEXT NOT NULL, -- JSON column
    feature_importance TEXT NOT NULL, -- JSON column
    base_value FLOAT,
    expected_value FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES scoring_requests(request_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_explanations_request_id ON explanations(request_id);

-- 8. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 9. Portfolio Metrics Table
CREATE TABLE IF NOT EXISTS portfolio_metrics (
    metrics_id VARCHAR(36) PRIMARY KEY,
    date VARCHAR(10) NOT NULL UNIQUE, -- YYYY-MM-DD
    total_applicants INTEGER DEFAULT 0,
    total_scores INTEGER DEFAULT 0,
    low_risk_count INTEGER DEFAULT 0,
    medium_risk_count INTEGER DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    mean_default_probability FLOAT DEFAULT 0.0,
    median_default_probability FLOAT DEFAULT 0.0,
    std_default_probability FLOAT DEFAULT 0.0,
    metrics_by_gender TEXT, -- JSON column
    metrics_by_education TEXT, -- JSON column
    metrics_by_employment TEXT, -- JSON column
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_metrics_date ON portfolio_metrics(date);
