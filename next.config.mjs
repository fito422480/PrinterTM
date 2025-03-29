import { config } from "dotenv";
import webpack from "webpack";

config();

/**
 * Gets a runtime environment variable
 * Falls back to process.env if running on server
 * or if runtime variable is not available
 */
export function getRuntimeEnv(key) {
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
    const config = {};
    Object.keys(process.env)
      .filter((key) => key.startsWith("NEXT_PUBLIC_"))
      .forEach((key) => {
        config[key] = process.env[key];
      });
    return config;
  }
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: false,
  },
  publicRuntimeConfig: getPublicRuntimeConfig(),
  webpack: (config, { isServer }) => {
    // Configuración para Web Workers
    config.plugins.push(
      new webpack.DefinePlugin({
        __WORKER__: JSON.stringify(!isServer),
      })
    );

    // Agrega esta línea para evitar conflictos con Webpack
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },
};

export default nextConfig;
