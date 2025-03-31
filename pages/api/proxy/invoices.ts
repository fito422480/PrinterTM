import { apiTimeout, backendUrl } from "@/utils/config";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Aumentar esto si es necesario
    },
    externalResolver: true, // Permite que la API maneje respuestas externas
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!backendUrl) {
    return res.status(500).json({ error: "URL del backend no configurada." });
  }

  const targetUrl = backendUrl;

  console.log(`📡 Proxy request to: ${targetUrl} | Method: ${req.method}`);

  // Controlador de abortos para manejar timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiTimeout || 30000);

  try {
    // Clonar headers y limpiar algunos que pueden generar errores
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!["host", "connection", "content-length"].includes(key) && value) {
        headers.append(key, String(value));
      }
    });

    const requestOptions: RequestInit = {
      method: req.method,
      headers,
      signal: controller.signal,
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      requestOptions.body = JSON.stringify(req.body);
    }

    console.log(`🔄 Forwarding request: ${targetUrl}`, requestOptions);

    // Hacer la solicitud al backend
    const apiRes = await fetch(targetUrl, requestOptions);
    const contentType = apiRes.headers.get("content-type") || "";

    let data;
    if (contentType.includes("application/json")) {
      data = await apiRes.json();
    } else {
      data = await apiRes.text();
    }

    // Pasar headers de respuesta
    apiRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    clearTimeout(timeoutId);
    return res.status(apiRes.status).send(data);
  } catch (error: any) {
    clearTimeout(timeoutId);

    let errorCode = "UNKNOWN";
    let errorMessage = "Error al conectarse a la API de facturas";

    if (error.name === "AbortError") {
      errorCode = "TIMEOUT";
      errorMessage = "La solicitud al backend ha tardado demasiado";
    } else if (error.name === "FetchError") {
      errorCode = "NETWORK_ERROR";
      errorMessage = "Error de conexión con el backend";
    }

    console.error("❌ Proxy error:", error);
    return res.status(500).json({ error: errorMessage, code: errorCode });
  }
}
