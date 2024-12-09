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
    this.failedLogs = [];
    this.isProcessing = false;
    
    // Charger les logs échoués du localStorage une seule fois
    const storedFailedLogs = localStorage.getItem('failedLogs');
    if (storedFailedLogs) {
      this.failedLogs = JSON.parse(storedFailedLogs);
      localStorage.removeItem('failedLogs'); // Les supprimer du localStorage
    }
    
    // Démarrer le traitement des messages en arrière-plan
    this.startMessageProcessor();
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

    // Ajouter à la queue de messages
    this.messageQueue.push(logData);
  }

  sanitizeMessage(message) {
    return typeof message === 'string' ? message.substring(0, 1000) : String(message).substring(0, 1000);
  }

  async startMessageProcessor() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    while (true) {
      try {
        // Traiter les messages en attente
        while (this.messageQueue.length > 0) {
          const logData = this.messageQueue.shift();
          await this.sendToServer(logData);
        }

        // Traiter les logs échoués
        if (this.failedLogs.length > 0) {
          const logData = this.failedLogs.shift();
          await this.sendToServer(logData);
        }

        // Pause avant la prochaine itération
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error in message processor:', error);
      }
    }
  }

  async sendToServer(logData) {
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
      if (this.failedLogs.length > 50) {
        this.failedLogs.shift();
      }
    }
  }

  startNewConversation() {
    this.conversationId = generateUUID();
    localStorage.setItem('currentConversationId', this.conversationId);
  }
}

export const chatLogger = new ChatLogger();
