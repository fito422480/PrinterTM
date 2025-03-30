#!/bin/sh

# Crear directorio para variables de entorno del lado del cliente
mkdir -p /app/public

# Generar configuración de entorno en tiempo de ejecución
echo "Generando configuración de entorno en tiempo de ejecución..."

# Iniciar el objeto de configuración
echo "window.__ENV = {" > /app/public/env-config.js

# Procesar variables de entorno que comienzan con NEXT_PUBLIC_
env | grep '^NEXT_PUBLIC_' | while IFS='=' read -r key value; do
  # Escapar comillas dobles en el valor
  escaped_value=$(echo "$value" | sed 's/"/\\"/g')
  # Añadir al archivo env-config.js
  echo "  \"$key\": \"$escaped_value\"," >> /app/public/env-config.js
done

# Añadir BASE_URL si existe
if [ ! -z "$BASE_URL" ]; then
  echo "  \"BASE_URL\": \"$BASE_URL\"," >> /app/public/env-config.js
fi

# Cerrar el objeto
echo "}" >> /app/public/env-config.js

# Hacer el archivo accesible
chmod 644 /app/public/env-config.js

echo "Configuración de entorno generada en /app/public/env-config.js"

# Ejecutar el comando pasado al entrypoint (normalmente npm run start)
exec "$@"
