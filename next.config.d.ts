declare module "../next.config.mjs" {
  export function getBackendUrl(): string;
  export function getBackendStatsUrl(): string;
  export function getBackendAnalyticsUrl(): string;
}
