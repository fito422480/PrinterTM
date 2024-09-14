// pages/api/login.js
import authenticate from "../ldap/ldapAuth.tsx";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    try {
      const result = await authenticate(email, password);
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(401).json({ message: "Authentication failed" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
