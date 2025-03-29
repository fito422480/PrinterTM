import webpack from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: false,
  },
  webpack: (config, { isServer }) => {
    // Configuración para Web Workers
    config.plugins.push(
      new webpack.DefinePlugin({
        __WORKER__: JSON.stringify(!isServer),
      })
    );

    // Agrega esta línea para evitar conflictos con Webpack
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },
};

export default nextConfig;
