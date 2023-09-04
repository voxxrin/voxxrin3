/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import {defineConfig, UserConfigExport} from 'vite'
import manifestConfig from './manifest-config.json'

const forceSourcemaps = process.env.FORCE_SOURCEMAPS === 'true';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDevMode = mode === 'dev'
  const config: UserConfigExport = {
    plugins: [
      vue(),
      VitePWA({
        devOptions: {
          enabled: isDevMode,
          type: 'module'
        },
        strategies: 'injectManifest',
        injectRegister: null,
        registerType: 'prompt',
        includeAssets: ['favicon.png'],
        srcDir: 'src',
        filename: 'sw.ts',
        mode: isDevMode?'development':'production',
        minify: !isDevMode && !forceSourcemaps,
        selfDestroying: false,
        workbox: {
          mode: isDevMode?'development':'production',
          sourcemap: isDevMode || forceSourcemaps,
          swDest: 'sw.js',
        },
        manifest: manifestConfig
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    root: '.',
    build: {
      outDir: './dist',
      minify: !isDevMode && !forceSourcemaps,
      emptyOutDir: true,
      sourcemap: (isDevMode || forceSourcemaps)?'inline':false
    },
    server: {
      host: '0.0.0.0'
    },
    test: {
      environment: 'jsdom'
    }
  };

  return config;
})
