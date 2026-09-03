import React from 'react';
import { useApigee } from '../context/ApigeeContext';
import { X, Trash2, History, CheckCircle, RefreshCw, AlertTriangle, Play, LogOut } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const { auditLogs, clearAuditLogs } = useApigee();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'TRACE_CREATED':
        return <Play className="w-3.5 h-3.5 text-emerald-600" />;
      case 'TRACE_RENEWED':
        return <RefreshCw className="w-3.5 h-3.5 text-[#0284C7]" />;
      case 'TRACE_STOPPED':
        return <LogOut className="w-3.5 h-3.5 text-[#64748B]" />;
      case 'ERROR':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-[#CBD5E1] w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#0284C7]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Apigee X Trace Activity Log</h3>
            <span className="text-[11px] bg-[#F1F5F9] text-[#475569] font-medium px-2 py-0.5 rounded-full">
              {auditLogs.length} events
            </span>
          </div>
          <div className="flex items-center gap-2">
            {auditLogs.length > 0 && (
              <button
                onClick={clearAuditLogs}
                className="text-xs text-[#64748B] hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {auditLogs.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8] text-xs">No activity logged yet in this session.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                    {getIcon(log.type)}
                    <span>{log.message}</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {log.details && (
                  <p className="text-[11px] text-[#64748B] font-mono pl-5 break-all">{log.details}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg hover:bg-[#1E293B]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
