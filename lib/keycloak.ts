import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: process.env.KEYCLOAK_URL,
  realm: process.env.KEYCLOAK_REALM,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
});

export default keycloak;

export const keycloakConfig = {
  url: process.env.KEYCLOAK_URL || "http://q-caas-wk-02.sec.telecel.net.py:8080",
  realm: process.env.KEYCLOAK_REALM || "MFS_ACCESS_INVOICES",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "your-client-id",
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "your-client-secret",
};


