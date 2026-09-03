import React, { useState } from 'react';
import axios from 'axios';
import { ConnectResponse } from '../types';

interface ConnectFormProps {
  onConnect: (org: string) => void;
}

export function ConnectForm({ onConnect }: ConnectFormProps) {
  const [organization, setOrganization] = useState('');
  const [project, setProject] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post<ConnectResponse>('/api/session/connect', {
        organization,
        project,
        accessToken,
      });
      if (data.connected) {
        onConnect(data.organization);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm border border-[#CBD5E1] w-full max-w-md mx-auto mt-10">
      <h2 className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-4">Connection Configuration</h2>
      <p className="text-sm text-[#475569] mb-6">
        Provide a Google Cloud OAuth 2.0 access token with the required Apigee permissions.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[#475569]">Organization</label>
          <input
            type="text"
            required
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full text-sm border border-[#CBD5E1] rounded px-3 py-2 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-transparent"
            placeholder="my-apigee-org"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[#475569]">Google Cloud Project (Optional)</label>
          <input
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full text-sm border border-[#CBD5E1] rounded px-3 py-2 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-transparent"
            placeholder="my-project-id"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[#475569]">Access Token</label>
          <input
            type="password"
            required
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="w-full text-sm border border-[#CBD5E1] rounded px-3 py-2 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-transparent font-mono"
            placeholder="ya29.c..."
          />
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-3 rounded text-xs font-medium whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[#0F172A] text-white text-xs font-semibold rounded hover:bg-[#1E293B] transition-colors disabled:opacity-50"
        >
          {loading ? 'Validating...' : 'Validate Connection'}
        </button>
      </form>
    </div>
  );
}
