import { ActiveTrace, AuditLogEntry, ConnectionConfig } from '../types';

const STORAGE_KEYS = {
  CONNECTION: 'apigee_x_connection',
  ACTIVE_TRACES: 'apigee_x_active_traces',
  AUDIT_LOGS: 'apigee_x_audit_logs',
  BLOCKED_ENVS: 'apigee_x_blocked_envs',
};

const DEFAULT_BLOCKED_ENVS = ['prod', 'production', 'live', 'main'];

export const storageService = {
  getConnection(): ConnectionConfig | null {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.CONNECTION) || localStorage.getItem(STORAGE_KEYS.CONNECTION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setConnection(config: ConnectionConfig, remember: boolean = true): void {
    const serialized = JSON.stringify(config);
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.CONNECTION, serialized);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.CONNECTION, serialized);
    }
  },

  clearConnection(): void {
    sessionStorage.removeItem(STORAGE_KEYS.CONNECTION);
    localStorage.removeItem(STORAGE_KEYS.CONNECTION);
  },

  getActiveTraces(): ActiveTrace[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRACES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveActiveTraces(traces: ActiveTrace[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TRACES, JSON.stringify(traces));
    } catch (e) {
      console.error('Failed to save active traces to localStorage', e);
    }
  },

  getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    // Keep last 100 entries
    const updated = [newEntry, ...logs].slice(0, 100);
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save audit logs', e);
    }
    return newEntry;
  },

  clearAuditLogs(): void {
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  },

  getBlockedEnvs(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_ENVS);
      return data ? JSON.parse(data) : DEFAULT_BLOCKED_ENVS;
    } catch {
      return DEFAULT_BLOCKED_ENVS;
    }
  },

  setBlockedEnvs(envs: string[]): void {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_ENVS, JSON.stringify(envs));
  },
};
