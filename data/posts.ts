import type { Post } from "@/types/posts";

export const fetchPosts = async (): Promise<Post[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

  try {
    const backendUrl =
      process.env.URL_BACKEND || "http://localhost:9500/invoices";
    if (!backendUrl) {
      throw new Error("La URL del backend no está configurada.");
    }

    const response = await fetch(backendUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal, // Agregar la señal de aborto
    });

    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos. Código de estado: ${response.status}`
      );
    }

    const data: Post[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("La respuesta no contiene un arreglo de posts.");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("La solicitud de red fue cancelada por timeout.");
      } else {
        console.error("Error en fetchPosts:", error.message);
      }
    } else {
      console.error("Error inesperado:", error);
    }
    return [];
  } finally {
    clearTimeout(timeoutId); // Limpiar el timeout después de la solicitud
  }
};

export default fetchPosts;
