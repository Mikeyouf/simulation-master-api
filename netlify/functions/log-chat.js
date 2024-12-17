import fetch from 'node-fetch';

export const handler = async function(event, context) {
  console.log('[log-chat] Début du handler');
  console.log('[log-chat] Méthode HTTP:', event.httpMethod);
  
  // Vérifier la méthode
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    console.log('[log-chat] Corps de la requête:', event.body);
    const data = JSON.parse(event.body);
    console.log('[log-chat] Données parsées:', data);
    
    // Validation des données
    const requiredFields = ['timestamp', 'conversationId', 'botType', 'userId', 'message'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error('[log-chat] Champs manquants:', missingFields);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Données invalides',
          missingFields: missingFields
        })
      };
    }

    // URL de votre Google Apps Script
    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyMZOfv9dMBXdsopgnEj-tafXUNaDku_-oQFm1yilVeeHx38orSmppBNwBW8CGDv8daDQ/exec';
    console.log('[log-chat] Envoi des données à Google Apps Script');
    
    // Formater les données
    const formattedData = {
      action: 'logChat',
      timestamp: new Date(data.timestamp).toISOString(),
      conversationId: data.conversationId,
      botType: data.botType,
      userId: data.userId,
      message: data.message,
      sender: data.sender || 'user',
      responseTime: data.responseTime || 0,
      deviceInfo: JSON.stringify(data.deviceInfo || {})
    };
    
    console.log('[log-chat] Données formatées:', formattedData);
    
    // Envoyer les données au Google Sheet
    const response = await fetch(SHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Netlify-Function/1.0',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://script.google.com',
        'Referer': 'https://script.google.com/'
      },
      redirect: 'follow',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify(formattedData)
    });

    console.log('[log-chat] Status de la réponse:', response.status);
    console.log('[log-chat] Headers:', Object.fromEntries(response.headers));
    
    const responseData = await response.text();
    console.log('[log-chat] Réponse brute:', responseData);
    
    if (!response.ok) {
      console.error('[log-chat] Erreur Google Apps Script:', responseData);
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseData}`);
    }

    // Essayer de parser la réponse comme JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseData);
      console.log('[log-chat] Réponse parsée:', parsedResponse);
    } catch (e) {
      console.warn('[log-chat] La réponse n\'est pas du JSON valide:', responseData);
      parsedResponse = { message: responseData };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        message: 'Success',
        response: parsedResponse
      })
    };
  } catch (error) {
    console.error('[log-chat] Erreur complète:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};
