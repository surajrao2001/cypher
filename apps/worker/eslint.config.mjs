import nest from '@cypher/eslint-config/nest';

export default [
  ...nest,
  {
    ignores: ['dist/**', 'coverage/**', 'jest.config.cjs'],
  },
];
