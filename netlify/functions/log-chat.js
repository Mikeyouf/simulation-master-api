const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Vérifier la méthode
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // URL de votre Google Apps Script
    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyMZOfv9dMBXdsopgnEj-tafXUNaDku_-oQFm1yilVeeHx38orSmppBNwBW8CGDv8daDQ/exec';
    
    // Envoyer les données au Google Sheet
    const response = await fetch(SHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timestamp: data.timestamp,
        conversationId: data.conversationId,
        botType: data.botType,
        userId: data.userId,
        message: data.message,
        sender: data.sender,
        responseTime: data.responseTime,
        deviceInfo: data.deviceInfo
      })
    });

    const responseData = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Success',
        response: responseData
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Error logging chat', 
        error: error.message 
      })
    };
  }
};
