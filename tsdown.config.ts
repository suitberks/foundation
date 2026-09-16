import { defineConfig } from 'tsdown';

// Tsdown builds the public root entry as one ESM bundle with generated declarations;
// More details: https://tsdown.dev/options;

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
