import React, { useState, useEffect } from 'react';
import { useApigee } from '../context/ApigeeContext';
import { ActiveTrace } from '../types';
import { ExternalLink, Radio, Trash2, StopCircle, RotateCcw, AlertTriangle } from 'lucide-react';

export function ActiveTraces() {
  const { activeTraces, toggleAutoRenew, stopTrace, removeTraceRecord, connection } = useApigee();
  const [now, setNow] = useState(Date.now());

  // Local ticker for smooth second-by-second countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingTime = (trace: ActiveTrace) => {
    if (trace.status !== 'ACTIVE' && trace.status !== 'RENEWING') {
      return '00:00';
    }
    const diff = Math.max(0, trace.expiresAt - now);
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getConsoleLink = (trace: ActiveTrace) => {
    const project = connection?.project || trace.organization;
    return `https://console.cloud.google.com/apigee/proxies/${encodeURIComponent(trace.proxy)}/trace?project=${encodeURIComponent(project)}&environment=${encodeURIComponent(trace.environment)}&revision=${encodeURIComponent(trace.revision)}`;
  };

  if (activeTraces.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#CBD5E1] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#94A3B8]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Active Debug Sessions</h3>
        </div>
        <div className="text-center py-8 text-[#94A3B8] border border-dashed border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1">No Active Sessions</p>
          <p className="text-[11px]">Select a proxy on the left and start a debug session to begin live tracing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#CBD5E1] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#0284C7] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            Active Sessions ({activeTraces.length})
          </h3>
        </div>
        <span className="text-[11px] text-[#64748B]">Client-side auto-renew worker active</span>
      </div>

      <div className="space-y-4">
        {activeTraces.map((trace) => {
          const isExpiringSoon = trace.status === 'ACTIVE' && (trace.expiresAt - now) <= 30000;

          return (
            <div
              key={trace.id}
              className={`rounded-xl border p-4 transition-all ${
                trace.status === 'ACTIVE'
                  ? isExpiringSoon
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-[#CBD5E1] bg-white'
                  : trace.status === 'RENEWING'
                  ? 'border-[#0284C7] bg-[#F0F9FF]'
                  : trace.status === 'FAILED'
                  ? 'border-rose-300 bg-rose-50/40'
                  : 'border-[#E2E8F0] bg-[#F8FAFC]'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#0F172A]">{trace.proxy}</h4>
                    <span className="text-[10px] font-mono bg-[#E2E8F0] text-[#334155] px-1.5 py-0.5 rounded">
                      Rev {trace.revision}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] font-mono mt-0.5">
                    {trace.environment.toUpperCase()} • Session:{' '}
                    <span className="text-[#0F172A]">{trace.sessionId.substring(0, 16)}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-xl font-bold tracking-tight text-[#0F172A]">
                    {getRemainingTime(trace)}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {trace.status === 'ACTIVE' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    )}
                    {trace.status === 'RENEWING' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#0284C7] uppercase">
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        Renewing
                      </span>
                    )}
                    {trace.status === 'EXPIRED' && (
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">Expired</span>
                    )}
                    {trace.status === 'FAILED' && (
                      <span className="text-[10px] font-bold text-rose-700 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message if Failed */}
              {trace.errorMessage && (
                <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  {trace.errorMessage}
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
                {/* Auto Renew Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAutoRenew(trace.id)}
                    className="flex items-center gap-2 text-xs font-semibold text-[#475569] focus:outline-none"
                  >
                    <div
                      className={`w-8 h-4 rounded-full relative p-0.5 transition-colors ${
                        trace.autoRenew ? 'bg-emerald-600' : 'bg-[#CBD5E1]'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 bg-white rounded-full shadow-xs transition-transform ${
                          trace.autoRenew ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                    <span>Auto-Renew</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={getConsoleLink(trace)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:text-[#0369A1] hover:underline px-2 py-1"
                  >
                    Open Console <ExternalLink className="w-3 h-3" />
                  </a>

                  {trace.status === 'ACTIVE' && (
                    <button
                      onClick={() => stopTrace(trace.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors"
                      title="Stop trace session on Apigee X"
                    >
                      <StopCircle className="w-3 h-3" />
                      Stop
                    </button>
                  )}

                  {(trace.status === 'EXPIRED' || trace.status === 'FAILED') && (
                    <button
                      onClick={() => removeTraceRecord(trace.id)}
                      className="text-xs text-[#64748B] hover:text-rose-600 p-1 rounded transition-colors"
                      title="Remove record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
