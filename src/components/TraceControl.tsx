import React, { useState } from 'react';
import axios from 'axios';
import { ProxyDeployments, ActiveTrace } from '../types';

interface TraceControlProps {
  deploymentsData: ProxyDeployments;
  onTraceCreated: () => void;
  onRefreshDeployments: () => void;
}

const DURATIONS = [
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
];

export function TraceControl({ deploymentsData, onTraceCreated, onRefreshDeployments }: TraceControlProps) {
  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [duration, setDuration] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDeployment = deploymentsData.deployments.find(d => d.environment === selectedEnv);

  const handleEnableTrace = async () => {
    if (!selectedDeployment) return;
    setLoading(true);
    setError(null);
    try {
      await axios.post<ActiveTrace>('/api/traces', {
        proxy: deploymentsData.proxy,
        environment: selectedEnv,
        revision: selectedDeployment.revision,
        timeoutSeconds: duration,
      });
      onTraceCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create trace session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Deployments</h2>
          <p className="text-sm text-[#0F172A] font-bold mt-1">{deploymentsData.proxy}</p>
        </div>
        <button 
          onClick={onRefreshDeployments}
          className="text-[10px] uppercase font-bold tracking-wider text-[#0284C7] hover:text-[#0369A1]"
        >
          Refresh Deployments
        </button>
      </div>

      <div className="mb-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#CBD5E1]">
              <th className="pb-2 font-bold text-[#64748B] text-xs uppercase">Environment</th>
              <th className="pb-2 font-bold text-[#64748B] text-xs uppercase">Revision</th>
              <th className="pb-2 font-bold text-[#64748B] text-xs uppercase">Status</th>
              <th className="pb-2 font-bold text-[#64748B] text-xs uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {deploymentsData.deployments.map(d => (
              <tr key={d.environment} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                <td className="py-3 font-medium text-[#0F172A]">{d.environment}</td>
                <td className="py-3 text-[#64748B] font-mono text-xs">{d.revision}</td>
                <td className="py-3 text-[#059669] text-xs font-bold uppercase">{d.state}</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => setSelectedEnv(d.environment)}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${selectedEnv === d.environment ? 'bg-[#0284C7] text-white' : 'border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]'}`}
                  >
                    {selectedEnv === d.environment ? 'SELECTED' : 'SELECT'}
                  </button>
                </td>
              </tr>
            ))}
            {deploymentsData.deployments.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-[#64748B] text-sm">No deployments found for this proxy.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDeployment && (
        <div className="border-t border-[#F1F5F9] pt-6">
          <h3 className="text-xs font-bold text-[#64748B] uppercase mb-4">Create New Session</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-1">Environment</label>
                <div className="w-full text-xs border border-[#CBD5E1] rounded px-3 py-2 bg-[#F8FAFC] font-medium text-[#0F172A]">
                  {selectedEnv} (Rev {selectedDeployment.revision})
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full text-xs border border-[#CBD5E1] rounded px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#0284C7] font-medium text-[#0F172A]"
                >
                  {DURATIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-3 rounded text-xs font-medium">
                {error}
              </div>
            )}

            <button
              onClick={handleEnableTrace}
              disabled={loading}
              className="w-full border-2 border-[#0F172A] text-[#0F172A] py-2.5 rounded-lg text-xs font-bold hover:bg-[#0F172A] hover:text-white transition-all disabled:opacity-50"
            >
              {loading ? 'STARTING SESSION...' : 'START DEBUG SESSION'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
