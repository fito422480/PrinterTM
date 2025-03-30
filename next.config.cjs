import { config } from "dotenv";
import webpack from "webpack";

// Carga las variables de entorno
config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    NEXT_PUBLIC_URL_BACKEND: process.env.NEXT_PUBLIC_URL_BACKEND,
    NEXT_PUBLIC_URL_BACKEND_STATS: process.env.NEXT_PUBLIC_URL_BACKEND_STATS,
    NEXT_PUBLIC_URL_BACKEND_ANALYTICS:
      process.env.NEXT_PUBLIC_URL_BACKEND_ANALYTICS,
    NEXT_PUBLIC_MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Configuración de resolución de módulos
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };

    // Plugins de webpack
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        __WORKER__: JSON.stringify(!isServer),
      })
    );

    return config;
  },
};

export default nextConfig;
