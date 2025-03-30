// pages/api/proxy/invoices/[id].ts
import { apiTimeout, backendUrl } from "@/utils/config";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
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

  if (!id) {
    return res.status(400).json({ error: "ID de documento requerido" });
  }

  // Construir la URL con el ID
  // Como backendUrl ya incluye '/invoices', solo necesitamos añadir el ID
  const targetUrl = `${backendUrl}/${id}`;

  console.log(`Solicitud proxy a: ${targetUrl}, Método: ${req.method}`);

  try {
    // Eliminar encabezados específicos del host
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;

    const requestOptions = {
      method: req.method,
      headers: new Headers(headers as HeadersInit),
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
      signal: AbortSignal.timeout(apiTimeout || 30000), // 30 segundos de tiempo de espera
    };

    console.log(`Enviando solicitud con opciones:`, {
      url: targetUrl,
      method: req.method,
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
    });

    const apiRes = await fetch(targetUrl, requestOptions);

    // Manejar la respuesta según el tipo de contenido
    const contentType = apiRes.headers.get("content-type");
    let data;

    if (contentType?.includes("application/json")) {
      data = await apiRes.json();
    } else {
      data = await apiRes.text();
    }

    // Establecer encabezados de respuesta
    apiRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    return res.status(apiRes.status).send(data);
  } catch (error: any) {
    console.error(`Error al conectar con facturas ID ${id}:`, error);
    return res.status(500).json({
      error: "Error al conectarse a la API de facturas",
      message: error.message,
      code: error.code || "UNKNOWN",
    });
  }
}
