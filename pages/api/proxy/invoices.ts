// pages/api/proxy/invoices.ts
import { backendUrl } from "@/utils/config";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!backendUrl) {
    return res.status(500).json({ error: "URL de Invoices no configurada." });
  }

  try {
    const apiRes = await fetch(backendUrl, {
      method: req.method,
      headers: new Headers(req.headers as HeadersInit),
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });
    const data = await apiRes.text(); // Usa .json() si la API devuelve JSON
    res.status(apiRes.status).send(data);
  } catch (error) {
    console.error("Error al conectar con Invoices:", error);
    res.status(500).json({ error: "Error al conectarse a la API de Invoices" });
  }
}
