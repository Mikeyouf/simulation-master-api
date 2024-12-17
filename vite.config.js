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
  },
  // Configuration pour servir admin.html sur la route /admin
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html'
      }
    }
  }
}