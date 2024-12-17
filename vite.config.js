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
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html'
      }
    },
    // Assurer que les assets sont correctement générés
    assetsDir: 'assets',
    // Générer des sourcemaps pour le débogage
    sourcemap: true
  }
}