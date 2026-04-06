const MAX_EVENTS = 1200;
const MAX_RECENT = 30;
const MAX_INTEGRATION_EVENTS = 4000;
const KNOWN_INTEGRATIONS = ['gemini', 'github', 'sapling', 'redis', 'supabase'];

const requestEvents = [];
const integrationEvents = [];
const integrationTotals = {};

function recordRequest(event) {
  const normalized = {
    method: String(event.method || 'GET').toUpperCase(),
    path: String(event.path || '/'),
    statusCode: Number(event.statusCode) || 0,
    durationMs: Number(event.durationMs) || 0,
    timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString()
  };

  requestEvents.push(normalized);
  if (requestEvents.length > MAX_EVENTS) {
    requestEvents.splice(0, requestEvents.length - MAX_EVENTS);
  }
}

function buildTrend(windowMs, bucketCount) {
  const now = Date.now();
  const bucketSize = Math.max(1, Math.floor(windowMs / bucketCount));
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: new Date(now - (bucketCount - index - 1) * bucketSize).toISOString(),
    value: 0,
  }));

  requestEvents.forEach((event) => {
    const timestamp = new Date(event.timestamp).getTime();
    const delta = now - timestamp;
    if (delta < 0 || delta > windowMs) return;
    const bucketIndex = Math.min(bucketCount - 1, Math.floor(delta / bucketSize));
    const targetIndex = bucketCount - 1 - bucketIndex;
    if (buckets[targetIndex]) {
      buckets[targetIndex].value += 1;
    }
  });

  return buckets;
}

function recordIntegrationCall(name, details = {}) {
  const integration = String(name || 'unknown').toLowerCase();
  const success = details.success !== false;
  const statusCode = Number.isFinite(Number(details.statusCode)) ? Number(details.statusCode) : (success ? 200 : 500);
  const durationMs = Number.isFinite(Number(details.durationMs)) ? Number(details.durationMs) : 0;
  const timestamp = details.timestamp ? new Date(details.timestamp).toISOString() : new Date().toISOString();
  const error = details.error ? String(details.error).slice(0, 220) : null;

  integrationEvents.push({ integration, success, statusCode, durationMs, timestamp });
  if (integrationEvents.length > MAX_INTEGRATION_EVENTS) {
    integrationEvents.splice(0, integrationEvents.length - MAX_INTEGRATION_EVENTS);
  }

  if (!integrationTotals[integration]) {
    integrationTotals[integration] = {
      total: 0,
      success: 0,
      failed: 0,
      lastCalledAt: null,
      lastStatusCode: null,
      lastError: null,
      totalDurationMs: 0,
    };
  }

  const item = integrationTotals[integration];
  item.total += 1;
  item.success += success ? 1 : 0;
  item.failed += success ? 0 : 1;
  item.lastCalledAt = timestamp;
  item.lastStatusCode = statusCode;
  item.lastError = success ? null : error;
  item.totalDurationMs += durationMs;
}

function buildIntegrationTrend(integration, windowMs, bucketCount) {
  const now = Date.now();
  const bucketSize = Math.max(1, Math.floor(windowMs / bucketCount));
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: new Date(now - (bucketCount - index - 1) * bucketSize).toISOString(),
    value: 0,
  }));

  integrationEvents.forEach((event) => {
    if (event.integration !== integration) return;
    const timestamp = new Date(event.timestamp).getTime();
    const delta = now - timestamp;
    if (delta < 0 || delta > windowMs) return;
    const bucketIndex = Math.min(bucketCount - 1, Math.floor(delta / bucketSize));
    const targetIndex = bucketCount - 1 - bucketIndex;
    if (buckets[targetIndex]) {
      buckets[targetIndex].value += 1;
    }
  });

  return buckets;
}

function getIntegrationStats() {
  const now = Date.now();
  const last24Hours = integrationEvents.filter((event) => now - new Date(event.timestamp).getTime() <= 24 * 60 * 60 * 1000);
  const usage24h = {};
  const error24h = {};

  last24Hours.forEach((event) => {
    usage24h[event.integration] = (usage24h[event.integration] || 0) + 1;
    if (!event.success || event.statusCode >= 400) {
      error24h[event.integration] = (error24h[event.integration] || 0) + 1;
    }
  });

  const names = Array.from(new Set([...KNOWN_INTEGRATIONS, ...Object.keys(integrationTotals)]));
  const services = names.reduce((acc, name) => {
    const item = integrationTotals[name] || {
      total: 0,
      success: 0,
      failed: 0,
      lastCalledAt: null,
      lastStatusCode: null,
      lastError: null,
      totalDurationMs: 0,
    };

    acc[name] = {
      total: item.total,
      success: item.success,
      failed: item.failed,
      avgDurationMs: item.total > 0 ? Math.round(item.totalDurationMs / item.total) : 0,
      lastCalledAt: item.lastCalledAt,
      lastStatusCode: item.lastStatusCode,
      lastError: item.lastError,
      used24h: usage24h[name] || 0,
      errors24h: error24h[name] || 0,
      trend24h: buildIntegrationTrend(name, 24 * 60 * 60 * 1000, 24),
    };
    return acc;
  }, {});

  return {
    services,
    knownIntegrations: names,
  };
}

function getRequestStats() {
  const total = requestEvents.length;
  const now = Date.now();
  const last15Minutes = requestEvents.filter((event) => now - new Date(event.timestamp).getTime() <= 15 * 60 * 1000);
  const lastHour = requestEvents.filter((event) => now - new Date(event.timestamp).getTime() <= 60 * 60 * 1000);
  const last24Hours = requestEvents.filter((event) => now - new Date(event.timestamp).getTime() <= 24 * 60 * 60 * 1000);
  const errorCount = last24Hours.filter((event) => event.statusCode >= 400).length;

  const statusCounts = requestEvents.reduce((acc, event) => {
    const group = `${Math.floor(event.statusCode / 100)}xx`;
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const routeCounts = requestEvents.reduce((acc, event) => {
    const key = `${event.method} ${event.path}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const recentRequests = requestEvents
    .slice(-MAX_RECENT)
    .reverse();

  const averageDuration = total
    ? Math.round(requestEvents.reduce((sum, event) => sum + event.durationMs, 0) / total)
    : 0;

  const slowRequests = requestEvents.filter((event) => event.durationMs >= 500).length;

  return {
    totalRequests: total,
    requestsLast15Minutes: last15Minutes.length,
    requestsLastHour: lastHour.length,
    requestsLast24Hours: last24Hours.length,
    errorCountLast24Hours: errorCount,
    errorRateLast24Hours: last24Hours.length ? Math.round((errorCount / last24Hours.length) * 100) : 0,
    averageDurationMs: averageDuration,
    slowRequests,
    statusCounts,
    topRoutes: Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([route, count]) => ({ route, count })),
    recentRequests,
    trend24h: buildTrend(24 * 60 * 60 * 1000, 24),
    trend15m: buildTrend(15 * 60 * 1000, 15),
  };
}

module.exports = {
  recordRequest,
  getRequestStats,
  recordIntegrationCall,
  getIntegrationStats,
  KNOWN_INTEGRATIONS,
};