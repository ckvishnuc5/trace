import axios, { AxiosError } from 'axios';
import { config } from '../config';

export class ApigeeClient {
  private accessToken: string;
  private organization: string;
  private baseUrl = config.apigeeBaseUrl;

  constructor(organization: string, accessToken: string) {
    this.organization = organization;
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async listProxies(): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/organizations/${this.organization}/apis`;
      const response = await axios.get(url, { headers: this.headers });
      
      // The API typically returns an array of objects like [{name: 'proxy1'}, ...] 
      // or `{ proxies: [{name: 'proxy1'}] }` depending on the version. 
      // We will normalize it to an array of strings.
      if (Array.isArray(response.data)) {
        return response.data.map(p => typeof p === 'string' ? p : p.name);
      } else if (response.data && Array.isArray(response.data.proxies)) {
        return response.data.proxies.map((p: any) => p.name);
      }
      return [];
    } catch (error) {
      this.handleError(error);
      return []; // Unreachable but required by TS
    }
  }

  async listDeployments(proxy: string): Promise<Array<{ environment: string; revision: string; state: string }>> {
    try {
      const url = `${this.baseUrl}/organizations/${this.organization}/apis/${proxy}/deployments`;
      const response = await axios.get(url, { headers: this.headers });
      
      const deployments = response.data.deployments || [];
      return deployments.map((d: any) => ({
        environment: d.environment,
        revision: d.revision,
        state: d.state || 'deployed'
      }));
    } catch (error) {
      this.handleError(error);
      return []; // Unreachable
    }
  }

  async createDebugSession(environment: string, proxy: string, revision: string, timeoutSeconds: number) {
    try {
      const url = `${this.baseUrl}/organizations/${this.organization}/environments/${environment}/apis/${proxy}/revisions/${revision}/debugsessions`;
      const response = await axios.post(
        url,
        { timeout: timeoutSeconds.toString() },
        { headers: this.headers }
      );
      return response.data; // e.g. { name: 'session-id', timeout: '...', ... }
    } catch (error) {
      this.handleError(error);
    }
  }

  async listDebugSessions(environment: string, proxy: string, revision: string) {
    try {
      const url = `${this.baseUrl}/organizations/${this.organization}/environments/${environment}/apis/${proxy}/revisions/${revision}/debugsessions`;
      const response = await axios.get(url, { headers: this.headers });
      return response.data.sessions || [];
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      throw { status, message, isApigeeError: true, raw: error.response?.data };
    }
    throw error;
  }
}
