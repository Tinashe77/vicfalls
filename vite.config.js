import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Include JS files for JSX transformation
      include: "**/*.{js,jsx}"
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Ensure this points to your `src` directory
    },
    extensions: ['.js', '.jsx', '.json'] // Add extensions to resolve
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://econet-marathon-api.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});