import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ActiveTrace } from '../types';
import { ExternalLink, RefreshCw } from 'lucide-react';

export function ActiveTraces() {
  const [traces, setTraces] = useState<ActiveTrace[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadTraces();
    const interval = setInterval(() => {
      setNow(Date.now());
      loadTraces(); // Refresh every 5 seconds from server to get sync states
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTraces = async () => {
    try {
      const { data } = await axios.get<ActiveTrace[]>('/api/traces/active');
      setTraces(data);
    } catch (err) {
      console.error('Failed to load active traces', err);
    }
  };

  const toggleAutoRenew = async (trace: ActiveTrace) => {
    try {
      await axios.post(`/api/traces/${trace.proxy}/${trace.environment}/renewal`, {
        enabled: !trace.autoRenew
      });
      loadTraces();
    } catch (err) {
      alert('Failed to toggle auto-renew');
    }
  };

  const getRemainingTime = (expiresAt: number) => {
    const diff = Math.max(0, expiresAt - now);
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (traces.length === 0) {
    return (
      <div className="mt-8 border-t border-[#F1F5F9] pt-8">
        <div className="flex items-center gap-2 mb-6 opacity-50">
          <div className="w-2 h-2 rounded-full bg-[#94A3B8]"></div>
          <h2 className="text-sm font-bold text-[#64748B] uppercase">Active Traces</h2>
        </div>
        <div className="text-center py-8 text-[#94A3B8] border border-dashed border-[#CBD5E1] rounded-xl bg-[#F8FAFC] opacity-75">
          <p className="text-xs font-bold uppercase tracking-widest mb-1">No Active Debug Sessions</p>
          <p className="text-[10px]">Traces you start will appear here and auto-renew.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-[#F1F5F9] pt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse"></div>
        <h2 className="text-sm font-bold text-[#0F172A] uppercase">Active Traces</h2>
      </div>
      <div className="space-y-6">
        {traces.map(trace => (
          <div key={trace.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold text-[#0F172A]">{trace.proxy}</h4>
                  <p className="text-xs text-[#64748B] font-mono">{trace.environment.toUpperCase()} • Rev {trace.revision} • {trace.sessionId.substring(0, 12)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-mono font-bold ${trace.status === 'ACTIVE' ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>
                    {trace.status === 'ACTIVE' ? getRemainingTime(trace.expiresAt) : '00:00'}
                  </p>
                  <p className={`text-[10px] font-bold uppercase ${trace.status === 'ACTIVE' ? 'text-[#059669]' : trace.status === 'FAILED' ? 'text-[#B91C1C]' : 'text-[#64748B]'}`}>
                    {trace.status}
                  </p>
                </div>
              </div>
            </div>
            
            {trace.errorMessage && (
              <div className="mb-4 text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded font-medium">
                {trace.errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <a
                href={`https://console.cloud.google.com/apigee/proxies/${trace.proxy}/trace?project=${trace.organization}&environment=${trace.environment}&revision=${trace.revision}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#0284C7] text-white py-2.5 rounded-lg text-xs font-bold text-center hover:bg-[#0369A1] shadow-sm flex items-center justify-center gap-1 transition-colors"
              >
                Open Apigee Trace Console <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex items-center justify-between p-2 border border-[#E2E8F0] rounded-lg bg-white mt-2">
                <span className="text-xs font-medium text-[#475569]">Auto-Renewal</span>
                <button
                  onClick={() => toggleAutoRenew(trace)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <span className={`text-[10px] font-bold uppercase ${trace.autoRenew ? 'text-[#059669]' : 'text-[#64748B]'}`}>
                    {trace.autoRenew ? 'Enabled' : 'Disabled'}
                  </span>
                  <div className={`w-8 h-4 rounded-full relative p-0.5 transition-colors ${trace.autoRenew ? 'bg-[#059669]' : 'bg-[#CBD5E1]'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${trace.autoRenew ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
