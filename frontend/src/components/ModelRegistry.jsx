/**
 * ModelRegistry Component
 * 
 * Displays model version history, metrics, and promotion controls.
 * Features:
 * - Model listing with version history
 * - Performance metrics comparison
 * - Model promotion to production
 * - Rollback functionality
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Upload,
  RotateCcw,
} from 'lucide-react';

const ModelRegistry = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [promotingModel, setPromotingModel] = useState(null);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/governance/models');
      setModels(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load models');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Promote model to production
  const handlePromote = async (modelId) => {
    if (
      !window.confirm(
        'Are you sure you want to promote this model to production?'
      )
    ) {
      return;
    }

    setPromotingModel(modelId);
    try {
      const response = await axios.post(
        `/api/v1/governance/models/${modelId}/promote`
      );
      setModels(models.map((m) => (m.model_id === modelId ? response.data : m)));
      alert('Model promoted successfully');
    } catch (err) {
      alert('Promotion failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setPromotingModel(null);
    }
  };

  // Rollback to previous model
  const handleRollback = async (modelId) => {
    if (
      !window.confirm(
        'Are you sure you want to rollback to this model? Current production model will be deactivated.'
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `/api/v1/governance/models/${modelId}/rollback`
      );
      setModels(models.map((m) => (m.model_id === modelId ? response.data : m)));
      alert('Rollback completed successfully');
    } catch (err) {
      alert('Rollback failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Model Registry</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Model List */}
      <div className="space-y-4">
        {models.map((model) => (
          <div
            key={model.model_id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            <div
              className="p-6 cursor-pointer"
              onClick={() =>
                setSelectedModel(
                  selectedModel === model.model_id ? null : model.model_id
                )
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{model.model_name}</h3>
                    <span className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-semibold">
                      v{model.version}
                    </span>
                    {model.is_production && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                        🚀 Production
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {model.model_type} • Trained{' '}
                    {new Date(model.training_date).toLocaleDateString()}
                  </p>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Accuracy</p>
                      <p className="text-lg font-bold text-gray-900">
                        {(model.accuracy * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Precision</p>
                      <p className="text-lg font-bold text-gray-900">
                        {(model.precision * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Recall</p>
                      <p className="text-lg font-bold text-gray-900">
                        {(model.recall * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">F1-Score</p>
                      <p className="text-lg font-bold text-gray-900">
                        {(model.f1_score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">AUC-ROC</p>
                      <p className="text-lg font-bold text-blue-600">
                        {(model.auc_roc * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!model.is_production && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePromote(model.model_id);
                    }}
                    disabled={promotingModel === model.model_id}
                    className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <Upload size={18} />
                    Promote
                  </button>
                )}
                {model.is_production && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRollback(model.model_id);
                    }}
                    className="ml-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <RotateCcw size={18} />
                    Rollback
                  </button>
                )}
              </div>

              {/* Details Section */}
              {selectedModel === model.model_id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold mb-4">Model Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Model ID</p>
                      <p className="font-mono text-xs break-all">
                        {model.model_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Training Samples</p>
                      <p className="font-bold">
                        {model.training_samples.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Training Date</p>
                      <p className="font-bold">
                        {new Date(model.training_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-bold capitalize">{model.status}</p>
                    </div>
                    {model.promoted_at && (
                      <>
                        <div>
                          <p className="text-gray-600">Promoted At</p>
                          <p className="font-bold">
                            {new Date(model.promoted_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Promoted By</p>
                          <p className="font-bold">{model.promoted_by}</p>
                        </div>
                      </>
                    )}
                  </div>
                  {model.notes && (
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm">Notes</p>
                      <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                        {model.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {models.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600">No models registered yet</p>
        </div>
      )}
    </div>
  );
};

export default ModelRegistry;