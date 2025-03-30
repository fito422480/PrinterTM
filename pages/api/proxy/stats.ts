// pages/api/proxy/stats.ts
import { backendStatsUrl } from "@/utils/config";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!backendStatsUrl) {
    return res.status(500).json({ error: "URL de Stats no configurada." });
  }

  try {
    const apiRes = await fetch(backendStatsUrl, {
      method: req.method,
      headers: new Headers(req.headers as HeadersInit),
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });
    const data = await apiRes.text(); // Usa .json() si la respuesta es JSON
    res.status(apiRes.status).send(data);
  } catch (error) {
    console.error("Error al conectar con Stats:", error);
    res.status(500).json({ error: "Error al conectarse a la API de Stats" });
  }
}
