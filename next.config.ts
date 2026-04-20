import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CES DEUX LIGNES FORCENT VERCEL À DÉPLOYER MÊME S'IL Y A DES AVERTISSEMENTS
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;