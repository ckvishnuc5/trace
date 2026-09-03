const getBaseUrl = () => {
  const url = process.env.APIGEE_BASE_URL;
  if (url && url.startsWith('http')) return url;
  return 'https://apigee.googleapis.com/v1';
};

const getConflictPolicy = () => {
  const p = process.env.TRACE_CONFLICT_POLICY;
  if (p === 'block' || p === 'allow' || p === 'warn') return p;
  return 'warn';
};

export const config = {
  apigeeBaseUrl: getBaseUrl(),
  blockedEnvironments: (process.env.BLOCKED_ENVIRONMENTS || 'prod,production,prd,production-us,production-eu')
    .split(',')
    .map(e => e.trim().toLowerCase()),
  maxTraceTimeoutSeconds: isNaN(parseInt(process.env.MAX_TRACE_TIMEOUT_SECONDS || '', 10)) ? 600 : parseInt(process.env.MAX_TRACE_TIMEOUT_SECONDS || '600', 10),
  defaultTraceTimeoutSeconds: isNaN(parseInt(process.env.DEFAULT_TRACE_TIMEOUT_SECONDS || '', 10)) ? 300 : parseInt(process.env.DEFAULT_TRACE_TIMEOUT_SECONDS || '300', 10),
  traceConflictPolicy: getConflictPolicy(),
  sessionTtlMinutes: isNaN(parseInt(process.env.SESSION_TTL_MINUTES || '', 10)) ? 30 : parseInt(process.env.SESSION_TTL_MINUTES || '30', 10),
};
