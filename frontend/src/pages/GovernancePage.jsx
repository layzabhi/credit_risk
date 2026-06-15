import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import AuditLog from '../components/AuditLog';
import ModelRegistry from '../components/ModelRegistry';
import { FileText, Shield, Settings } from 'lucide-react';

/**
 * GovernancePage - Compliance, audit logs, and model management
 */
export function GovernancePage() {
  const { get } = useApi();
  const [activeTab, setActiveTab] = useState('audit');
  const [complianceMetrics, setComplianceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const loadGovernanceData = async () => {
    try {
      setLoading(true);
      const data = await get('/v1/governance/metrics');
      setComplianceMetrics(data);
    } catch (err) {
      console.error('Failed to load governance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'audit', label: 'Audit Log', icon: FileText },
    { id: 'models', label: 'Model Registry', icon: Settings },
    { id: 'compliance', label: 'Compliance', icon: Shield },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Governance</h1>
        <p className="text-gray-600 mt-1">Audit trails, compliance tracking, and model management</p>
      </div>

      {/* Compliance Summary Cards */}
      {complianceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Assessments</p>
            <p className="text-3xl font-bold text-gray-900">{complianceMetrics.total_assessments || 0}</p>
            <p className="text-xs text-gray-600 mt-2">This month</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Audit Events</p>
            <p className="text-3xl font-bold text-gray-900">{complianceMetrics.audit_events || 0}</p>
            <p className="text-xs text-gray-600 mt-2">Last 30 days</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Compliance Score</p>
            <p className="text-3xl font-bold text-green-600">{complianceMetrics.compliance_score || 0}%</p>
            <p className="text-xs text-gray-600 mt-2">Target: 95%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 bg-white rounded-t-lg px-6 pt-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg border border-gray-200 p-6">
        {activeTab === 'audit' && <AuditLog />}
        {activeTab === 'models' && <ModelRegistry />}
        {activeTab === 'compliance' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h3>
            <div className="space-y-4">
              {[
                { name: 'Fair Lending Compliance', status: 'compliant', description: 'ECOA and FHA requirements met' },
                { name: 'Data Privacy', status: 'compliant', description: 'GDPR and CCPA compliant' },
                { name: 'Model Governance', status: 'compliant', description: 'Model validation and testing complete' },
                { name: 'Audit Trail', status: 'compliant', description: 'All decisions documented and auditable' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'compliant'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GovernancePage;
