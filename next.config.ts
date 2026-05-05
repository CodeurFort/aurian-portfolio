import type { NextConfig } from "next";

const repoName = 'aurian-portfolio';
const isProd = process.env.NODE_ENV === 'production';
const useBasePath = process.env.NEXT_PUBLIC_USE_BASE_PATH === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd && useBasePath ? `/${repoName}` : '',
  assetPrefix: isProd && useBasePath ? `/${repoName}/` : '',
  reactStrictMode: true,
};

export default nextConfig;
