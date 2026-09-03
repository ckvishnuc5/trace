import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { ProxyDeployments } from '../types';

interface ProxyListProps {
  onSelectDeployments: (deployments: ProxyDeployments) => void;
}

export function ProxyList({ onSelectDeployments }: ProxyListProps) {
  const [proxies, setProxies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedProxy, setSelectedProxy] = useState<string | null>(null);

  useEffect(() => {
    loadProxies();
  }, []);

  const loadProxies = async () => {
    try {
      const { data } = await axios.get('/api/proxies');
      setProxies(data.proxies || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load proxies');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (proxy: string) => {
    setSelectedProxy(proxy);
    try {
      const { data } = await axios.get<ProxyDeployments>(`/api/proxies/${proxy}/deployments`);
      onSelectDeployments(data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to load deployments');
    }
  };

  const filteredProxies = proxies.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className="p-4 border-b border-[#CBD5E1] bg-white shrink-0">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#94A3B8]" />
          </span>
          <input
            type="text"
            placeholder="Search API Proxies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={loading || !!error}
            className="w-full pl-10 pr-4 py-2 border border-[#CBD5E1] rounded-md text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none bg-white text-[#1E293B] disabled:opacity-50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && <div className="text-center text-sm text-[#64748B] mt-4">Loading proxies...</div>}
        
        {error && !loading && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-3 rounded text-xs font-medium whitespace-pre-wrap break-words">
            {error}
            {error.includes('404') && (
              <div className="mt-2 text-[#7F1D1D] font-bold">
                Hint: Make sure the Organization ID is correct. Try disconnecting and reconnecting.
              </div>
            )}
          </div>
        )}

        {!loading && !error && filteredProxies.map(proxy => {
          const isSelected = selectedProxy === proxy;
          return (
            <button
              key={proxy}
              onClick={() => handleSelect(proxy)}
              className={`w-full text-left p-3 bg-white border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'border-[#0284C7] shadow-sm border-l-4'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'} text-[#0F172A] truncate pr-2`}>
                  {proxy}
                </h3>
              </div>
              <p className="text-xs text-[#64748B]">Click to view deployments</p>
            </button>
          );
        })}
        {!loading && !error && filteredProxies.length === 0 && (
          <div className="p-4 text-center text-sm text-[#64748B]">No proxies found.</div>
        )}
      </div>
    </div>
  );
}
