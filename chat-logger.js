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
    this.processedMessageIds = new Set();
    
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
    const messageId = generateUUID();
    const logData = {
      messageId,
      conversationId: this.conversationId,
      timestamp: new Date().toISOString(),
      botType,
      userId: localStorage.getItem('userId'),
      message: this.sanitizeMessage(message),
      sender,
      responseTime,
      deviceInfo: navigator.userAgent
    };

    // Vérifier si ce message a déjà été traité
    if (this.processedMessageIds.has(messageId)) {
      console.log('Message déjà traité, ignoré:', messageId);
      return;
    }

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
          if (!this.processedMessageIds.has(logData.messageId)) {
            await this.sendToServer(logData);
            this.processedMessageIds.add(logData.messageId);
            
            // Limiter la taille du Set pour éviter une croissance infinie
            if (this.processedMessageIds.size > 1000) {
              const idsArray = Array.from(this.processedMessageIds);
              this.processedMessageIds = new Set(idsArray.slice(-500));
            }
          }
        }

        // Traiter les logs échoués
        if (this.failedLogs.length > 0) {
          const logData = this.failedLogs.shift();
          if (!this.processedMessageIds.has(logData.messageId)) {
            await this.sendToServer(logData);
            this.processedMessageIds.add(logData.messageId);
          }
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
        // Ne stocker dans failedLogs que si le message n'a pas déjà été traité
        if (!this.processedMessageIds.has(logData.messageId)) {
          this.failedLogs.push(logData);
          if (this.failedLogs.length > 50) {
            this.failedLogs.shift();
          }
        }
        return;
      }
    } catch (error) {
      // Ne stocker dans failedLogs que si le message n'a pas déjà été traité
      if (!this.processedMessageIds.has(logData.messageId)) {
        this.failedLogs.push(logData);
        if (this.failedLogs.length > 50) {
          this.failedLogs.shift();
        }
      }
    }
  }

  startNewConversation() {
    this.conversationId = generateUUID();
    localStorage.setItem('currentConversationId', this.conversationId);
  }
}

export const chatLogger = new ChatLogger();
