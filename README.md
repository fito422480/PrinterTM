# Printer Money

Esta plataforma está diseñada para administrar las facturas de Lending B2C y B2B. Es una solución integral para la gestión de facturación, timbrados y procesos por lotes.

## Características Principales

*   **Gestión de Facturación**: Administración de facturas para Lending B2C y B2B.
*   **Procesamiento por Lotes**: Funcionalidad dedicada para manejar operaciones masivas (Batch).
*   **Gestión de Timbrados**: Módulo para la administración de timbrados (Stamping).
*   **Autenticación Segura**: Integración con Keycloak para autenticación y autorización de usuarios.
*   **Interfaz Moderna**: Diseño responsivo y amigable utilizando Tailwind CSS y Shadcn/ui.
*   **Visualización de Datos**: Gráficos y reportes integrados con Recharts.

## Tecnologías Utilizadas

Este proyecto está construido con un stack moderno de tecnologías web:

*   **Framework**: Next.js 14 (App Router)
*   **Lenguaje**: TypeScript
*   **Estilos**: Tailwind CSS, Shadcn/ui, Class variance authority
*   **Formularios y Validación**: React Hook Form, Zod
*   **Autenticación**: NextAuth.js, Keycloak provider
*   **Base de Datos (Cliente)**: OracleDB (node driver)
*   **Visualización**: Recharts
*   **Contenedorización**: Docker, Docker Compose

## Requisitos Previos

*   Node.js (versión LTS recomendada)
*   Docker y Docker Compose (opcional, para despliegue en contenedores)

## Instalación y Configuración Local

1.  **Instalar dependencias:**

    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno:**
    Asegúrate de configurar las variables de entorno necesarias. Puedes tomar como referencia el archivo `docker-compose.yml` para ver las variables requeridas como `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_URL`, `NEXT_PUBLIC_URL_BACKEND`, etc.

3.  **Ejecutar el servidor de desarrollo:**

    ```bash
    npm run dev
    # o
    yarn dev
    # o
    pnpm dev
    # o
    bun dev
    ```

    Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## Ejecución con Docker

El proyecto incluye configuración para Docker y Docker Compose para facilitar el despliegue.

1.  **Construir y levantar los contenedores:**

    ```bash
    docker-compose up -d --build
    ```

    Esto levantará el servicio `nextjs-app` en el puerto 3000.

2.  **Verificar estado:**

    Puedes verificar que el contenedor está corriendo correctamente con:

    ```bash
    docker ps
    ```

## Estructura del Proyecto

*   **app/**: Contiene el código fuente principal (App Router), con layouts y páginas.
    *   **(auth)**: Rutas relacionadas con la autenticación.
    *   **(main)**: Rutas principales de la aplicación (batch, posts, profile, settings, stamping).
*   **components/**: Componentes de UI reutilizables.
*   **public/**: Archivos estáticos.
*   **utils/**: Funciones de utilidad y configuración.
*   **types/**: Definiciones de tipos TypeScript.
*   **docker-compose.yml**: Configuración de servicios Docker.
*   **Dockerfile.front**: Definición de la imagen Docker para el frontend.

## Scripts Disponibles

*   `npm run dev`: Inician el servidor de desarrollo.
*   `npm run build`: Construye la aplicación para producción.
*   `npm run start`: Inicia el servidor de producción (require build previo).
*   `npm run lint`: Ejecuta el linter para mantener la calidad del código.
