import nextConfig from '@cypher/eslint-config/next';

export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'],
  },
];
