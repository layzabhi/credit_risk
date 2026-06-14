/**
 * ScoringForm Component
 * 
 * Single applicant credit risk assessment form.
 * Features:
 * - Form validation with real-time feedback
 * - Submit to API endpoint
 * - Display risk rating with color coding
 * - Show SHAP explanations
 * - Loading state management
 */

import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Loader, CheckCircle, TrendingUp } from 'lucide-react';

const ScoringForm = ({ onScoreComplete }) => {
  const [formData, setFormData] = useState({
    applicant_id: `APP_${Date.now()}`,
    age: '',
    gender: 'Male',
    education_level: 'High School',
    marital_status: 'Single',
    income: '',
    credit_score: '',
    loan_amount: '',
    loan_purpose: 'Personal',
    employment_status: 'Employed',
    years_at_current_job: '',
    payment_history: 'Good',
    debt_to_income_ratio: '',
    assets_value: '',
    number_of_dependents: '',
    previous_defaults: '0',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Form field definitions with validation rules
  const fields = [
    { name: 'age', label: 'Age', type: 'number', min: 18, max: 100, required: true },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary'], required: true },
    { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Bachelor', 'Master', 'PhD'], required: true },
    { name: 'marital_status', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'], required: true },
    { name: 'income', label: 'Annual Income ($)', type: 'number', min: 0, required: true },
    { name: 'credit_score', label: 'Credit Score', type: 'number', min: 300, max: 850, required: true },
    { name: 'loan_amount', label: 'Loan Amount ($)', type: 'number', min: 0, required: true },
    { name: 'loan_purpose', label: 'Loan Purpose', type: 'select', options: ['Personal', 'Auto', 'Home', 'Education', 'Business'], required: true },
    { name: 'employment_status', label: 'Employment Status', type: 'select', options: ['Employed', 'Self-employed', 'Unemployed'], required: true },
    { name: 'years_at_current_job', label: 'Years at Current Job', type: 'number', min: 0, max: 60, required: true },
    { name: 'payment_history', label: 'Payment History', type: 'select', options: ['Good', 'Fair', 'Poor'], required: true },
    { name: 'debt_to_income_ratio', label: 'Debt-to-Income Ratio', type: 'number', min: 0, max: 1, step: 0.01, required: true },
    { name: 'assets_value', label: 'Total Assets ($)', type: 'number', min: 0, required: true },
    { name: 'number_of_dependents', label: 'Number of Dependents', type: 'number', min: 0, max: 10, required: true },
    { name: 'previous_defaults', label: 'Previous Defaults', type: 'number', min: 0, required: true },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'years_at_current_job' || name === 'number_of_dependents' || name === 'previous_defaults'
        ? parseInt(value) || ''
        : value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Age validation
    if (!formData.age || formData.age < 18 || formData.age > 100) {
      errors.age = 'Age must be between 18 and 100';
    }
    
    // Income validation
    if (!formData.income || formData.income <= 0) {
      errors.income = 'Income must be positive';
    }
    
    // Credit score validation
    if (!formData.credit_score || formData.credit_score < 300 || formData.credit_score > 850) {
      errors.credit_score = 'Credit score must be between 300 and 850';
    }
    
    // Loan amount validation
    if (!formData.loan_amount || formData.loan_amount <= 0) {
      errors.loan_amount = 'Loan amount must be positive';
    }
    
    // DTI validation
    if (formData.debt_to_income_ratio === '' || formData.debt_to_income_ratio < 0 || formData.debt_to_income_ratio > 1) {
      errors.debt_to_income_ratio = 'DTI ratio must be between 0 and 1';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please correct the errors above');
      return;
    }
    
    setLoading(true);
    setError(null);
    setScoreResult(null);
    
    try {
      const response = await axios.post('/api/v1/score', formData);
      setScoreResult(response.data);
      
      if (onScoreComplete) {
        onScoreComplete(response.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to score applicant';
      setError(errorMessage);
      console.error('Scoring error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (rating) => {
    const colors = {
      'low': 'bg-green-50 border-green-200',
      'medium': 'bg-yellow-50 border-yellow-200',
      'high': 'bg-red-50 border-red-200',
    };
    return colors[rating?.toLowerCase()] || 'bg-gray-50 border-gray-200';
  };

  const getRiskTextColor = (rating) => {
    const colors = {
      'low': 'text-green-700',
      'medium': 'text-yellow-700',
      'high': 'text-red-700',
    };
    return colors[rating?.toLowerCase()] || 'text-gray-700';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Credit Risk Assessment</h1>
      <p className="text-gray-600 mb-8">Enter applicant information for instant risk scoring</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {fields.map(field => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  min={field.min}
                  max={field.max}
                  step={field.step || 1}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}

              {validationErrors[field.name] && (
                <p className="text-red-500 text-sm mt-1">{validationErrors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Scoring...
            </>
          ) : (
            <>
              <TrendingUp size={20} />
              Score Applicant
            </>
          )}
        </button>
      </form>

      {/* Result Display */}
      {scoreResult && (
        <div className={`mt-8 p-8 rounded-lg border-2 ${getRiskColor(scoreResult.risk_rating)}`}>
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className={`${getRiskTextColor(scoreResult.risk_rating)}`} size={28} />
            <h2 className={`text-2xl font-bold ${getRiskTextColor(scoreResult.risk_rating)}`}>
              {scoreResult.risk_rating?.toUpperCase()} RISK
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-600">Default Probability</p>
              <p className="text-2xl font-bold text-gray-900">{(scoreResult.default_probability * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Confidence Score</p>
              <p className="text-2xl font-bold text-gray-900">{(scoreResult.confidence_score * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Model Version</p>
              <p className="text-2xl font-bold text-gray-900">{scoreResult.model_version}</p>
            </div>
          </div>

          {/* Top Features */}
          {scoreResult.explanations?.top_features?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Key Influencing Factors</h3>
              <div className="space-y-3">
                {scoreResult.explanations.top_features.slice(0, 5).map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-700 capitalize">{feature.name.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${feature.direction === 'positive' ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(feature.impact * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{(feature.impact * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-6">
            Scored at {new Date(scoreResult.scoring_timestamp).toLocaleString()} · Processing time: {scoreResult.processing_time_ms.toFixed(2)}ms
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoringForm;