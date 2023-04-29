import {defineConfig, UserConfigExport} from 'vite';
import dynamicImport from "vite-plugin-dynamic-import";

export default defineConfig(({ command, mode }) => {
  const isDevMode = mode === 'dev'
  const config: UserConfigExport = {
    root: './src',
    build: {
      outDir: '../dist',
      minify: !isDevMode,
      emptyOutDir: true,
      sourcemap: isDevMode?'inline':false
    },
    server: {
      host: '0.0.0.0'
    },
    plugins: [
        dynamicImport({
          filter: (id: string) => {
            // `node_modules` is exclude by default, so we need to include it explicitly
            if (id.includes('node_modules/@ionic')) {
              return true
            }
          }
        })
    ]
  };

  return config;
});
