// pages/api/proxy/invoices.ts
import { apiTimeout, backendUrl } from "@/utils/config";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb", // Aumentar esto si es necesario
    },
    // Aumentar el tiempo de espera de la API (por defecto es 10 segundos)
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

  // Ya que backendUrl incluye '/invoices', usamos esta URL directamente
  const targetUrl = backendUrl;

  // Log para depuración
  console.log(`Solicitud proxy a: ${targetUrl}, Método: ${req.method}`);

  try {
    // Eliminar encabezados específicos del host que podrían causar problemas
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
      // Agregar un tiempo de espera más largo
      signal: AbortSignal.timeout(apiTimeout || 30000), // 30 segundos de tiempo de espera
    };

    // Registrar la solicitud para depuración
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
    console.error("Error al conectar con el servicio de facturas:", error);
    // Mensaje de error más detallado
    return res.status(500).json({
      error: "Error al conectarse a la API de facturas",
      message: error.message,
      code: error.code || "UNKNOWN",
    });
  }
}
