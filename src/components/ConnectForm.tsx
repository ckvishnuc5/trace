import React, { useState } from 'react';
import { useApigee } from '../context/ApigeeContext';
import { KeyRound, ShieldCheck, Terminal, Copy, Check, Info } from 'lucide-react';

export function ConnectForm() {
  const { connect } = useApigee();
  const [organization, setOrganization] = useState('');
  const [project, setProject] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('gcloud auth print-access-token');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization.trim() || !accessToken.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await connect(
        {
          organization: organization.trim(),
          project: project.trim() || undefined,
          accessToken: accessToken.trim(),
        },
        remember
      );
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Apigee X API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-[#CBD5E1] p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#0284C7]/10 flex items-center justify-center text-[#0284C7]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Connect to Apigee X</h2>
            <p className="text-xs text-[#64748B]">Pure client-side connection via Apigee X Management API</p>
          </div>
        </div>

        {/* Command Helper */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between text-xs text-[#475569] mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#0284C7]" />
              Need an Access Token?
            </span>
            <button
              type="button"
              onClick={handleCopyCmd}
              className="text-[#0284C7] hover:text-[#0369A1] flex items-center gap-1 font-mono text-[11px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <code className="block bg-[#0F172A] text-[#38BDF8] p-2 rounded text-xs font-mono select-all overflow-x-auto">
            gcloud auth print-access-token
          </code>
          <p className="text-[11px] text-[#64748B] mt-2 flex items-center gap-1">
            <Info className="w-3 h-3 text-[#94A3B8] shrink-0" />
            Tokens expire in 60 minutes. Tracing requires Apigee Admin or Environment Admin roles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#334155]">
              Apigee Organization <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full text-sm border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-transparent font-medium"
              placeholder="e.g. my-company-apigee-org"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#334155]">
              Google Cloud Project ID <span className="text-[#94A3B8] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full text-sm border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-transparent font-medium"
              placeholder="e.g. gcp-project-12345"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#334155]">
              OAuth 2.0 Access Token <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full text-xs border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-transparent font-mono"
              placeholder="ya29.a0Ac..."
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
            />
            <label htmlFor="remember" className="text-xs text-[#64748B] cursor-pointer">
              Remember connection in browser storage
            </label>
          </div>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-3.5 rounded-lg text-xs leading-relaxed break-words">
              <strong>Connection Error:</strong> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0F172A] text-white text-xs font-bold tracking-wide rounded-lg hover:bg-[#1E293B] active:bg-[#0284C7] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Connecting & Verifying with Apigee X...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Connect & Load Proxies
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
