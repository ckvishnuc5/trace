import axios from 'axios';
import { Deployment } from '../types';

const APIGEE_BASE_URL = 'https://apigee.googleapis.com/v1';

export class ApigeeApiError extends Error {
  status?: number;
  raw?: any;

  constructor(message: string, status?: number, raw?: any) {
    super(message);
    this.name = 'ApigeeApiError';
    this.status = status;
    this.raw = raw;
  }
}

function getHeaders(token: string) {
  const cleanToken = token.trim();
  return {
    Authorization: `Bearer ${cleanToken}`,
    'Content-Type': 'application/json',
  };
}

function parseErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const serverMessage = data?.error?.message || error.message;

    if (status === 401) {
      return `Authentication Failed (401). Your Google Cloud OAuth Access Token is invalid or expired. Run 'gcloud auth print-access-token' to obtain a fresh token.`;
    }
    if (status === 403) {
      return `Permission Denied (403). Your GCP account does not have sufficient Apigee IAM permissions on this organization. Details: ${serverMessage}`;
    }
    if (status === 404) {
      return `Apigee Resource Not Found (404). Please verify that your Apigee Organization ID is accurate and provisioned. Details: ${serverMessage}`;
    }
    return `Apigee API Error (${status || 'Network'}): ${serverMessage}`;
  }
  return error instanceof Error ? error.message : 'Unknown Apigee API error';
}

export const apigeeClient = {
  async testConnection(organization: string, token: string): Promise<string[]> {
    try {
      const url = `${APIGEE_BASE_URL}/organizations/${encodeURIComponent(organization)}/apis`;
      const response = await axios.get(url, { headers: getHeaders(token) });
      return this.normalizeProxies(response.data);
    } catch (err) {
      throw new ApigeeApiError(parseErrorMessage(err), axios.isAxiosError(err) ? err.response?.status : undefined, err);
    }
  },

  async listProxies(organization: string, token: string): Promise<string[]> {
    try {
      const url = `${APIGEE_BASE_URL}/organizations/${encodeURIComponent(organization)}/apis`;
      const response = await axios.get(url, { headers: getHeaders(token) });
      return this.normalizeProxies(response.data);
    } catch (err) {
      throw new ApigeeApiError(parseErrorMessage(err), axios.isAxiosError(err) ? err.response?.status : undefined, err);
    }
  },

  async listEnvironments(organization: string, token: string): Promise<string[]> {
    try {
      const url = `${APIGEE_BASE_URL}/organizations/${encodeURIComponent(organization)}/environments`;
      const response = await axios.get(url, { headers: getHeaders(token) });
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (err) {
      throw new ApigeeApiError(parseErrorMessage(err), axios.isAxiosError(err) ? err.response?.status : undefined, err);
    }
  },

  async listDeployments(organization: string, proxy: string, token: string): Promise<Deployment[]> {
    try {
      const url = `${APIGEE_BASE_URL}/organizations/${encodeURIComponent(organization)}/apis/${encodeURIComponent(proxy)}/deployments`;
      const response = await axios.get(url, { headers: getHeaders(token) });
      const data = response.data;

      const results: Deployment[] = [];

      // Format 1: { deployments: [ { environment, revision, state } ] }
      if (data && Array.isArray(data.deployments)) {
        for (const d of data.deployments) {
          results.push({
            environment: d.environment || '',
            revision: d.revision || '1',
            state: d.state || 'deployed',
          });
        }
      } 
      // Format 2: { environment: [ { name: "env-name", revision: [ { name: "1", state: "deployed" } ] } ] }
      else if (data && Array.isArray(data.environment)) {
        for (const envObj of data.environment) {
          const envName = envObj.name || '';
          if (Array.isArray(envObj.revision)) {
            for (const revObj of envObj.revision) {
              results.push({
                environment: envName,
                revision: revObj.name || '1',
                state: revObj.state || 'deployed',
              });
            }
          } else {
            results.push({
              environment: envName,
              revision: '1',
              state: 'deployed',
            });
          }
        }
      }

      return results;
    } catch (err) {
      throw new ApigeeApiError(parseErrorMessage(err), axios.isAxiosError(err) ? err.response?.status : undefined, err);
    }
  },

  async createDebugSession(
    organization: string,
    environment: string,
    proxy: string,
    revision: string,
    timeoutSeconds: number,
    token: string
  ): Promise<{ name: string; timeout: string }> {
    try {
      const url = `${APIGEE_BASE_URL}/organizations/${encodeURIComponent(organization)}/environments/${encodeURIComponent(environment)}/apis/${encodeURIComponent(proxy)}/revisions/${encodeURIComponent(revision)}/debugsessions`;
      
      const response = await axios.post(
        url,
        { timeout: timeoutSeconds.toString() },
        { headers: getHeaders(token) }
      );
      return response.data;
    } catch (err) {
      throw new ApigeeApiError(parseErrorMessage(err), axios.isAxiosError(err) ? err.response?.status : undefined, err);
    }
  },

  async deleteDebugSession(
    organization: string,
    environment: string,
    proxy: string,
    revision: string,
    sessionId: string,
    token: string
  ): Promise<void> {
    try {
      const url = `${APIGEE_BASE_URL}/organizations/${encodeURIComponent(organization)}/environments/${encodeURIComponent(environment)}/apis/${encodeURIComponent(proxy)}/revisions/${encodeURIComponent(revision)}/debugsessions/${encodeURIComponent(sessionId)}`;
      await axios.delete(url, { headers: getHeaders(token) });
    } catch (err) {
      throw new ApigeeApiError(parseErrorMessage(err), axios.isAxiosError(err) ? err.response?.status : undefined, err);
    }
  },

  normalizeProxies(data: any): string[] {
    if (Array.isArray(data)) {
      return data.map((p) => (typeof p === 'string' ? p : p.name)).filter(Boolean);
    }
    if (data && Array.isArray(data.proxies)) {
      return data.proxies.map((p: any) => (typeof p === 'string' ? p : p.name)).filter(Boolean);
    }
    return [];
  },
};
