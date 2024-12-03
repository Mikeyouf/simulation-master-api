// vite.config.js
export default {
  optimizeDeps: {
    include: ['glider-js'] // Pour forcer l'inclusion de Glider.js
  },
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/\.netlify\/functions/, '')
      }
    }
  }
}