/**
 * Gets a runtime environment variable
 * Falls back to process.env if running on server
 * or if runtime variable is not available
 */
export function getRuntimeEnv(key: string) {
  if (typeof window !== "undefined" && window.__ENV && window.__ENV[key]) {
    return window.__ENV[key];
  }
  return process.env[key];
}

/**
 * Helper function to get all NEXT_PUBLIC_ environment variables
 */
export function getPublicRuntimeConfig() {
  if (typeof window === "undefined") {
    const config: Record<string, string> = {};
    Object.keys(process.env)
      .filter((key) => key.startsWith("NEXT_PUBLIC_"))
      .forEach((key) => {
        config[key] = process.env[key] || "";
      });
    return config;
  }
  return window.__ENV || {};
}
