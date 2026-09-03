import { config } from '../config.js';
import { ApigeeClient } from './ApigeeClient.js';
import { credentialService } from './CredentialService.js';
import { v4 as uuidv4 } from 'uuid';

export interface ActiveTrace {
  id: string; // Internal ID to track
  sessionId: string; // Apigee Debug Session ID (name)
  organization: string;
  proxy: string;
  environment: string;
  revision: string;
  timeoutSeconds: number;
  createdAt: number;
  expiresAt: number;
  autoRenew: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'FAILED';
  userSessionId: string;
  errorMessage?: string;
}

class TraceService {
  private activeTraces = new Map<string, ActiveTrace>();
  private workerInterval: NodeJS.Timeout | null = null;

  public startWorker() {
    if (this.workerInterval) return;
    this.workerInterval = setInterval(() => this.renewalWorker(), 10000);
  }

  public getTraceKey(organization: string, environment: string, proxy: string) {
    return `${organization}::${environment}::${proxy}`;
  }

  public validateNonProduction(environment: string) {
    if (config.blockedEnvironments.includes(environment.toLowerCase())) {
      throw new Error('Trace is disabled for production environments.');
    }
  }

  public async enableTrace(userSessionId: string, proxy: string, environment: string, revision: string, timeoutSeconds: number) {
    this.validateNonProduction(environment);
    
    if (timeoutSeconds > config.maxTraceTimeoutSeconds) {
      throw new Error(`Timeout exceeds maximum allowed of ${config.maxTraceTimeoutSeconds} seconds.`);
    }

    const session = credentialService.getSession(userSessionId);
    if (!session) throw new Error('Invalid or expired session');

    const client = new ApigeeClient(session.organization, session.accessToken);
    
    // Check conflicts
    const key = this.getTraceKey(session.organization, environment, proxy);
    const existing = this.activeTraces.get(key);
    if (existing && existing.status === 'ACTIVE' && existing.expiresAt > Date.now()) {
      if (config.traceConflictPolicy === 'block') {
        throw new Error('An active trace session already exists for this proxy/environment.');
      }
    }

    // Call Apigee to create debug session
    const debugSession = await client.createDebugSession(environment, proxy, revision, timeoutSeconds);
    const apigeeSessionId = debugSession.name || debugSession.id || uuidv4(); // Fallback if API changes

    const now = Date.now();
    const trace: ActiveTrace = {
      id: uuidv4(),
      sessionId: apigeeSessionId,
      organization: session.organization,
      proxy,
      environment,
      revision,
      timeoutSeconds,
      createdAt: now,
      expiresAt: now + (timeoutSeconds * 1000),
      autoRenew: false,
      status: 'ACTIVE',
      userSessionId
    };

    this.activeTraces.set(key, trace);
    return trace;
  }

  public getActiveTraces(organization: string) {
    return Array.from(this.activeTraces.values()).filter(t => t.organization === organization);
  }

  public toggleAutoRenew(organization: string, environment: string, proxy: string, enabled: boolean) {
    const key = this.getTraceKey(organization, environment, proxy);
    const trace = this.activeTraces.get(key);
    if (!trace) throw new Error('Trace not found');
    trace.autoRenew = enabled;
    return trace;
  }

  private async renewalWorker() {
    const now = Date.now();
    for (const [key, trace] of this.activeTraces.entries()) {
      if (trace.status === 'ACTIVE' && trace.expiresAt < now) {
        trace.status = 'EXPIRED';
      }

      if (trace.status === 'EXPIRED' && trace.autoRenew) {
        // Attempt renewal
        const session = credentialService.getSession(trace.userSessionId);
        if (!session) {
          trace.autoRenew = false;
          trace.status = 'FAILED';
          trace.errorMessage = 'Access token is no longer valid or session expired.';
          continue;
        }

        try {
          this.validateNonProduction(trace.environment);
          const client = new ApigeeClient(trace.organization, session.accessToken);
          
          // Re-fetch deployment to get current revision
          const deployments = await client.listDeployments(trace.proxy);
          const currentDeploy = deployments.find(d => d.environment === trace.environment);
          if (!currentDeploy) {
            trace.autoRenew = false;
            trace.status = 'FAILED';
            trace.errorMessage = 'Proxy is no longer deployed in this environment.';
            continue;
          }

          // Create new debug session with new revision
          const debugSession = await client.createDebugSession(trace.environment, trace.proxy, currentDeploy.revision, trace.timeoutSeconds);
          const apigeeSessionId = debugSession.name || debugSession.id || uuidv4();

          trace.sessionId = apigeeSessionId;
          trace.revision = currentDeploy.revision;
          trace.createdAt = Date.now();
          trace.expiresAt = trace.createdAt + (trace.timeoutSeconds * 1000);
          trace.status = 'ACTIVE';
          trace.errorMessage = undefined;

          // Note: an audit log should ideally be written here
          console.log(`[Audit] ${new Date().toISOString()} TRACE_RENEWED ${trace.organization}/${trace.environment}/${trace.proxy} rev ${trace.revision}`);
        } catch (err: any) {
          trace.autoRenew = false;
          trace.status = 'FAILED';
          trace.errorMessage = err.message || 'Apigee error during renewal';
        }
      }
    }
  }
}

export const traceService = new TraceService();
