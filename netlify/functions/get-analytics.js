const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Activer CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gérer les requêtes OPTIONS pour CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { timeRange = '24h' } = event.queryStringParameters || {};

    // URL de votre Google Apps Script
    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyMZOfv9dMBXdsopgnEj-tafXUNaDku_-oQFm1yilVeeHx38orSmppBNwBW8CGDv8daDQ/exec';

    console.log('Fetching data from:', SHEET_URL);
    console.log('Time range:', timeRange);

    // Récupérer les données depuis Google Sheets
    const response = await fetch(`${SHEET_URL}?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Google Sheets response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();
    console.log('Received data:', JSON.stringify(rawData).slice(0, 200) + '...');

    if (!Array.isArray(rawData)) {
      console.error('Unexpected data format:', rawData);
      throw new Error('Invalid data format received from Google Sheets');
    }

    // Traiter les données pour le dashboard
    const processedData = processData(rawData, timeRange);
    console.log('Processed data:', JSON.stringify(processedData).slice(0, 200) + '...');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(processedData)
    };

  } catch (error) {
    console.error('Error in get-analytics:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error fetching analytics data',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

function processData(rawData, timeRange) {
  console.log('Processing data, count:', rawData.length);

  // Calculer les statistiques
  const messagesByBot = {};
  const activityByHour = new Array(24).fill(0);
  const uniqueUsers = new Set();
  let totalResponseTime = 0;
  let messageCount = 0;

  rawData.forEach(message => {
    try {
      // Messages par bot
      if (message.botType) {
        messagesByBot[message.botType] = (messagesByBot[message.botType] || 0) + 1;
      }

      // Activité par heure
      if (message.timestamp) {
        const hour = new Date(message.timestamp).getHours();
        if (!isNaN(hour)) {
          activityByHour[hour]++;
        }
      }

      // Utilisateurs uniques
      if (message.userId) {
        uniqueUsers.add(message.userId);
      }

      // Temps de réponse moyen
      if (message.responseTime && !isNaN(message.responseTime)) {
        totalResponseTime += parseFloat(message.responseTime);
        messageCount++;
      }
    } catch (error) {
      console.error('Error processing message:', error, message);
    }
  });

  // Formater les données pour les graphiques
  const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
  
  const result = {
    totalConversations: new Set(rawData.filter(m => m.conversationId).map(m => m.conversationId)).size,
    todayMessages: rawData.filter(m => {
      try {
        const messageDate = new Date(m.timestamp);
        const today = new Date();
        return messageDate.toDateString() === today.toDateString();
      } catch (error) {
        console.error('Error processing message date:', error, m);
        return false;
      }
    }).length,
    avgResponseTime: messageCount ? totalResponseTime / messageCount : 0,
    uniqueUsers: uniqueUsers.size,
    messagesByBot,
    activityByHour: {
      hours,
      counts: activityByHour
    },
    recentConversations: rawData
      .filter(m => m.timestamp && m.conversationId) // Filtrer les messages valides
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
  };

  console.log('Processed result:', JSON.stringify(result).slice(0, 200) + '...');
  return result;
}
