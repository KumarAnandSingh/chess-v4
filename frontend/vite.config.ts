import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development'
  const backendUrl = isDevelopment
    ? 'http://localhost:3001'
    : process.env.VITE_BACKEND_URL || 'http://localhost:3001'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            chess: ['chess.js', 'react-chessboard'],
            socket: ['socket.io-client'],
            ui: ['framer-motion', 'lucide-react', 'react-hot-toast'],
          },
        },
      },
      target: 'es2020',
      minify: 'esbuild',
    },
    server: {
      port: 3000,
      host: true,
      proxy: isDevelopment ? {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
        },
      } : undefined,
    },
    preview: {
      port: 3000,
      host: true,
    },
    define: {
      // Make environment variables available at build time
      __BACKEND_URL__: JSON.stringify(process.env.VITE_BACKEND_URL || backendUrl),
      __NODE_ENV__: JSON.stringify(mode),
    },
  }
})