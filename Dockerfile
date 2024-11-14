FROM node:23-alpine AS builder

# Crea el directorio de la aplicación
WORKDIR /app

# Copia el archivo package.json y package-lock.json para instalar las dependencias primero
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm ci

# Copia el resto del código fuente al contenedor
COPY . .

# Compila el proyecto Next.js
RUN npm run build

# Producción
FROM node:18-alpine AS runner

# Se establece el directorio de trabajo en /app
WORKDIR /app

# Se copia el `node_modules` y el `build` de la etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Se copia otros archivos necesarios para la aplicación en producción
COPY next.config.mjs .
COPY package.json .
COPY next-env.d.ts .
# Se copia el archivo de ambiente
COPY .env.local . 

# Se expone el puerto
EXPOSE 3000

# Configura el comando para iniciar Next.js en modo producción
CMD ["npm", "run", "start"]
