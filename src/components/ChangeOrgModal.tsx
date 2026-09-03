import React, { useState, useEffect } from 'react';
import { useApigee } from '../context/ApigeeContext';
import { X, ArrowLeftRight, Building2, Key, CheckCircle2, AlertCircle, ChevronDown, Sparkles } from 'lucide-react';

interface ChangeOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitched?: () => void;
}

export function ChangeOrgModal({ isOpen, onClose, onSwitched }: ChangeOrgModalProps) {
  const { connection, changeOrganization, savedOrgs } = useApigee();
  const [newOrg, setNewOrg] = useState('');
  const [newProject, setNewProject] = useState('');
  const [useCustomToken, setUseCustomToken] = useState(false);
  const [customToken, setCustomToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset or initialize state when opened
  useEffect(() => {
    if (isOpen) {
      setNewOrg('');
      setNewProject('');
      setUseCustomToken(false);
      setCustomToken('');
      setError(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !connection) return null;

  const currentOrg = connection.organization;
  const selectableSavedOrgs = savedOrgs.filter(
    (item) => item.organization.toLowerCase() !== currentOrg.toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrg = newOrg.trim();
    if (!targetOrg) {
      setError('Please enter or select a target Apigee organization ID.');
      return;
    }

    if (targetOrg.toLowerCase() === currentOrg.toLowerCase()) {
      setError('You are already connected to this organization.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenToPass = useCustomToken ? customToken.trim() : undefined;
      const projectToPass = newProject.trim() || undefined;

      await changeOrganization(targetOrg, projectToPass, tokenToPass);
      if (onSwitched) onSwitched();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to switch organization. Please check permissions and org name.');
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownSelect = (selectedOrgName: string) => {
    if (!selectedOrgName) {
      setNewOrg('');
      setNewProject('');
      return;
    }
    const found = savedOrgs.find(
      (o) => o.organization.toLowerCase() === selectedOrgName.toLowerCase()
    );
    setNewOrg(found ? found.organization : selectedOrgName);
    setNewProject(found?.project || '');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="bg-white rounded-xl shadow-xl border border-[#CBD5E1] w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-org-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center border border-sky-100">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 id="change-org-title" className="text-sm font-bold text-[#0F172A]">
                Switch or Add Organization
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Select from captured organizations or add a new one to your dropdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Connection Summary Card */}
        <div className="px-6 pt-4 pb-2">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                Active Organization
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono font-bold text-[#0F172A] text-xs">
                  {currentOrg}
                </span>
                {connection.project && connection.project !== currentOrg && (
                  <span className="text-[#64748B] text-[11px]">
                    (Project: {connection.project})
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-3 space-y-4 text-xs">
          {error && (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-3 rounded-lg flex items-start gap-2 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Quick Dropdown: Captured Organizations */}
          {selectableSavedOrgs.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Select from Captured Organizations
              </label>
              <div className="relative">
                <select
                  value={selectableSavedOrgs.some(o => o.organization.toLowerCase() === newOrg.toLowerCase()) ? newOrg : ''}
                  onChange={(e) => handleDropdownSelect(e.target.value)}
                  disabled={loading}
                  className="w-full pl-3 pr-8 py-2 border border-[#CBD5E1] rounded-lg text-xs bg-[#F8FAFC] text-[#0F172A] font-mono focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- Choose a captured organization --</option>
                  {selectableSavedOrgs.map((item) => (
                    <option key={item.organization} value={item.organization}>
                      {item.organization} {item.project && item.project !== item.organization ? `(Project: ${item.project})` : ''}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#64748B]">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}

          {/* Target Organization Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#334155]">
                {selectableSavedOrgs.length > 0 ? 'Or Enter New Organization ID' : 'New Apigee Organization ID'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-[#0284C7] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-saved to dropdown
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#94A3B8]">
                <Building2 className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={newOrg}
                onChange={(e) => setNewOrg(e.target.value)}
                placeholder="e.g. apigee-prod-org, my-company-stage"
                autoFocus={selectableSavedOrgs.length === 0}
                disabled={loading}
                className="w-full pl-9 pr-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none bg-white text-[#0F172A] disabled:bg-[#F1F5F9]"
              />
            </div>
            <p className="mt-1 text-[10px] text-[#64748B]">
              Any organization entered here is permanently captured so you can switch back with a single click.
            </p>
          </div>

          {/* Optional GCP Project ID */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              GCP Project ID <span className="text-[#94A3B8] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="Leave blank to use organization name"
              disabled={loading}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none bg-white text-[#0F172A] disabled:bg-[#F1F5F9]"
            />
          </div>

          {/* Access Token Options */}
          <div className="border-t border-[#E2E8F0] pt-3 space-y-2">
            <span className="block text-xs font-semibold text-[#334155]">
              OAuth 2.0 Access Token
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tokenChoice"
                  checked={!useCustomToken}
                  onChange={() => setUseCustomToken(false)}
                  disabled={loading}
                  className="text-[#0284C7] focus:ring-[#0284C7]"
                />
                <span className="text-xs text-[#334155]">
                  Reuse current OAuth token{' '}
                  <span className="text-[11px] font-mono text-[#64748B]">
                    ({connection.accessToken.substring(0, 8)}...{connection.accessToken.slice(-4)})
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tokenChoice"
                  checked={useCustomToken}
                  onChange={() => setUseCustomToken(true)}
                  disabled={loading}
                  className="text-[#0284C7] focus:ring-[#0284C7]"
                />
                <span className="text-xs text-[#334155]">
                  Provide a new access token (if target org is under another Google account)
                </span>
              </label>
            </div>

            {useCustomToken && (
              <div className="mt-2 space-y-1.5 animate-in fade-in">
                <div className="relative">
                  <span className="absolute top-2.5 left-3 flex items-center pointer-events-none text-[#94A3B8]">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <textarea
                    rows={2}
                    required={useCustomToken}
                    value={customToken}
                    onChange={(e) => setCustomToken(e.target.value)}
                    placeholder="ya29.a0..."
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none bg-white text-[#0F172A] disabled:bg-[#F1F5F9]"
                  />
                </div>
                <p className="text-[10px] text-[#64748B]">
                  Generate token via{' '}
                  <code className="bg-[#E2E8F0] px-1 py-0.5 rounded font-mono text-[#0F172A]">
                    gcloud auth print-access-token
                  </code>
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newOrg.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying & Switching...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Switch & Save to Dropdown</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

