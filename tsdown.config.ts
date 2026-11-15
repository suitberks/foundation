import { defineConfig } from 'tsdown';

// TSDown configuration file, bundles the root entry as ESM and emits public TypeScript declarations.
// More details about TSDown configuration: https://tsdown.dev/reference/api/Interface.UserConfig;

const tsdownConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'esnext',

  dts: true,
  clean: true,
  unbundle: false, // ← Bundle all dependencies into the output files.
  fixedExtension: false, // ← Preserve package-compatible `.js` and `.d.ts` extensions.
});

export default tsdownConfig;
