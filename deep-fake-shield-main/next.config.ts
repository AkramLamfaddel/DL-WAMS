import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone build output for Docker optimization
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
      // Local dev — direct service access
      {
        protocol: "http",
        hostname: "localhost",
        port: "8001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      // Docker — allow gallery-service container hostname
      {
        protocol: "http",
        hostname: "gallery-service",
        port: "8001",
        pathname: "/**",
      },
      // Docker — allow via Traefik (port 80, all paths)
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
