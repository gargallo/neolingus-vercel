/**
 * Vitest configuration for component testing
 * Separate config for React component tests
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['__tests__/components/setup/component-test-setup.ts'],
    include: ['__tests__/components/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~': path.resolve(__dirname, '.'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  }
});