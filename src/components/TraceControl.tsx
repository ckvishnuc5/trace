import React, { useState, useEffect } from 'react';
import { useApigee } from '../context/ApigeeContext';
import { ProxyDeployments } from '../types';
import { ShieldAlert, Play, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface TraceControlProps {
  deploymentsData: ProxyDeployments;
  onRefreshDeployments: () => void;
  onSessionStarted: () => void;
}

const DURATIONS = [
  { label: '1 minute (60s)', value: 60 },
  { label: '2 minutes (120s)', value: 120 },
  { label: '5 minutes (300s)', value: 300 },
  { label: '10 minutes (600s)', value: 600 },
];

export function TraceControl({ deploymentsData, onRefreshDeployments, onSessionStarted }: TraceControlProps) {
  const { startTrace, isEnvBlocked } = useApigee();
  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [duration, setDuration] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-select first non-blocked environment if none selected
  useEffect(() => {
    if (deploymentsData.deployments.length > 0) {
      const nonBlocked = deploymentsData.deployments.find(d => !isEnvBlocked(d.environment));
      if (nonBlocked) {
        setSelectedEnv(nonBlocked.environment);
      } else {
        setSelectedEnv(deploymentsData.deployments[0].environment);
      }
    } else {
      setSelectedEnv('');
    }
  }, [deploymentsData, isEnvBlocked]);

  const selectedDeployment = deploymentsData.deployments.find(d => d.environment === selectedEnv);
  const isSelectedBlocked = selectedEnv ? isEnvBlocked(selectedEnv) : false;

  const handleStartTrace = async () => {
    if (!selectedDeployment) return;
    if (isSelectedBlocked) {
      setError(`Cannot start trace: '${selectedEnv}' is protected as a production environment.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await startTrace(
        deploymentsData.proxy,
        selectedDeployment.environment,
        selectedDeployment.revision,
        duration
      );
      setSuccessMsg(`Debug session started for ${deploymentsData.proxy} in ${selectedDeployment.environment}!`);
      onSessionStarted();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to start debug session via Apigee X API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#CBD5E1] p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
        <div>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Proxy Deployments</span>
          <h2 className="text-base font-bold text-[#0F172A] mt-0.5">{deploymentsData.proxy}</h2>
        </div>
        <button
          onClick={onRefreshDeployments}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Deployments Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#CBD5E1] text-[#64748B] uppercase font-bold text-[10px]">
              <th className="pb-2.5">Environment</th>
              <th className="pb-2.5">Revision</th>
              <th className="pb-2.5">State</th>
              <th className="pb-2.5 text-right">Selection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {deploymentsData.deployments.map((d) => {
              const blocked = isEnvBlocked(d.environment);
              const isSelected = selectedEnv === d.environment;

              return (
                <tr key={d.environment} className={`hover:bg-[#F8FAFC] transition-colors ${isSelected ? 'bg-[#F0F9FF]' : ''}`}>
                  <td className="py-3 font-semibold text-[#0F172A] flex items-center gap-2">
                    {d.environment}
                    {blocked && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        PROD (BLOCKED)
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-[#475569]">Rev {d.revision}</td>
                  <td className="py-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {d.state}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setSelectedEnv(d.environment)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#0284C7] text-white'
                          : 'border border-[#CBD5E1] text-[#334155] hover:bg-white'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {deploymentsData.deployments.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-[#94A3B8]">
                  No active deployments found for this proxy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Start Session Box */}
      {selectedDeployment && (
        <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-4">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
            Start Apigee X Trace Session
          </h3>

          {isSelectedBlocked ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Non-Production Safety Safeguard:</strong> Tracing is disabled for environment{' '}
                <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">{selectedEnv}</code> to safeguard production traffic. Please choose a non-production environment (e.g. dev, test, eval).
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Target Environment & Rev</label>
                  <div className="w-full text-xs border border-[#CBD5E1] rounded-lg px-3 py-2 bg-white text-[#0F172A] font-medium">
                    {selectedEnv} (Revision {selectedDeployment.revision})
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#0284C7]" />
                    Session Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full text-xs border border-[#CBD5E1] rounded-lg px-3 py-2 bg-white text-[#0F172A] font-medium focus:ring-2 focus:ring-[#0284C7] outline-none"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-3 rounded-lg text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {successMsg}
                </div>
              )}

              <button
                onClick={handleStartTrace}
                disabled={loading}
                className="w-full py-2.5 bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating Debug Session via Apigee X API...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Start Debug Session (Auto-Renewing)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
