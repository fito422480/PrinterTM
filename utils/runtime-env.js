/**
 * Gets a runtime environment variable
 * Falls back to process.env if running on server
 * or if runtime variable is not available
 */
export function getRuntimeEnv(key) {
  // Check if we're in the browser and the runtime config exists
  if (typeof window !== "undefined" && window.__ENV && window.__ENV[key]) {
    return window.__ENV[key];
  }

  // Fall back to normal environment variables (during build or SSR)
  return process.env[key];
}

/**
 * Helper function to get all NEXT_PUBLIC_ environment variables
 */
export function getPublicRuntimeConfig() {
  if (typeof window === "undefined") {
    // Server-side: Get from process.env
    const config = {};

    // Filter for NEXT_PUBLIC keys from process.env
    Object.keys(process.env)
      .filter((key) => key.startsWith("NEXT_PUBLIC_"))
      .forEach((key) => {
        config[key] = process.env[key];
      });

    return config;
  }

  // Client-side: Get from window.__ENV
  return window.__ENV || {};
}

/**
 * Specific helpers for common environment variables
 */
export function getBackendUrl() {
  return getRuntimeEnv("NEXT_PUBLIC_URL_BACKEND");
}

export function getBackendStatsUrl() {
  return getRuntimeEnv("NEXT_PUBLIC_URL_BACKEND_STATS");
}

export function getBackendAnalyticsUrl() {
  return getRuntimeEnv("NEXT_PUBLIC_URL_BACKEND_ANALYTICS");
}

export function getMaxFileSize() {
  return getRuntimeEnv("NEXT_PUBLIC_MAX_FILE_SIZE");
}
