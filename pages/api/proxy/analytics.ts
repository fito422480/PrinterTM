// pages/api/proxy/analytics.ts
import { backendAnalyticsUrl } from "@/utils/config";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!backendAnalyticsUrl) {
    return res.status(500).json({ error: "URL de Analytics no configurada." });
  }

  try {
    const apiRes = await fetch(backendAnalyticsUrl, {
      method: req.method,
      headers: new Headers(req.headers as HeadersInit),
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });
    const data = await apiRes.text(); // Usa .json() si la API devuelve JSON
    res.status(apiRes.status).send(data);
  } catch (error) {
    console.error("Error al conectar con Analytics:", error);
    res
      .status(500)
      .json({ error: "Error al conectarse a la API de Analytics" });
  }
}
