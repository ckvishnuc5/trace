export const config = {
  apigeeBaseUrl: process.env.APIGEE_BASE_URL || 'https://apigee.googleapis.com/v1',
  blockedEnvironments: (process.env.BLOCKED_ENVIRONMENTS || 'prod,production,prd,production-us,production-eu')
    .split(',')
    .map(e => e.trim().toLowerCase()),
  maxTraceTimeoutSeconds: parseInt(process.env.MAX_TRACE_TIMEOUT_SECONDS || '600', 10),
  defaultTraceTimeoutSeconds: parseInt(process.env.DEFAULT_TRACE_TIMEOUT_SECONDS || '300', 10),
  traceConflictPolicy: (process.env.TRACE_CONFLICT_POLICY || 'warn') as 'warn' | 'block' | 'allow',
  sessionTtlMinutes: parseInt(process.env.SESSION_TTL_MINUTES || '30', 10),
};
