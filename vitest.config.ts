import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    globals: false,
    testTimeout: 20000,
    // handshake tests boot an Express server; keep them serial-safe
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Scope coverage to the unit-tested core (the pure engine + API + data + db).
      // The web/ app is a separate Next.js package covered by Playwright e2e, and
      // scripts/ are ops CLIs — excluding them keeps the number honest & meaningful.
      include: ['engine/**', 'api/**', 'data/**', 'db/**', 'config.ts'],
      exclude: ['web/**', 'e2e/**', 'scripts/**', 'test/**', 'fixtures/**', '**/*.d.ts'],
    },
  },
});
