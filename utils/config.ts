// URLs base del backend con saneamiento de espacios en blanco
const getEnv = (key: string, defaultValue: string = "") => {
  if (typeof window !== "undefined" && (window as any).__ENV) {
    return (window as any).__ENV[key] || process.env[key] || defaultValue;
  }
  return process.env[key] || defaultValue;
};

// URLs base del backend con saneamiento de espacios en blanco
export const backendUrl = getEnv("NEXT_PUBLIC_URL_BACKEND").trim();
export const backendStatsUrl = getEnv("NEXT_PUBLIC_URL_BACKEND_STATS").trim();
export const backendAnalyticsUrl = getEnv(
  "NEXT_PUBLIC_URL_BACKEND_ANALYTICS"
).trim();

// Validar URLs
try {
  new URL(backendUrl);
  new URL(backendStatsUrl);
  new URL(backendAnalyticsUrl);
} catch (error) {
  console.error("Configuración de URL inválida:", error);
}

// Configuración de tiempos de espera
export const apiTimeout = Number.isNaN(Number(process.env.API_TIMEOUT))
  ? 30000 // Si no es un número válido, usar 30s
  : parseInt(process.env.API_TIMEOUT || "30000", 10);

// Modo de depuración
export const isDebugMode = process.env.DEBUG_MODE === "true";

export const maxFileSize = parseInt(
  getEnv("NEXT_PUBLIC_MAX_FILE_SIZE", "10737418240"),
  10
);

// Exportación de configuración general
export const config = {
  backendUrl,
  backendStatsUrl,
  backendAnalyticsUrl,
  invoicesUrl: backendUrl, // Ya incluye `/invoices`
  apiTimeout,
  isDebugMode,
  maxFileSize,
};
