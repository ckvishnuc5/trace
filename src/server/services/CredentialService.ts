import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

interface Session {
  id: string;
  organization: string;
  project?: string;
  accessToken: string;
  expiresAt: number;
}

class CredentialService {
  private sessions = new Map<string, Session>();

  createSession(organization: string, project: string | undefined, accessToken: string): string {
    const id = uuidv4();
    const expiresAt = Date.now() + config.sessionTtlMinutes * 60 * 1000;
    this.sessions.set(id, { id, organization, project, accessToken, expiresAt });
    return id;
  }

  getSession(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(id);
      return undefined;
    }
    
    // Auto-extend session on use
    session.expiresAt = Date.now() + config.sessionTtlMinutes * 60 * 1000;
    return session;
  }

  removeSession(id: string): void {
    this.sessions.delete(id);
  }
}

export const credentialService = new CredentialService();
