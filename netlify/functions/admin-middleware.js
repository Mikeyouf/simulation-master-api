import { readFileSync } from 'fs';
import { join } from 'path';

export const handler = async (event, context) => {
  // Vérifier si c'est une requête pour la page admin
  if (event.path === '/admin' || event.path === '/admin.html' || event.path === '/.netlify/functions/admin-middleware') {
    try {
      // Utiliser un chemin absolu pour le fichier admin.html
      const projectRoot = process.cwd();
      const adminPath = join(projectRoot, 'admin.html');
      console.log('Trying to read file from:', adminPath);

      const content = readFileSync(adminPath, 'utf8');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache'
        },
        body: content
      };
    } catch (error) {
      console.error('Error reading admin.html:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Error loading admin page', 
          details: error.message,
          path: join(process.cwd(), 'admin.html')
        })
      };
    }
  }

  // Pour les requêtes d'assets (JS, CSS, etc.)
  if (event.path.endsWith('.js')) {
    try {
      const projectRoot = process.cwd();
      const filePath = join(projectRoot, event.path);
      console.log('Trying to read JS file from:', filePath);

      const content = readFileSync(filePath, 'utf8');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache'
        },
        body: content
      };
    } catch (error) {
      console.error(`Error reading ${event.path}:`, error);
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'File not found',
          path: join(process.cwd(), event.path)
        })
      };
    }
  }

  // Pour toutes les autres requêtes
  return {
    statusCode: 404,
    body: JSON.stringify({ 
      error: 'Not found',
      path: event.path 
    })
  };
};
