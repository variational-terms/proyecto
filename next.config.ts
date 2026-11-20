import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.variational.io",
      },
    ],
  },
  webpack: (config) => {
    // `pino` (dependencia opcional de WalletConnect, que llega dentro del
    // barrel de wagmi/connectors) intenta resolver un logger de desarrollo
    // que no existe en el navegador. No lo usamos: se silencia el warning.
    config.resolve.alias = {
      ...config.resolve.alias,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;