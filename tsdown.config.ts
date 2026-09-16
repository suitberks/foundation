import { defineConfig } from 'tsdown';

// Tsdown bundles the root entry as ESM and emits the public TypeScript declarations;
// Full configuration reference and supported options: https://tsdown.dev/options;

const tsdownConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'esnext',

  dts: true,
  clean: true,
  unbundle: false,
  fixedExtension: false,
});

export default tsdownConfig;
