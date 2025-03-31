import { apiTimeout, backendUrl } from "@/utils/config";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Ajustable según necesidad
    },
    externalResolver: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!backendUrl) {
    return res.status(500).json({ error: "URL del backend no configurada." });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res
      .status(400)
      .json({ error: "ID de documento requerido o inválido." });
  }

  // Construcción segura de la URL
  const targetUrl = new URL(`${backendUrl}/${id}`).toString();

  console.log(`[Proxy] ➡️ ${req.method} ${targetUrl}`);

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
      url: targetUrl,
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
    });

    const apiRes = await fetch(targetUrl, requestOptions);

    // Reenviar headers de la respuesta del backend
    apiRes.headers.forEach((value, key) => res.setHeader(key, value));

    // Manejo dinámico del contenido
    const contentType = apiRes.headers.get("content-type") || "";
    const responseData = contentType.includes("application/json")
      ? await apiRes.json()
      : await apiRes.text();

    return res.status(apiRes.status).send(responseData);
  } catch (error: any) {
    console.error(`[Proxy] ❌ Error en la solicitud a ${targetUrl}:`, error);

    return res.status(500).json({
      error: "Error al conectarse a la API de facturas",
      message: error.message || "Ocurrió un error desconocido",
      code: error.code || "UNKNOWN",
    });
  }
}
