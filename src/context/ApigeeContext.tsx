import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ActiveTrace, AuditLogEntry, ConnectionConfig, Deployment, ProxyDeployments } from '../types';
import { apigeeClient } from '../services/apigeeClient';
import { storageService } from '../services/storageService';

interface ApigeeContextType {
  connection: ConnectionConfig | null;
  connect: (config: ConnectionConfig, remember: boolean) => Promise<void>;
  disconnect: () => void;
  proxies: string[];
  loadingProxies: boolean;
  proxiesError: string | null;
  refreshProxies: () => Promise<void>;
  getDeployments: (proxy: string) => Promise<ProxyDeployments>;
  activeTraces: ActiveTrace[];
  startTrace: (proxy: string, environment: string, revision: string, timeoutSeconds: number) => Promise<ActiveTrace>;
  stopTrace: (traceId: string) => Promise<void>;
  toggleAutoRenew: (traceId: string) => void;
  removeTraceRecord: (traceId: string) => void;
  auditLogs: AuditLogEntry[];
  clearAuditLogs: () => void;
  isEnvBlocked: (env: string) => boolean;
}

const ApigeeContext = createContext<ApigeeContextType | undefined>(undefined);

export function ApigeeProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<ConnectionConfig | null>(() => storageService.getConnection());
  const [proxies, setProxies] = useState<string[]>([]);
  const [loadingProxies, setLoadingProxies] = useState(false);
  const [proxiesError, setProxiesError] = useState<string | null>(null);
  const [activeTraces, setActiveTraces] = useState<ActiveTrace[]>(() => storageService.getActiveTraces());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => storageService.getAuditLogs());

  const activeTracesRef = useRef(activeTraces);
  activeTracesRef.current = activeTraces;

  const connectionRef = useRef(connection);
  connectionRef.current = connection;

  const isEnvBlocked = useCallback((env: string): boolean => {
    const blocked = storageService.getBlockedEnvs();
    return blocked.some(b => b.toLowerCase() === env.trim().toLowerCase());
  }, []);

  const refreshProxies = useCallback(async () => {
    const currentConn = connectionRef.current;
    if (!currentConn) {
      setProxies([]);
      return;
    }
    setLoadingProxies(true);
    setProxiesError(null);
    try {
      const list = await apigeeClient.listProxies(currentConn.organization, currentConn.accessToken);
      setProxies(list);
    } catch (err: any) {
      setProxiesError(err.message || 'Failed to list API proxies');
    } finally {
      setLoadingProxies(false);
    }
  }, []);

  // Fetch proxies whenever connection is established
  useEffect(() => {
    if (connection) {
      refreshProxies();
    } else {
      setProxies([]);
    }
  }, [connection, refreshProxies]);

  const connect = async (config: ConnectionConfig, remember: boolean) => {
    // Validate credentials against Apigee X API
    const proxyList = await apigeeClient.testConnection(config.organization, config.accessToken);
    storageService.setConnection(config, remember);
    setConnection(config);
    setProxies(proxyList);
    
    const entry = storageService.addAuditLog({
      type: 'CONNECT',
      message: `Connected to Apigee organization: ${config.organization}`,
      details: `Project: ${config.project || 'N/A'}, found ${proxyList.length} proxies.`,
    });
    setAuditLogs(prev => [entry, ...prev]);
  };

  const disconnect = () => {
    storageService.clearConnection();
    setConnection(null);
    setProxies([]);
    setProxiesError(null);
  };

  const getDeployments = async (proxy: string): Promise<ProxyDeployments> => {
    if (!connection) throw new Error('Not connected to Apigee');
    const deployments = await apigeeClient.listDeployments(connection.organization, proxy, connection.accessToken);
    return { proxy, deployments };
  };

  const startTrace = async (
    proxy: string,
    environment: string,
    revision: string,
    timeoutSeconds: number
  ): Promise<ActiveTrace> => {
    if (!connection) throw new Error('Not connected to Apigee');

    if (isEnvBlocked(environment)) {
      throw new Error(`Tracing is strictly disabled for production environment '${environment}'.`);
    }

    const sessionRes = await apigeeClient.createDebugSession(
      connection.organization,
      environment,
      proxy,
      revision,
      timeoutSeconds,
      connection.accessToken
    );

    const now = Date.now();
    const newTrace: ActiveTrace = {
      id: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId: sessionRes.name || `session_${now}`,
      organization: connection.organization,
      proxy,
      environment,
      revision,
      timeoutSeconds,
      createdAt: now,
      expiresAt: now + (timeoutSeconds * 1000),
      autoRenew: true,
      status: 'ACTIVE',
    };

    // Replace or add trace for this proxy + environment
    const filtered = activeTracesRef.current.filter(
      t => !(t.organization === newTrace.organization && t.proxy === newTrace.proxy && t.environment === newTrace.environment)
    );
    const updated = [newTrace, ...filtered];
    setActiveTraces(updated);
    storageService.saveActiveTraces(updated);

    const log = storageService.addAuditLog({
      type: 'TRACE_CREATED',
      message: `Trace started for ${proxy} in ${environment} (rev ${revision})`,
      details: `Session ID: ${newTrace.sessionId}, duration: ${timeoutSeconds}s`,
    });
    setAuditLogs(prev => [log, ...prev]);

    return newTrace;
  };

  const stopTrace = async (traceId: string) => {
    const trace = activeTracesRef.current.find(t => t.id === traceId);
    if (!trace) return;

    if (connection && trace.status === 'ACTIVE') {
      try {
        await apigeeClient.deleteDebugSession(
          trace.organization,
          trace.environment,
          trace.proxy,
          trace.revision,
          trace.sessionId,
          connection.accessToken
        );
      } catch (e) {
        console.warn('Could not delete session on Apigee server (might have expired naturally):', e);
      }
    }

    const updated = activeTracesRef.current.map(t => {
      if (t.id === traceId) {
        return { ...t, status: 'EXPIRED' as const, autoRenew: false };
      }
      return t;
    });
    setActiveTraces(updated);
    storageService.saveActiveTraces(updated);

    const log = storageService.addAuditLog({
      type: 'TRACE_STOPPED',
      message: `Trace manually stopped for ${trace.proxy} in ${trace.environment}`,
      details: `Session: ${trace.sessionId}`,
    });
    setAuditLogs(prev => [log, ...prev]);
  };

  const toggleAutoRenew = (traceId: string) => {
    const updated = activeTracesRef.current.map(t => {
      if (t.id === traceId) {
        const nextState = !t.autoRenew;
        return { ...t, autoRenew: nextState };
      }
      return t;
    });
    setActiveTraces(updated);
    storageService.saveActiveTraces(updated);
  };

  const removeTraceRecord = (traceId: string) => {
    const updated = activeTracesRef.current.filter(t => t.id !== traceId);
    setActiveTraces(updated);
    storageService.saveActiveTraces(updated);
  };

  const clearAuditLogs = () => {
    storageService.clearAuditLogs();
    setAuditLogs([]);
  };

  // Client-Side Renewal & Expiry Loop
  useEffect(() => {
    const checkTraces = async () => {
      const now = Date.now();
      const currentList = [...activeTracesRef.current];
      const conn = connectionRef.current;
      let hasChanges = false;

      for (let i = 0; i < currentList.length; i++) {
        const trace = currentList[i];

        // Case 1: Active trace has reached expiry time
        if (trace.status === 'ACTIVE' && trace.expiresAt <= now) {
          if (!trace.autoRenew) {
            currentList[i] = { ...trace, status: 'EXPIRED' };
            hasChanges = true;
            continue;
          }
        }

        // Case 2: Auto-renewal condition (within 10s of expiry or expired while autoRenew is ON)
        const isExpiringSoon = trace.status === 'ACTIVE' && (trace.expiresAt - now) <= 10000;
        const isExpiredNeedRenew = trace.status === 'EXPIRED' && trace.autoRenew;

        if (trace.autoRenew && (isExpiringSoon || isExpiredNeedRenew) && trace.status !== 'RENEWING') {
          if (!conn) {
            currentList[i] = {
              ...trace,
              status: 'FAILED',
              autoRenew: false,
              errorMessage: 'Cannot renew: Access token or session is missing. Please reconnect.',
            };
            hasChanges = true;
            continue;
          }

          // Mark as renewing
          currentList[i] = { ...trace, status: 'RENEWING', errorMessage: undefined };
          setActiveTraces([...currentList]);
          storageService.saveActiveTraces([...currentList]);

          try {
            // 1. Check current deployment revision
            const deployments = await apigeeClient.listDeployments(conn.organization, trace.proxy, conn.accessToken);
            const activeDeploy = deployments.find(d => d.environment === trace.environment);

            if (!activeDeploy) {
              currentList[i] = {
                ...trace,
                status: 'FAILED',
                autoRenew: false,
                errorMessage: `Proxy ${trace.proxy} is no longer deployed in environment ${trace.environment}.`,
              };
              hasChanges = true;
              continue;
            }

            // 2. Create new debug session
            const newSession = await apigeeClient.createDebugSession(
              conn.organization,
              trace.environment,
              trace.proxy,
              activeDeploy.revision,
              trace.timeoutSeconds,
              conn.accessToken
            );

            const renewalTime = Date.now();
            currentList[i] = {
              ...trace,
              sessionId: newSession.name || `renewed_${renewalTime}`,
              revision: activeDeploy.revision,
              createdAt: renewalTime,
              expiresAt: renewalTime + (trace.timeoutSeconds * 1000),
              status: 'ACTIVE',
              errorMessage: undefined,
            };
            hasChanges = true;

            const log = storageService.addAuditLog({
              type: 'TRACE_RENEWED',
              message: `Auto-renewed trace for ${trace.proxy} in ${trace.environment} (rev ${activeDeploy.revision})`,
              details: `New Session ID: ${currentList[i].sessionId}`,
            });
            setAuditLogs(prev => [log, ...prev]);
          } catch (err: any) {
            currentList[i] = {
              ...trace,
              status: 'FAILED',
              autoRenew: false,
              errorMessage: err.message || 'Auto-renewal failed against Apigee API.',
            };
            hasChanges = true;

            const log = storageService.addAuditLog({
              type: 'ERROR',
              message: `Auto-renewal failed for ${trace.proxy} in ${trace.environment}`,
              details: err.message,
            });
            setAuditLogs(prev => [log, ...prev]);
          }
        }
      }

      if (hasChanges) {
        setActiveTraces([...currentList]);
        storageService.saveActiveTraces([...currentList]);
      }
    };

    const interval = setInterval(checkTraces, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ApigeeContext.Provider
      value={{
        connection,
        connect,
        disconnect,
        proxies,
        loadingProxies,
        proxiesError,
        refreshProxies,
        getDeployments,
        activeTraces,
        startTrace,
        stopTrace,
        toggleAutoRenew,
        removeTraceRecord,
        auditLogs,
        clearAuditLogs,
        isEnvBlocked,
      }}
    >
      {children}
    </ApigeeContext.Provider>
  );
}

export function useApigee() {
  const context = useContext(ApigeeContext);
  if (!context) {
    throw new Error('useApigee must be used within an ApigeeProvider');
  }
  return context;
}
