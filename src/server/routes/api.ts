import { Router } from 'express';
import { credentialService } from '../services/CredentialService.js';
import { ApigeeClient } from '../services/ApigeeClient.js';
import { traceService } from '../services/TraceService.js';

export const apiRouter = Router();

// Middleware to extract and validate session
apiRouter.use((req, res, next) => {
  if (req.path === '/session/connect') return next();
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized. No session found.' });
  
  const session = credentialService.getSession(sessionId);
  if (!session) {
    res.clearCookie('sessionId');
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
  
  (req as any).userSession = session;
  next();
});

apiRouter.post('/session/connect', async (req, res) => {
  const { organization, project, accessToken } = req.body;
  if (!organization || !accessToken) {
    return res.status(400).json({ error: 'Organization and accessToken are required.' });
  }

  try {
    // Validate connection by attempting to list proxies
    const client = new ApigeeClient(organization, accessToken);
    await client.listProxies();
  } catch (err: any) {
    const status = err.status || 401;
    return res.status(status).json({ error: err.message || 'Invalid credentials or organization not found', details: err.raw });
  }

  const sessionId = credentialService.createSession(organization, project, accessToken);
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });

  res.json({ connected: true, organization });
});

apiRouter.post('/session/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    credentialService.removeSession(sessionId);
  }
  res.clearCookie('sessionId');
  res.json({ connected: false });
});

apiRouter.get('/proxies', async (req, res) => {
  try {
    const session = (req as any).userSession;
    const client = new ApigeeClient(session.organization, session.accessToken);
    const proxies = await client.listProxies();
    res.json({ proxies });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message, details: err.raw });
  }
});

apiRouter.get('/proxies/:proxy/deployments', async (req, res) => {
  try {
    const session = (req as any).userSession;
    const { proxy } = req.params;
    const client = new ApigeeClient(session.organization, session.accessToken);
    const deployments = await client.listDeployments(proxy);
    res.json({ proxy, deployments });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message, details: err.raw });
  }
});

apiRouter.post('/traces', async (req, res) => {
  try {
    const session = (req as any).userSession;
    const { proxy, environment, revision, timeoutSeconds } = req.body;
    
    if (!proxy || !environment || !revision || !timeoutSeconds) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const trace = await traceService.enableTrace(session.id, proxy, environment, revision, timeoutSeconds);
    res.json(trace);
  } catch (err: any) {
    const status = err.status || (err.message.includes('production') ? 403 : 500);
    res.status(status).json({ error: err.message, details: err.raw });
  }
});

apiRouter.get('/traces/active', (req, res) => {
  const session = (req as any).userSession;
  const traces = traceService.getActiveTraces(session.organization);
  res.json(traces);
});

apiRouter.post('/traces/:proxy/:environment/renewal', (req, res) => {
  try {
    const session = (req as any).userSession;
    const { proxy, environment } = req.params;
    const { enabled } = req.body;
    const trace = traceService.toggleAutoRenew(session.organization, environment, proxy, enabled);
    res.json(trace);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});
