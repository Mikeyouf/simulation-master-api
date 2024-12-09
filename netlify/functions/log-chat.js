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
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:56736'
      },
      redirect: 'follow',
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
      console.error('Google Apps Script response:', responseData);
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseData}`);
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
        response: responseData
      })
    };
  } catch (error) {
    console.error('Error in log-chat function:', error);
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
        stack: error.stack
      })
    };
  }
};
