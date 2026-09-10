import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvConfig } from '@next/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadMonorepoEnv() {
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // Force-inline public env from root `.env` into the client bundle.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    // Prefer `||` so an empty bake-in from a cold loadEnv does not disable the API URL.
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL || 'http://127.0.0.1:3001',
    NEXT_PUBLIC_CASHFREE_MODE: process.env.NEXT_PUBLIC_CASHFREE_MODE || '',
  },
  transpilePackages: [
    '@cypher/tokens',
    '@cypher/utils',
    '@cypher/contracts',
    '@cypher/api-client',
    '@cypher/validation',
  ],
  async redirects() {
    return [
      { source: '/', destination: '/discover', permanent: false },
      { source: '/map', destination: '/discover', permanent: false },
      { source: '/videos', destination: '/discover', permanent: false },
      { source: '/organizers', destination: '/discover', permanent: false },
      { source: '/saved', destination: '/discover', permanent: false },
      { source: '/saved/:path*', destination: '/discover', permanent: false },
    ];
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
