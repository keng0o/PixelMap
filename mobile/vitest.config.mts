import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: [
        'src/cache/tileAddress.ts',
        'src/cache/tileCache.ts',
        'src/map/tileRepository.ts',
        'src/location/currentLocation.ts',
        'src/poi/previewPois.ts',
        'src/settings/layerSettings.ts',
        'src/settings/layerSettingsRepository.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 90,
      },
    },
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
