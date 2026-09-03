var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express2 = __toESM(require("express"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);

// src/server/routes/api.ts
var import_express = require("express");

// src/server/services/CredentialService.ts
var import_uuid = require("uuid");

// src/server/config.ts
var getBaseUrl = () => {
  const url = process.env.APIGEE_BASE_URL;
  if (url && url.startsWith("http")) return url;
  return "https://apigee.googleapis.com/v1";
};
var getConflictPolicy = () => {
  const p = process.env.TRACE_CONFLICT_POLICY;
  if (p === "block" || p === "allow" || p === "warn") return p;
  return "warn";
};
var config = {
  apigeeBaseUrl: getBaseUrl(),
  blockedEnvironments: (process.env.BLOCKED_ENVIRONMENTS || "prod,production,prd,production-us,production-eu").split(",").map((e) => e.trim().toLowerCase()),
  maxTraceTimeoutSeconds: isNaN(parseInt(process.env.MAX_TRACE_TIMEOUT_SECONDS || "", 10)) ? 600 : parseInt(process.env.MAX_TRACE_TIMEOUT_SECONDS || "600", 10),
  defaultTraceTimeoutSeconds: isNaN(parseInt(process.env.DEFAULT_TRACE_TIMEOUT_SECONDS || "", 10)) ? 300 : parseInt(process.env.DEFAULT_TRACE_TIMEOUT_SECONDS || "300", 10),
  traceConflictPolicy: getConflictPolicy(),
  sessionTtlMinutes: isNaN(parseInt(process.env.SESSION_TTL_MINUTES || "", 10)) ? 30 : parseInt(process.env.SESSION_TTL_MINUTES || "30", 10)
};

// src/server/services/CredentialService.ts
var CredentialService = class {
  constructor() {
    this.sessions = /* @__PURE__ */ new Map();
  }
  createSession(organization, project, accessToken) {
    const id = (0, import_uuid.v4)();
    const expiresAt = Date.now() + config.sessionTtlMinutes * 60 * 1e3;
    this.sessions.set(id, { id, organization, project, accessToken, expiresAt });
    return id;
  }
  getSession(id) {
    const session = this.sessions.get(id);
    if (!session) return void 0;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(id);
      return void 0;
    }
    session.expiresAt = Date.now() + config.sessionTtlMinutes * 60 * 1e3;
    return session;
  }
  removeSession(id) {
    this.sessions.delete(id);
  }
};
var credentialService = new CredentialService();

// src/server/services/ApigeeClient.ts
var import_axios = __toESM(require("axios"), 1);
var ApigeeClient = class {
  constructor(organization, accessToken) {
    this.baseUrl = config.apigeeBaseUrl;
    this.organization = organization;
    this.accessToken = accessToken;
  }
  get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json"
    };
  }
  async listProxies() {
    try {
      const url = `${this.baseUrl}/organizations/${this.organization}/apis`;
      const response = await import_axios.default.get(url, { headers: this.headers });
      if (Array.isArray(response.data)) {
        return response.data.map((p) => typeof p === "string" ? p : p.name);
      } else if (response.data && Array.isArray(response.data.proxies)) {
        return response.data.proxies.map((p) => p.name);
      }
      return [];
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }
  async listDeployments(proxy) {
    try {
      const url = `${this.baseUrl}/organizations/${this.organization}/apis/${proxy}/deployments`;
      const response = await import_axios.default.get(url, { headers: this.headers });
      const deployments = response.data.deployments || [];
      return deployments.map((d) => ({
        environment: d.environment,
        revision: d.revision,
        state: d.state || "deployed"
      }));
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }
  async createDebugSession(environment, proxy, revision, timeoutSeconds) {
    try {
      const url = `${this.baseUrl}/organizations/${this.organization}/environments/${environment}/apis/${proxy}/revisions/${revision}/debugsessions`;
      const response = await import_axios.default.post(
        url,
        { timeout: timeoutSeconds.toString() },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  async listDebugSessions(environment, proxy, revision) {
    try {
      const url = `${this.baseUrl}/organizations/${this.organization}/environments/${environment}/apis/${proxy}/revisions/${revision}/debugsessions`;
      const response = await import_axios.default.get(url, { headers: this.headers });
      return response.data.sessions || [];
    } catch (error) {
      this.handleError(error);
    }
  }
  handleError(error) {
    if (import_axios.default.isAxiosError(error)) {
      const status = error.response?.status || 500;
      let message = error.response?.data?.error?.message || error.message;
      if (status === 404) {
        message = `Apigee Resource Not Found (404). Please verify your Organization, Environment, and Proxy names. Details: ${message}`;
      } else if (status === 401 || status === 403) {
        message = `Authentication Failed (${status}). Please check your GCP Access Token and permissions. Details: ${message}`;
      }
      throw { status, message, isApigeeError: true, raw: error.response?.data };
    }
    throw error;
  }
};

// src/server/services/TraceService.ts
var import_uuid2 = require("uuid");
var TraceService = class {
  constructor() {
    this.activeTraces = /* @__PURE__ */ new Map();
    this.workerInterval = null;
  }
  startWorker() {
    if (this.workerInterval) return;
    this.workerInterval = setInterval(() => this.renewalWorker(), 1e4);
  }
  getTraceKey(organization, environment, proxy) {
    return `${organization}::${environment}::${proxy}`;
  }
  validateNonProduction(environment) {
    if (config.blockedEnvironments.includes(environment.toLowerCase())) {
      throw new Error("Trace is disabled for production environments.");
    }
  }
  async enableTrace(userSessionId, proxy, environment, revision, timeoutSeconds) {
    this.validateNonProduction(environment);
    if (timeoutSeconds > config.maxTraceTimeoutSeconds) {
      throw new Error(`Timeout exceeds maximum allowed of ${config.maxTraceTimeoutSeconds} seconds.`);
    }
    const session = credentialService.getSession(userSessionId);
    if (!session) throw new Error("Invalid or expired session");
    const client = new ApigeeClient(session.organization, session.accessToken);
    const key = this.getTraceKey(session.organization, environment, proxy);
    const existing = this.activeTraces.get(key);
    if (existing && existing.status === "ACTIVE" && existing.expiresAt > Date.now()) {
      if (config.traceConflictPolicy === "block") {
        throw new Error("An active trace session already exists for this proxy/environment.");
      }
    }
    const debugSession = await client.createDebugSession(environment, proxy, revision, timeoutSeconds);
    const apigeeSessionId = debugSession.name || debugSession.id || (0, import_uuid2.v4)();
    const now = Date.now();
    const trace = {
      id: (0, import_uuid2.v4)(),
      sessionId: apigeeSessionId,
      organization: session.organization,
      proxy,
      environment,
      revision,
      timeoutSeconds,
      createdAt: now,
      expiresAt: now + timeoutSeconds * 1e3,
      autoRenew: false,
      status: "ACTIVE",
      userSessionId
    };
    this.activeTraces.set(key, trace);
    return trace;
  }
  getActiveTraces(organization) {
    return Array.from(this.activeTraces.values()).filter((t) => t.organization === organization);
  }
  toggleAutoRenew(organization, environment, proxy, enabled) {
    const key = this.getTraceKey(organization, environment, proxy);
    const trace = this.activeTraces.get(key);
    if (!trace) throw new Error("Trace not found");
    trace.autoRenew = enabled;
    return trace;
  }
  async renewalWorker() {
    const now = Date.now();
    for (const [key, trace] of this.activeTraces.entries()) {
      if (trace.status === "ACTIVE" && trace.expiresAt < now) {
        trace.status = "EXPIRED";
      }
      if (trace.status === "EXPIRED" && trace.autoRenew) {
        const session = credentialService.getSession(trace.userSessionId);
        if (!session) {
          trace.autoRenew = false;
          trace.status = "FAILED";
          trace.errorMessage = "Access token is no longer valid or session expired.";
          continue;
        }
        try {
          this.validateNonProduction(trace.environment);
          const client = new ApigeeClient(trace.organization, session.accessToken);
          const deployments = await client.listDeployments(trace.proxy);
          const currentDeploy = deployments.find((d) => d.environment === trace.environment);
          if (!currentDeploy) {
            trace.autoRenew = false;
            trace.status = "FAILED";
            trace.errorMessage = "Proxy is no longer deployed in this environment.";
            continue;
          }
          const debugSession = await client.createDebugSession(trace.environment, trace.proxy, currentDeploy.revision, trace.timeoutSeconds);
          const apigeeSessionId = debugSession.name || debugSession.id || (0, import_uuid2.v4)();
          trace.sessionId = apigeeSessionId;
          trace.revision = currentDeploy.revision;
          trace.createdAt = Date.now();
          trace.expiresAt = trace.createdAt + trace.timeoutSeconds * 1e3;
          trace.status = "ACTIVE";
          trace.errorMessage = void 0;
          console.log(`[Audit] ${(/* @__PURE__ */ new Date()).toISOString()} TRACE_RENEWED ${trace.organization}/${trace.environment}/${trace.proxy} rev ${trace.revision}`);
        } catch (err) {
          trace.autoRenew = false;
          trace.status = "FAILED";
          trace.errorMessage = err.message || "Apigee error during renewal";
        }
      }
    }
  }
};
var traceService = new TraceService();

// src/server/routes/api.ts
var apiRouter = (0, import_express.Router)();
apiRouter.use((req, res, next) => {
  if (req.path === "/session/connect") return next();
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ error: "Unauthorized. No session found." });
  const session = credentialService.getSession(sessionId);
  if (!session) {
    res.clearCookie("sessionId");
    return res.status(401).json({ error: "Session expired or invalid." });
  }
  req.userSession = session;
  next();
});
apiRouter.post("/session/connect", async (req, res) => {
  const { organization, project, accessToken } = req.body;
  if (!organization || !accessToken) {
    return res.status(400).json({ error: "Organization and accessToken are required." });
  }
  try {
    const client = new ApigeeClient(organization, accessToken);
    await client.listProxies();
  } catch (err) {
    const status = err.status || 401;
    return res.status(status).json({ error: err.message || "Invalid credentials or organization not found", details: err.raw });
  }
  const sessionId = credentialService.createSession(organization, project, accessToken);
  res.cookie("sessionId", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"
  });
  res.json({ connected: true, organization });
});
apiRouter.post("/session/logout", (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    credentialService.removeSession(sessionId);
  }
  res.clearCookie("sessionId");
  res.json({ connected: false });
});
apiRouter.get("/proxies", async (req, res) => {
  try {
    const session = req.userSession;
    const client = new ApigeeClient(session.organization, session.accessToken);
    const proxies = await client.listProxies();
    res.json({ proxies });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message, details: err.raw });
  }
});
apiRouter.get("/proxies/:proxy/deployments", async (req, res) => {
  try {
    const session = req.userSession;
    const { proxy } = req.params;
    const client = new ApigeeClient(session.organization, session.accessToken);
    const deployments = await client.listDeployments(proxy);
    res.json({ proxy, deployments });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message, details: err.raw });
  }
});
apiRouter.post("/traces", async (req, res) => {
  try {
    const session = req.userSession;
    const { proxy, environment, revision, timeoutSeconds } = req.body;
    if (!proxy || !environment || !revision || !timeoutSeconds) {
      return res.status(400).json({ error: "Missing required parameters." });
    }
    const trace = await traceService.enableTrace(session.id, proxy, environment, revision, timeoutSeconds);
    res.json(trace);
  } catch (err) {
    const status = err.status || (err.message.includes("production") ? 403 : 500);
    res.status(status).json({ error: err.message, details: err.raw });
  }
});
apiRouter.get("/traces/active", (req, res) => {
  const session = req.userSession;
  const traces = traceService.getActiveTraces(session.organization);
  res.json(traces);
});
apiRouter.post("/traces/:proxy/:environment/renewal", (req, res) => {
  try {
    const session = req.userSession;
    const { proxy, environment } = req.params;
    const { enabled } = req.body;
    const trace = traceService.toggleAutoRenew(session.organization, environment, proxy, enabled);
    res.json(trace);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// api/index.ts
var app = (0, import_express2.default)();
app.set("trust proxy", 1);
app.use(import_express2.default.json());
app.use((0, import_cookie_parser.default)());
app.use((0, import_helmet.default)({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use("/api", apiRouter);
var index_default = app;
