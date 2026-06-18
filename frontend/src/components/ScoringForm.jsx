import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Loader2, Play } from 'lucide-react';

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
  const [validationErrors, setValidationErrors] = useState({});

  // Form field definitions with validation rules
  const fields = [
    { name: 'applicant_id', label: 'Applicant ID', type: 'text', required: true, span: 2 },
    { name: 'age', label: 'Age', type: 'number', min: 18, max: 100, required: true },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary'], required: true },
    { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Bachelor', 'Master', 'PhD'], required: true },
    { name: 'marital_status', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'], required: true },
    { name: 'income', label: 'Annual Income ($)', type: 'number', min: 0, required: true },
    { name: 'credit_score', label: 'FICO Credit Score (300-850)', type: 'number', min: 300, max: 850, required: true },
    { name: 'loan_amount', label: 'Requested Loan Amount ($)', type: 'number', min: 0, required: true },
    { name: 'loan_purpose', label: 'Loan Purpose', type: 'select', options: ['Personal', 'Auto', 'Home', 'Education', 'Business'], required: true },
    { name: 'employment_status', label: 'Employment Status', type: 'select', options: ['Employed', 'Self-employed', 'Unemployed'], required: true },
    { name: 'years_at_current_job', label: 'Years of Employment', type: 'number', min: 0, max: 60, required: true },
    { name: 'payment_history', label: 'Payment History', type: 'select', options: ['Good', 'Fair', 'Poor'], required: true },
    { name: 'debt_to_income_ratio', label: 'Debt-to-Income (DTI) Ratio', type: 'number', min: 0, max: 1, step: 0.01, required: true },
    { name: 'assets_value', label: 'Total Assets ($)', type: 'number', min: 0, required: true },
    { name: 'number_of_dependents', label: 'Number of Dependents', type: 'number', min: 0, max: 10, required: true },
    { name: 'previous_defaults', label: 'Previous Defaults', type: 'number', min: 0, required: true },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'years_at_current_job' || name === 'number_of_dependents' || name === 'previous_defaults' || name === 'age' || name === 'income' || name === 'credit_score' || name === 'loan_amount' || name === 'debt_to_income_ratio' || name === 'assets_value'
        ? value === '' ? '' : Number(value)
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
      setError('Please correct the validation errors below');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/v1/score', formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold text-xs">Error</p>
            <p className="text-[11px]">{error}</p>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {fields.map(field => {
          const isDisabled = false;
          return (
            <div key={field.name} className={`${field.span === 2 ? 'md:col-span-2' : ''} space-y-1`}>
              <label htmlFor={field.name} className="block text-xs font-semibold text-slate-500">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
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
                  disabled={isDisabled}
                  className={`w-full border border-outline-variant rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface font-mono ${
                    isDisabled 
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-dashed' 
                      : 'bg-white'
                  }`}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  required={field.required}
                />
              )}

              {validationErrors[field.name] && (
                <p className="text-red-500 text-[10px] font-semibold pl-1 mt-0.5">{validationErrors[field.name]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin text-white" />
              Computing Risk Profile...
            </>
          ) : (
            <>
              <Play size={14} className="fill-current text-white" />
              Run Risk Analysis
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ScoringForm;