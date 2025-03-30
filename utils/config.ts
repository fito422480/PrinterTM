// utils/config.ts

// URLs base del backend
export const backendUrl =
  process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:9500/invoices";

// Como la URL base ya incluye '/invoices', no necesitamos añadirlo nuevamente
export const invoicesUrl = backendUrl;

export const backendStatsUrl =
  process.env.NEXT_PUBLIC_URL_BACKEND_STATS ||
  "http://localhost:9500/invoices/stats";
export const backendAnalyticsUrl =
  process.env.NEXT_PUBLIC_URL_BACKEND_ANALYTICS ||
  "http://localhost:9500/invoices/analytics";

// Configuración de tiempos de espera
export const apiTimeout = parseInt(process.env.API_TIMEOUT || "30000", 10); // 30 segundos por defecto

// Modo de depuración
export const isDebugMode = process.env.DEBUG_MODE === "true";

// Exportación de configuración general
export const config = {
  backendUrl,
  backendStatsUrl,
  backendAnalyticsUrl,
  invoicesUrl,
  apiTimeout,
  isDebugMode,
};
