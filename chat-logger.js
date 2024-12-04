// Fonction pour générer un UUID unique pour chaque conversation
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Gestionnaire de logs de chat
class ChatLogger {
  constructor() {
    this.conversationId = localStorage.getItem('currentConversationId') || generateUUID();
    localStorage.setItem('currentConversationId', this.conversationId);
    this.messageQueue = [];
    this.failedLogs = JSON.parse(localStorage.getItem('failedLogs') || '[]');
  }

  async logMessage(botType, message, sender, responseTime = 0) {
    const logData = {
      conversationId: this.conversationId,
      timestamp: new Date().toISOString(),
      botType,
      userId: localStorage.getItem('userId'),
      message: this.sanitizeMessage(message),
      sender,
      responseTime,
      deviceInfo: navigator.userAgent
    };

    // Sauvegarder dans le localStorage
    this.saveToLocalStorage(logData);

    // Essayer d'envoyer au serveur
    try {
      const response = await fetch('/.netlify/functions/log-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      });

      if (!response.ok) {
        throw new Error('Failed to log message');
      }
    } catch (error) {
      console.error('Error logging message:', error);
      this.handleFailedLog(logData);
    }
  }

  sanitizeMessage(message) {
    return typeof message === 'string' ? message.substring(0, 1000) : String(message).substring(0, 1000);
  }

  saveToLocalStorage(logData) {
    const logs = JSON.parse(localStorage.getItem('chatLogs') || '[]');
    logs.push(logData);
    // Garder seulement les 100 derniers messages
    if (logs.length > 100) {
      logs.shift();
    }
    localStorage.setItem('chatLogs', JSON.stringify(logs));
  }

  handleFailedLog(logData) {
    this.failedLogs.push(logData);
    if (this.failedLogs.length > 50) {
      this.failedLogs.shift();
    }
    localStorage.setItem('failedLogs', JSON.stringify(this.failedLogs));
  }

  // Réessayer d'envoyer les logs échoués
  async retryFailedLogs() {
    const failedLogs = [...this.failedLogs];
    this.failedLogs = [];
    
    for (const logData of failedLogs) {
      try {
        const response = await fetch('/.netlify/functions/log-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logData)
        });

        if (!response.ok) {
          throw new Error('Failed to log message');
        }
      } catch (error) {
        this.failedLogs.push(logData);
      }
    }

    localStorage.setItem('failedLogs', JSON.stringify(this.failedLogs));
  }

  startNewConversation() {
    this.conversationId = generateUUID();
    localStorage.setItem('currentConversationId', this.conversationId);
  }
}

export const chatLogger = new ChatLogger();
