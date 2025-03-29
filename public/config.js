// env-config.js

const fs = require("fs");
const path = require("path");

const envVariables = {
  NEXT_PUBLIC_URL_BACKEND: process.env.NEXT_PUBLIC_URL_BACKEND,
  NEXT_PUBLIC_URL_BACKEND_STATS: process.env.NEXT_PUBLIC_URL_BACKEND_STATS,
  NEXT_PUBLIC_URL_BACKEND_ANALYTICS:
    process.env.NEXT_PUBLIC_URL_BACKEND_ANALYTICS,
};

const envFilePath = path.join(__dirname, "public/env-config.js");

// Escribe las variables en un archivo accesible por el frontend
fs.writeFileSync(
  envFilePath,
  `window.__ENV = ${JSON.stringify(envVariables, null, 2)};`
);

console.log("✅ Archivo env-config.js generado en /public");
