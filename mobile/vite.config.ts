/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import {defineConfig, UserConfigExport} from 'vite'

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
        injectRegister: 'inline',
        registerType: 'autoUpdate',
        srcDir: 'src',
        filename: 'sw.ts',
        mode: isDevMode?'development':'production',
        minify: !isDevMode,
        workbox: {
          mode: isDevMode?'development':'production',
          sourcemap: isDevMode,
          swDest: 'sw.js',
        },
        manifest: {
          name: "Voxxrin - Your conference companion",
          short_name: "Voxxrin",
          start_url: "index.html",
          display: "standalone",
          icons: [{
            src: "assets/imgs/logo.png",
            sizes: "512x512",
            type: "image/png"
          }],
          background_color: "#E30A63",
          theme_color: "#E30A63"
        }
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
      minify: !isDevMode,
      emptyOutDir: true,
      sourcemap: isDevMode?'inline':false
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
