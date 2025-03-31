// URLs base del backend con saneamiento de espacios en blanco
export const backendUrl = (
  process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:9500/invoices"
).trim();
export const backendStatsUrl = (
  process.env.NEXT_PUBLIC_URL_BACKEND_STATS ||
  "http://localhost:9500/invoices/stats"
).trim();
export const backendAnalyticsUrl = (
  process.env.NEXT_PUBLIC_URL_BACKEND_ANALYTICS ||
  "http://localhost:9500/invoices/analytics"
).trim();

// Validar URLs
try {
  new URL(backendUrl);
  new URL(backendStatsUrl);
  new URL(backendAnalyticsUrl);
} catch (error) {
  console.error("❌ Configuración de URL inválida:", error);
}

// Configuración de tiempos de espera
export const apiTimeout = Number.isNaN(Number(process.env.API_TIMEOUT))
  ? 30000 // Si no es un número válido, usar 30s
  : parseInt(process.env.API_TIMEOUT || "30000", 10);

// Modo de depuración
export const isDebugMode = process.env.DEBUG_MODE === "true";

// Exportación de configuración general
export const config = {
  backendUrl,
  backendStatsUrl,
  backendAnalyticsUrl,
  invoicesUrl: backendUrl, // Ya incluye `/invoices`
  apiTimeout,
  isDebugMode,
};
