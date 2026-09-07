import fs from 'node:fs';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

function loadMonorepoEnv(): void {
  const candidates = [
    path.join(__dirname, '../..'),
    path.join(process.cwd(), '../..'),
    process.cwd(),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, '.env')) || fs.existsSync(path.join(dir, '.env.local'))) {
      loadEnvConfig(dir);
      return;
    }
  }
}

loadMonorepoEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // Force-inline public env from root `.env` into the client bundle.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? process.env.PUBLIC_API_URL ?? '',
    NEXT_PUBLIC_CASHFREE_MODE: process.env.NEXT_PUBLIC_CASHFREE_MODE ?? '',
  },
  transpilePackages: ['@cypher/tokens', '@cypher/utils', '@cypher/contracts', '@cypher/api-client', '@cypher/validation'],
  async redirects() {
    return [{ source: '/', destination: '/discover', permanent: false }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/v1/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/v1/media/**',
      },
    ],
  },
};

export default nextConfig;
