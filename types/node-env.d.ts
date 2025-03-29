declare namespace NodeJS {
  export interface ProcessEnv {
    KEYCLOAK_CLIENT_ID: string;
    KEYCLOAK_CLIENT_SECRET: string;
    KEYCLOAK_ISSUER: string;
    KEYCLOAK_URL: string;
    KEYCLOAK_REALM: string;
    KEYCLOAK_URL: string;
    KEYCLOAK_AUTH: string;
    NEXT_PUBLIC_URL_BACKEND: string;
    NEXT_PUBLIC_URL_BACKEND_STATS: string;
    NEXT_PUBLIC_URL_BACKEND_ANALYTICS: string;
  }
}
