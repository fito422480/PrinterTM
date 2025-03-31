import { apiTimeout, backendAnalyticsUrl } from "@/utils/config";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!backendAnalyticsUrl) {
    return res.status(500).json({ error: "URL de Analytics no configurada." });
  }

  console.log(`[Proxy] ➡️ ${req.method} ${backendAnalyticsUrl}`);

  try {
    // Filtrar solo los encabezados necesarios
    const headers = new Headers({
      "Content-Type": "application/json",
      ...(req.headers.authorization && {
        Authorization: req.headers.authorization,
      }),
    });

    const requestOptions: RequestInit = {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
      signal: AbortSignal.timeout(apiTimeout || 30000), // 30 segundos de timeout
    };

    console.log(`[Proxy] Enviando request con opciones:`, {
      method: req.method,
      url: backendAnalyticsUrl,
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
    });

    const apiRes = await fetch(backendAnalyticsUrl, requestOptions);

    // Manejo dinámico del contenido
    const contentType = apiRes.headers.get("content-type") || "";
    const responseData = contentType.includes("application/json")
      ? await apiRes.json()
      : await apiRes.text();

    // Reenviar headers de la respuesta del backend
    apiRes.headers.forEach((value, key) => res.setHeader(key, value));

    return res.status(apiRes.status).send(responseData);
  } catch (error: any) {
    console.error(`[Proxy] ❌ Error en la solicitud a Analytics:`, error);

    return res.status(500).json({
      error: "Error al conectarse a la API de Analytics",
      message: error.message || "Ocurrió un error desconocido",
      code: error.code || "UNKNOWN",
    });
  }
}
