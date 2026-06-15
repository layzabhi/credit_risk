import React, { useState } from 'react';
import ScoringForm from '../components/ScoringForm';
import ScoringResult from '../components/ScoringResult';
import ExplainabilityPanel from '../components/ExplainabilityPanel';

/**
 * ScoringPage - Single applicant credit risk scoring interface
 */
export function ScoringPage() {
  const [scoreResult, setScoreResult] = useState(null);
  const [showExplanations, setShowExplanations] = useState(false);

  const handleScoreComplete = (result) => {
    setScoreResult(result);
    setShowExplanations(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Credit Risk Scoring</h1>
        <p className="text-gray-600 mt-1">Assess credit risk for individual applicants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scoring Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Details</h2>
            <ScoringForm onScoreComplete={handleScoreComplete} />
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {scoreResult && (
            <>
              {/* Score Result */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Result</h2>
                <ScoringResult result={scoreResult} />
              </div>

              {/* Explanations */}
              {showExplanations && scoreResult.feature_importance && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Model Explanation</h2>
                  <ExplainabilityPanel result={scoreResult} />
                </div>
              )}
            </>
          )}

          {!scoreResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <p className="text-blue-800">
                Fill in the application details on the left and click "Score" to see the assessment results here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScoringPage;
