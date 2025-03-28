import { keycloakConfig } from "@/lib/keycloak";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { usuario, password } = req.body;

  try {
    const params = new URLSearchParams();
    params.append("client_id", keycloakConfig.clientId);
    params.append("client_secret", keycloakConfig.clientSecret);
    params.append("grant_type", "password");
    params.append("username", usuario);
    params.append("password", password);

    const response = await fetch(
      `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    if (response.ok) {
      const data = await response.json();

      // Configuración de la cookie `isAuthenticated` con las opciones necesarias
      res.setHeader(
        "Set-Cookie",
        "isAuthenticated=true; Path=/; HttpOnly; Secure; Max-Age=86400"
      );

      // También se puede almacenar el token de acceso en el cliente si es necesario
      res.status(200).json({ access_token: data.access_token });
    } else {
      const errorData = await response.json();
      res.status(response.status).json({
        message: errorData.error_description || "Error de autenticación",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
