export interface ConnectionConfig {
  organization: string;
  project?: string;
  accessToken: string;
}

export interface SavedOrgEntry {
  organization: string;
  project?: string;
  lastUsed: number;
}

export interface Deployment {
  environment: string;
  revision: string;
  state: string;
}

export interface ProxyDeployments {
  proxy: string;
  deployments: Deployment[];
}

export interface ActiveTrace {
  id: string;
  sessionId: string;
  organization: string;
  proxy: string;
  environment: string;
  revision: string;
  timeoutSeconds: number;
  createdAt: number;
  expiresAt: number;
  autoRenew: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'FAILED' | 'RENEWING';
  errorMessage?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'CONNECT' | 'TRACE_CREATED' | 'TRACE_RENEWED' | 'TRACE_STOPPED' | 'TRACE_EXPIRED' | 'ERROR';
  message: string;
  proxy?: string;
  environment?: string;
  revision?: string;
  details?: string;
}
