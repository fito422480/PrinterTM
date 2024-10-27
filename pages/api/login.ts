import { NextApiRequest, NextApiResponse } from "next";
import ldap from "ldapjs";
import { promisify } from "util";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res
      .status(400)
      .json({ message: "Usuario y contraseña son requeridos" });
  }

  console.log("LDAP URI:", process.env.LDAP_URI);

  const client = ldap.createClient({
    url: process.env.LDAP_URI || "ldap://p-ad-dc-02.telecel.net.py:389",
  });

  // Cambiamos el DN a 'CN=LDAPUSER,CN=Users,DC=telecel,DC=net,DC=py'
  const dn = `CN=GRP_TusRecibos,OU=Grupos de Usuarios,DC=telecel,DC=net,DC=py`;

  const bindAsync = promisify(client.bind.bind(client));
  const unbindAsync = promisify(client.unbind.bind(client));

  try {
    await bindAsync(dn, password);
    await unbindAsync();
    return res.status(200).json({ message: "Autenticación exitosa" });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error de autenticación LDAP:", err);
      return res
        .status(401)
        .json({ message: `Credenciales inválidas: ${err.message}` });
    } else {
      console.error("Error desconocido en autenticación LDAP:", err);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
  } finally {
    client.unbind();
  }
}
