declare namespace NodeJS {
  export interface ProcessEnv {
    KEYCLOAK_CLIENT_ID: string;
    KEYCLOAK_CLIENT_SECRET: string;
    KEYCLOAK_ISSUER: string;
    KEYCLOAK_URL: string;
    KEYCLOAK_REALM: string;
    KEYCLOAK_URL: string;
    KEYCLOAK_AUTH: string;
    URL_BACKEND: string;
    URL_BACKEND_STATS: string;
    URL_BACKEND_ANALYTICS: string;
  }
}
