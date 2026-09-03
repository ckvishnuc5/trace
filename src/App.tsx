import React, { useState } from 'react';
import { ConnectForm } from './components/ConnectForm';
import { ProxyList } from './components/ProxyList';
import { TraceControl } from './components/TraceControl';
import { ActiveTraces } from './components/ActiveTraces';
import { ProxyDeployments } from './types';
import { Activity } from 'lucide-react';
import axios from 'axios';

export default function App() {
  const [organization, setOrganization] = useState<string | null>(null);
  const [selectedDeployments, setSelectedDeployments] = useState<ProxyDeployments | null>(null);

  React.useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          setOrganization(null);
          setSelectedDeployments(null);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/session/logout');
    } catch (err) {}
    setOrganization(null);
    setSelectedDeployments(null);
  };

  const handleRefreshDeployments = async () => {
    if (!selectedDeployments) return;
    try {
      const { data } = await axios.get<ProxyDeployments>(`/api/proxies/${selectedDeployments.proxy}/deployments`);
      setSelectedDeployments(data);
    } catch (err) {
      alert('Failed to refresh deployments');
    }
  };

  if (!organization) {
    return (
      <div className="flex flex-col h-screen bg-[#F1F5F9] text-[#1E293B] font-sans overflow-hidden">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-12 h-12 bg-[#0284C7] rounded-lg flex items-center justify-center mx-auto shadow-sm">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#0F172A]">Apigee X Trace Manager</h1>
          <p className="mt-2 text-sm text-[#64748B] font-medium tracking-wide uppercase">Non-Production Trace Control</p>
        </div>
        <div className="mt-8">
          <ConnectForm onConnect={setOrganization} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9] text-[#1E293B] font-sans overflow-hidden">
      <header className="bg-white border-b border-[#CBD5E1] px-6 py-3 flex justify-between items-center shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0284C7] rounded flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[#0F172A]">Apigee X Trace Manager</h1>
          <span className="bg-[#FEE2E2] text-[#B91C1C] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-[#FECACA] ml-2">Non-Production Only</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Connected: <strong className="text-[#0F172A]">{organization}</strong></span>
          </div>
          <button onClick={handleLogout} className="px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-medium hover:bg-gray-50 text-[#0F172A] transition-colors">
            Disconnect
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
          <div className="lg:col-span-4 xl:col-span-3 border-r border-[#CBD5E1] bg-[#F8FAFC] flex flex-col h-full overflow-hidden">
            <ProxyList onSelectDeployments={setSelectedDeployments} />
          </div>
          
          <div className="lg:col-span-8 xl:col-span-9 bg-white flex flex-col h-full p-6 overflow-y-auto">
            {selectedDeployments ? (
              <TraceControl 
                deploymentsData={selectedDeployments} 
                onTraceCreated={() => {}} 
                onRefreshDeployments={handleRefreshDeployments}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#94A3B8]">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">Select a proxy from the list to view deployments and enable tracing.</p>
              </div>
            )}
            
            <ActiveTraces />
          </div>
        </div>
      </main>
    </div>
  );
}
