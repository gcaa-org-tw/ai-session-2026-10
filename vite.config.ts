import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ai-session-2026-10/',
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
