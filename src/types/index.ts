export interface ConnectRequest {
  organization: string;
  project?: string;
  accessToken: string;
}

export interface ConnectResponse {
  connected: boolean;
  organization: string;
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

export interface TraceRequest {
  proxy: string;
  environment: string;
  revision: string;
  timeoutSeconds: number;
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
  status: 'ACTIVE' | 'EXPIRED' | 'FAILED';
  errorMessage?: string;
}
