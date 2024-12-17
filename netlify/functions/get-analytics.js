import fetch from 'node-fetch';

export const handler = async function(event, context) {
  console.log('[get-analytics] Début du handler');
  console.log('[get-analytics] Méthode HTTP:', event.httpMethod);

  // Activer CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // Gérer les requêtes OPTIONS pour CORS
  if (event.httpMethod === 'OPTIONS') {
    console.log('[get-analytics] Réponse CORS OPTIONS');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // URL de l'Apps Script
    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyMZOfv9dMBXdsopgnEj-tafXUNaDku_-oQFm1yilVeeHx38orSmppBNwBW8CGDv8daDQ/exec';
    
    console.log('[get-analytics] Tentative de connexion à:', SHEET_URL);
    
    // Options pour fetch
    const fetchOptions = {
      method: 'GET',
      timeout: 30000, // 30 secondes de timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Analytics-Dashboard/1.0',
      }
    };
    
    // Faire la requête à Google Apps Script
    const response = await fetch(SHEET_URL, fetchOptions);
    console.log('[get-analytics] Status de la réponse:', response.status);
    console.log('[get-analytics] Headers de la réponse:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[get-analytics] Contenu de l\'erreur:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[get-analytics] Type de données reçues:', typeof data);
    console.log('[get-analytics] Structure des données:', Object.keys(data));
    
    if (!data || !data.data) {
      throw new Error('Format de données invalide reçu de Google Apps Script');
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error('[get-analytics] Erreur détaillée:', error);
    console.error('[get-analytics] Stack trace:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: 'Erreur lors de la récupération des données',
        error: error.message,
        stack: error.stack
      })
    };
  }
};
