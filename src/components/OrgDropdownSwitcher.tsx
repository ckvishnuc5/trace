import React, { useState, useRef, useEffect } from 'react';
import { useApigee } from '../context/ApigeeContext';
import { Building2, ChevronDown, Check, Plus, Trash2, Loader2, ArrowLeftRight, Sparkles } from 'lucide-react';

interface OrgDropdownSwitcherProps {
  onOpenNewOrgModal: () => void;
  onSwitched?: () => void;
}

export function OrgDropdownSwitcher({ onOpenNewOrgModal, onSwitched }: OrgDropdownSwitcherProps) {
  const { connection, savedOrgs, changeOrganization, removeSavedOrg, switchingOrg } = useApigee();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingToOrg, setSwitchingToOrg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!connection) return null;

  const currentOrg = connection.organization;

  const handleSelectOrg = async (orgName: string, project?: string) => {
    if (orgName.toLowerCase() === currentOrg.toLowerCase()) {
      setIsOpen(false);
      return;
    }

    setSwitchingToOrg(orgName);
    setErrorMsg(null);
    try {
      await changeOrganization(orgName, project);
      if (onSwitched) onSwitched();
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to switch to ${orgName}`);
    } finally {
      setSwitchingToOrg(null);
    }
  };

  const handleRemove = (e: React.MouseEvent, orgName: string) => {
    e.stopPropagation();
    removeSavedOrg(orgName);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button / Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switchingOrg}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all select-none text-xs font-medium ${
          isOpen
            ? 'bg-sky-50 border-[#0284C7] ring-2 ring-[#0284C7]/20 text-[#0F172A]'
            : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8] hover:bg-white text-[#334155]'
        } ${switchingOrg ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {switchingOrg ? (
          <Loader2 className="w-3.5 h-3.5 text-[#0284C7] animate-spin" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        )}

        <span className="text-[#64748B]">
          Org:{' '}
          <strong className="text-[#0F172A] font-mono font-bold">
            {currentOrg}
          </strong>
          {connection.project && connection.project !== currentOrg && (
            <span className="text-[#94A3B8] font-normal ml-1">
              ({connection.project})
            </span>
          )}
        </span>

        <span className="inline-flex items-center justify-center p-0.5 rounded text-[#64748B] hover:text-[#0F172A]">
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#0284C7]' : ''
            }`}
          />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-76 sm:w-80 bg-white rounded-xl shadow-xl border border-[#CBD5E1] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-3.5 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Switch Organization</span>
            </div>
            <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#E2E8F0]">
              {savedOrgs.length} saved
            </span>
          </div>

          {errorMsg && (
            <div className="mx-3 my-2 p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[11px] leading-tight">
              {errorMsg}
            </div>
          )}

          {/* Captured Organizations List */}
          <div className="max-h-60 overflow-y-auto py-1">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Captured Organizations
            </div>

            {savedOrgs.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-[#94A3B8]">
                No other organizations saved yet
              </div>
            ) : (
              savedOrgs.map((item) => {
                const isActive = item.organization.toLowerCase() === currentOrg.toLowerCase();
                const isCurrentlySwitching = switchingToOrg === item.organization;

                return (
                  <div
                    key={item.organization}
                    onClick={() => !isCurrentlySwitching && handleSelectOrg(item.organization, item.project)}
                    className={`group px-3 py-2 mx-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-[#0284C7] font-semibold'
                        : 'hover:bg-[#F8FAFC] text-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#0284C7] text-white'
                            : 'bg-[#F1F5F9] text-[#64748B] group-hover:text-[#0F172A]'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-xs truncate font-medium text-[#0F172A]">
                          {item.organization}
                        </div>
                        {item.project && item.project !== item.organization && (
                          <div className="text-[10px] text-[#64748B] truncate">
                            Project: {item.project}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isCurrentlySwitching ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#0284C7] animate-spin" />
                      ) : isActive ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleRemove(e, item.organization)}
                          title="Remove from saved list"
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Add new organization */}
          <div className="pt-1.5 mt-1 border-t border-[#E2E8F0] px-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenNewOrgModal();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] hover:bg-sky-50 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enter New Organization...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
