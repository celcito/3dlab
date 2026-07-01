import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/.venv/**',
          '**/venv/**',
          '**/__pycache__/**',
          '**/node_modules/**',
          '**/dist/**',
          '**/tmp/**',
          '**/projects/**',
          '**/.git/**',
          '**/python/venv/**',
        ],
      },
    },
  };
});
