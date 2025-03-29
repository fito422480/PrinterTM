#!/bin/bash
# Asegurar que la variable BASE_URL esté definida
if [ -z "$BASE_URL" ]; then
  echo "Error: BASE_URL no está definida."
  exit 1
fi

# Reemplazar las URLs dentro de /app/.next con el valor de BASE_URL
find /app/.next -type f -exec sed -i "s|http://localhost:9500|$BASE_URL|g" {} +

echo "Reemplazo completado con BASE_URL=$BASE_URL"
# Fin del script
# Este script se encarga de reemplazar las URLs dentro de la carpeta /app/.next
