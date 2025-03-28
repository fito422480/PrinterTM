import type { AnalyticsItem } from "@/types/analytics";

export const fetchAnalytics = async (): Promise<AnalyticsItem[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5s

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_URL_BACKEND_ANALYTICS}`;

    if (!apiUrl) {
      throw new Error("La URL del backend no está configurada.");
    }

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos. Código de estado: ${response.status}`
      );
    }

    const data: AnalyticsItem[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        "La respuesta del backend no es un arreglo de datos analíticos."
      );
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("La solicitud de red fue cancelada por timeout.");
      } else {
        console.error("Error en fetchAnalytics:", error.message);
      }
    } else {
      console.error("Error inesperado:", error);
    }
    return []; // En caso de error, devolver un array vacío
  } finally {
    clearTimeout(timeoutId);
  }
};

export default fetchAnalytics;
