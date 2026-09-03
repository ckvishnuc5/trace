import React, { useState } from 'react';
import { useApigee } from '../context/ApigeeContext';
import { Search, RefreshCw, Layers, Radio, AlertCircle } from 'lucide-react';
import { ProxyDeployments } from '../types';

interface ProxyListProps {
  selectedProxy: string | null;
  onSelectDeployments: (deployments: ProxyDeployments) => void;
  onSelectingProxy: (proxyName: string) => void;
}

export function ProxyList({ selectedProxy, onSelectDeployments, onSelectingProxy }: ProxyListProps) {
  const { proxies, loadingProxies, proxiesError, refreshProxies, getDeployments, activeTraces } = useApigee();
  const [search, setSearch] = useState('');
  const [loadingProxy, setLoadingProxy] = useState<string | null>(null);

  const handleSelect = async (proxy: string) => {
    onSelectingProxy(proxy);
    setLoadingProxy(proxy);
    try {
      const data = await getDeployments(proxy);
      onSelectDeployments(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load deployments for this proxy');
    } finally {
      setLoadingProxy(null);
    }
  };

  const filtered = proxies.filter(p => p.toLowerCase().includes(search.toLowerCase().trim()));

  const getActiveSessionCount = (proxy: string) => {
    return activeTraces.filter(t => t.proxy === proxy && (t.status === 'ACTIVE' || t.status === 'RENEWING')).length;
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header & Search */}
      <div className="p-4 border-b border-[#CBD5E1] bg-white shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0284C7]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">API Proxies</h2>
            <span className="bg-[#E2E8F0] text-[#475569] text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {proxies.length}
            </span>
          </div>
          <button
            onClick={refreshProxies}
            disabled={loadingProxies}
            title="Refresh Proxy List"
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingProxies ? 'animate-spin text-[#0284C7]' : ''}`} />
          </button>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
          </span>
          <input
            type="text"
            placeholder="Search API proxies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#CBD5E1] rounded-lg text-xs focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none bg-white text-[#0F172A]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {loadingProxies && proxies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#64748B] text-xs">
            <div className="w-5 h-5 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin mb-2" />
            Loading proxies from Apigee X...
          </div>
        )}

        {proxiesError && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-3 rounded-lg text-xs">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Failed to load proxies
            </div>
            <p className="text-[11px] leading-relaxed">{proxiesError}</p>
          </div>
        )}

        {!loadingProxies && filtered.map((proxy) => {
          const isSelected = selectedProxy === proxy;
          const isLoadingThis = loadingProxy === proxy;
          const activeSessions = getActiveSessionCount(proxy);

          return (
            <button
              key={proxy}
              onClick={() => handleSelect(proxy)}
              className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                isSelected
                  ? 'border-[#0284C7] bg-[#F0F9FF] shadow-xs'
                  : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`font-semibold truncate ${isSelected ? 'text-[#0284C7]' : 'text-[#0F172A]'}`}>
                  {proxy}
                </span>
                {isLoadingThis ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : activeSessions > 0 ? (
                  <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                    <Radio className="w-2.5 h-2.5" />
                    {activeSessions} active
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">Click to view deployments</p>
            </button>
          );
        })}

        {!loadingProxies && !proxiesError && filtered.length === 0 && (
          <div className="text-center py-10 text-xs text-[#94A3B8]">
            {search ? `No proxies matching "${search}"` : 'No API proxies found in organization'}
          </div>
        )}
      </div>
    </div>
  );
}
