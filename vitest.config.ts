import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'worker/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        statements: 0,
        branches: 0,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next.js resolves 'server-only' internally; tests run outside the react-server condition.
      'server-only': path.resolve(__dirname, './node_modules/next/dist/compiled/server-only/empty.js'),
    },
  },
})
