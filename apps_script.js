// Constantes globales pour les headers CORS
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json'
};

// Fonction pour gérer les requêtes OPTIONS (CORS preflight)
function doOptions(e) {
  const output = ContentService.createTextOutput();
  Object.keys(CORS_HEADERS).forEach(key => {
    output.addHeader(key, CORS_HEADERS[key]);
  });
  return output;
}

function doGet(e) {
  try {
    // Log les paramètres reçus
    console.log('Paramètres reçus:', JSON.stringify(e.parameter));
    
    // Récupérer toutes les données de la feuille
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Log le nombre total de lignes
    console.log('Nombre total de lignes:', data.length);
    
    // Convertir les données en format JSON
    const headers = data[0];
    const jsonData = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    // Log le nombre de lignes converties
    console.log('Nombre de lignes converties:', jsonData.length);
    
    // Traiter la requête analytics
    const response = handleAnalyticsRequest({
      timeRange: e.parameter.timeRange || '24h'
    });
    
    // Log la réponse finale
    console.log('Nombre de conversations dans la réponse:', response.recentConversations?.length);
    
    // Créer la réponse
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(response));
    
    // Ajouter les headers CORS
    output.addHeader('Access-Control-Allow-Origin', '*');
    output.addHeader('Access-Control-Allow-Methods', 'GET');
    output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return output;
  } catch (error) {
    console.error('Erreur dans doGet:', error);
    return createErrorResponse(error);
  }
}

function doPost(e) {
  try {
    // Ajouter les headers CORS directement dans la réponse
    const output = ContentService.createTextOutput();
    Object.keys(CORS_HEADERS).forEach(key => {
      output.addHeader(key, CORS_HEADERS[key]);
    });

    // Vérifier que nous avons des données POST
    if (!e.postData || !e.postData.contents) {
      throw new Error('Aucune donnée POST reçue');
    }

    console.log('Received POST request');
    const data = JSON.parse(e.postData.contents);
    console.log('POST data:', JSON.stringify(data));

    if (!data.action) {
      throw new Error('Action non spécifiée');
    }

    let responseData;
    if (data.action === 'getAnalytics') {
      responseData = handleAnalyticsRequest(data);
    } else if (data.action === 'logChat') {
      responseData = handleLogChat(data);
    } else {
      throw new Error('Action non reconnue: ' + data.action);
    }

    output.setContent(JSON.stringify(responseData));
    output.setMimeType(ContentService.MimeType.JSON);
    
    return output;
  } catch(error) {
    console.error('Error in doPost:', error);
    return createErrorResponse(error);
  }
}

function handleAnalyticsRequest(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Log le nombre total de lignes
    console.log('handleAnalyticsRequest - Nombre total de lignes:', data.length);
    
    // Convertir en format JSON avec les en-têtes
    const headers = data[0];
    const jsonData = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Pour les timestamps, convertir en format ISO string
        if (header === 'Timestamp' && row[index] instanceof Date) {
          obj[header] = row[index].toISOString();
        } else {
          obj[header] = row[index] !== undefined && row[index] !== null ? row[index].toString() : '';
        }
      });
      return obj;
    }).filter(row => row['Timestamp'] && row['Conversation ID']);

    // Log les données converties
    console.log('handleAnalyticsRequest - Données converties:', jsonData.length);

    // Récupérer toutes les conversations
    const conversations = getRecentConversations(jsonData);
    console.log('handleAnalyticsRequest - Conversations récupérées:', conversations.length);

    // Calculer le nombre total de conversations uniques
    const uniqueConversationIds = new Set(conversations.map(item => item.conversationId));
    const totalConversations = uniqueConversationIds.size;

    // Calculer le nombre de messages aujourd'hui
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayMessages = conversations.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate.getTime() >= today.getTime();
    }).length;
    console.log('handleAnalyticsRequest - Messages aujourd\'hui:', todayMessages);

    // Calculer le nombre d'utilisateurs uniques
    const uniqueUsers = new Set(conversations.map(item => item.userId).filter(id => id));

    // Calculer les messages par bot
    const messagesByBot = {};
    conversations.forEach(item => {
      if (item.sender === 'bot' && item.botType) {
        const botType = item.botType.trim();
        messagesByBot[botType] = (messagesByBot[botType] || 0) + 1;
      }
    });

    // Calculer l'activité par heure
    const activityByHour = Array(24).fill(0).map((_, hour) => {
      const count = conversations.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate.getHours() === hour;
      }).length;
      return { hour, count };
    });

    // Créer la réponse
    const response = {
      status: 'success',
      totalConversations,
      todayMessages,
      uniqueUsers: uniqueUsers.size,
      messagesByBot,
      activityByHour,
      recentConversations: conversations,
      timestamp: now.toISOString()
    };

    console.log('handleAnalyticsRequest - Réponse générée:', {
      totalConversations,
      todayMessages,
      uniqueUsers: uniqueUsers.size,
      botTypes: Object.keys(messagesByBot)
    });

    return response;
  } catch (error) {
    console.error('Erreur dans handleAnalyticsRequest:', error);
    return createErrorResponse(error);
  }
}

function handleLogChat(data) {
  try {
    // Valider les données requises
    if (!data.conversationId || !data.message) {
      throw new Error('Données requises manquantes (conversationId ou message)');
    }

    // Vérifier si le message avec cet ID a déjà été enregistré
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const dataRange = sheet.getDataRange();
    const dataValues = dataRange.getValues();
    const headers = dataValues[0];
    const messageIdIndex = headers.indexOf('Message ID');
    
    // Si la colonne Message ID n'existe pas, l'ajouter
    if (messageIdIndex === -1) {
      headers.push('Message ID');
      sheet.getRange(1, headers.length).setValue('Message ID');
    }

    // Vérifier si ce message existe déjà
    if (messageIdIndex !== -1 && dataValues.some(row => row[messageIdIndex] === data.messageId)) {
      console.log('Message déjà enregistré, ignoré:', data.messageId);
      return createSuccessResponse('Message déjà enregistré');
    }

    console.log('handleLogChat - Données reçues:', JSON.stringify({
      messageId: data.messageId,
      timestamp: new Date().toISOString(),
      conversationId: data.conversationId,
      botType: data.botType,
      messagePreview: data.message.substring(0, 50),
      sender: data.sender,
      userId: data.userId
    }));
    
    const row = [
      new Date().toISOString(),  // Timestamp
      data.conversationId,       // Conversation ID
      data.botType || '',        // Bot Type
      data.message || '',        // Message Content
      data.sender || '',         // Sender
      data.userId || '',         // User ID
      data.deviceInfo || '',     // Device Info
      data.messageId || ''       // Message ID
    ];

    sheet.appendRow(row);
    console.log('handleLogChat - Message enregistré avec succès');
    
    return createSuccessResponse('Message enregistré avec succès');
  } catch (error) {
    console.error('Error in handleLogChat:', error);
    return createErrorResponse(error);
  }
}

function getRecentConversations(data) {
  // Filtrer et valider les données
  const validData = data.filter(item => {
    if (!item['Timestamp'] || !item['Conversation ID']) return false;
    
    try {
      const itemDate = new Date(item['Timestamp']);
      return !isNaN(itemDate.getTime());
    } catch (error) {
      console.warn('Date invalide ignorée:', item['Timestamp']);
      return false;
    }
  });
  
  // Trier par date décroissante
  validData.sort((a, b) => {
    const dateA = new Date(a['Timestamp']);
    const dateB = new Date(b['Timestamp']);
    return dateB - dateA;
  });
  
  // Convertir en format uniforme
  return validData.map(item => ({
    timestamp: item['Timestamp'],
    conversationId: item['Conversation ID'],
    botType: item['Bot Type'] || '',
    userId: item['User ID'] || '',
    message: item['Message Content'] || '',
    sender: item['Sender'] || '',
    deviceInfo: item['Device Info'] || ''
  }));
}

function calculateActivityByHour(data) {
  const hourCounts = new Array(24).fill(0);
  
  data.forEach(item => {
    try {
      const date = new Date(item.timestamp);
      if (!isNaN(date.getTime())) {
        const hour = date.getHours();
        hourCounts[hour]++;
      }
    } catch (error) {
      console.warn('Erreur lors du calcul de l\'activité horaire:', error);
    }
  });
  
  return Array.from({length: 24}, (_, hour) => ({
    hour,
    count: hourCounts[hour]
  }));
}

function createSuccessResponse(message) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  const response = {
    status: 'success',
    message: message,
    timestamp: new Date().toISOString()
  };
  
  output.setContent(JSON.stringify(response));
  
  // Ajouter les headers CORS
  Object.keys(CORS_HEADERS).forEach(key => {
    output.addHeader(key, CORS_HEADERS[key]);
  });
  
  return output;
}

function createErrorResponse(error) {
  const output = ContentService.createTextOutput();
  const response = JSON.stringify({
    status: 'error',
    error: error.toString(),
    details: error.stack || 'No stack trace available',
    timestamp: new Date().toISOString()
  });
  
  output.setContent(response);
  output.setMimeType(ContentService.MimeType.JSON);
  
  Object.keys(CORS_HEADERS).forEach(key => {
    output.addHeader(key, CORS_HEADERS[key]);
  });
  
  return output;
}