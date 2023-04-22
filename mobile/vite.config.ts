import {defineConfig, UserConfigExport} from 'vite';

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
    }
  };

  return config;
});
