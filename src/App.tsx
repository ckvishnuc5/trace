import React, { useState } from 'react';
import { Activity, LogOut, History, Shield, Radio, ExternalLink, ArrowLeftRight, Heart } from 'lucide-react';
import { ApigeeProvider, useApigee } from './context/ApigeeContext';
import { ConnectForm } from './components/ConnectForm';
import { ProxyList } from './components/ProxyList';
import { TraceControl } from './components/TraceControl';
import { ActiveTraces } from './components/ActiveTraces';
import { AuditLogModal } from './components/AuditLogModal';
import { ChangeOrgModal } from './components/ChangeOrgModal';
import { OrgDropdownSwitcher } from './components/OrgDropdownSwitcher';
import { ProxyDeployments } from './types';

function MainApp() {
  const { connection, disconnect, getDeployments, activeTraces, auditLogs } = useApigee();
  const [selectedProxy, setSelectedProxy] = useState<string | null>(null);
  const [selectedDeployments, setSelectedDeployments] = useState<ProxyDeployments | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showChangeOrg, setShowChangeOrg] = useState(false);

  const handleRefreshDeployments = async () => {
    if (!selectedProxy) return;
    try {
      const data = await getDeployments(selectedProxy);
      setSelectedDeployments(data);
    } catch (err: any) {
      alert(`Failed to refresh deployments: ${err.message}`);
    }
  };

  const handleOrgSwitched = () => {
    setSelectedProxy(null);
    setSelectedDeployments(null);
  };

  const handleDisconnect = () => {
    disconnect();
    setSelectedProxy(null);
    setSelectedDeployments(null);
  };

  if (!connection) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] flex flex-col justify-center px-4 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
          <div className="w-12 h-12 bg-[#0284C7] rounded-xl flex items-center justify-center mx-auto shadow-md">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#0F172A]">
            Apigee X Trace Manager
          </h1>
          <p className="mt-1 text-xs text-[#64748B] font-medium tracking-wide uppercase">
            Client-Side Non-Production Trace Control
          </p>
        </div>

        <ConnectForm />

        <div id="connect-footer-note" className="mt-8 text-center text-[11px] text-[#94A3B8] space-y-2">
          <div>Pure Static Architecture • Direct Apigee X Management API • Zero Backend Dependencies</div>
          <div id="note-author-connect" className="text-xs text-[#64748B] font-medium flex items-center justify-center gap-1.5 pt-1">
            <span>designed and build by Vichu</span>
            <span role="img" aria-label="love" className="text-rose-500 text-sm inline-block">❤️</span>
          </div>
        </div>
      </div>
    );
  }

  const activeCount = activeTraces.filter(t => t.status === 'ACTIVE').length;

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9] text-[#1E293B] font-sans overflow-hidden">
      {/* Top Application Header */}
      <header className="bg-white border-b border-[#CBD5E1] px-6 py-3 flex flex-wrap justify-between items-center shadow-xs z-10 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0284C7] rounded-lg flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-[#0F172A]">
                Apigee X Trace Manager
              </h1>
              <span className="bg-[#FEE2E2] text-[#B91C1C] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border border-[#FECACA]">
                Non-Prod Only
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] font-medium">
              Static Client-Side App
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3 text-xs">
          {/* Interactive Organization Dropdown Switcher */}
          <OrgDropdownSwitcher
            onOpenNewOrgModal={() => setShowChangeOrg(true)}
            onSwitched={handleOrgSwitched}
          />

          {/* Activity Log Button */}
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] text-[#334155] transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Activity Log</span>
            {auditLogs.length > 0 && (
              <span className="bg-blue-100 text-[#0284C7] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {auditLogs.length}
              </span>
            )}
          </button>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-xs font-semibold hover:bg-[#FEF2F2] hover:border-[#FCA5A5] text-[#475569] hover:text-[#B91C1C] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
          {/* Left Sidebar: API Proxies */}
          <div className="lg:col-span-4 xl:col-span-3 border-r border-[#CBD5E1] bg-[#F8FAFC] flex flex-col h-full overflow-hidden">
            <ProxyList
              selectedProxy={selectedProxy}
              onSelectingProxy={(name) => setSelectedProxy(name)}
              onSelectDeployments={(data) => setSelectedDeployments(data)}
              onChangeOrg={() => setShowChangeOrg(true)}
            />
          </div>

          {/* Right Panel: Deployment & Trace Control */}
          <div className="lg:col-span-8 xl:col-span-9 bg-[#F8FAFC] flex flex-col h-full p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {selectedDeployments ? (
                <TraceControl
                  deploymentsData={selectedDeployments}
                  onRefreshDeployments={handleRefreshDeployments}
                  onSessionStarted={handleRefreshDeployments}
                />
              ) : (
                <div className="bg-white rounded-xl border border-[#CBD5E1] p-10 text-center shadow-xs">
                  <div className="w-12 h-12 bg-blue-50 text-[#0284C7] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-1">
                    Select an API Proxy
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                    Choose an API proxy from the list on the left to inspect environments, revisions, and start or renew live debug sessions directly on Apigee X.
                  </p>
                </div>
              )}

              {/* Active & Historical Traces */}
              <ActiveTraces />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer id="app-footer-note" className="bg-white border-t border-[#CBD5E1] px-6 py-2.5 shrink-0 flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Apigee X Client-Side Session Control</span>
        </div>
        <div id="note-author-app" className="text-xs font-medium text-[#475569] flex items-center gap-1.5">
          <span>designed and build by Vichu</span>
          <span role="img" aria-label="love" className="text-rose-500 text-sm inline-block">❤️</span>
        </div>
      </footer>

      {/* Change Organization Modal */}
      <ChangeOrgModal
        isOpen={showChangeOrg}
        onClose={() => setShowChangeOrg(false)}
        onSwitched={handleOrgSwitched}
      />

      {/* Audit Log Modal */}
      <AuditLogModal isOpen={showLogs} onClose={() => setShowLogs(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ApigeeProvider>
      <MainApp />
    </ApigeeProvider>
  );
}
