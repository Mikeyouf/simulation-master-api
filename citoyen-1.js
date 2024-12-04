import FingerprintJS from '@fingerprintjs/fingerprintjs';
import './style.css';
import { chatLogger } from './chat-logger.js';

document.addEventListener('DOMContentLoaded', async function () {
  const chatInput = document.getElementById('chat-input-3');
  const chatOutput = document.getElementById('chat-output-3');
  const envoyerBtn = document.getElementById('envoyer-btn-3');
  const ASSISTANT_ID_CITOYEN1 = 'asst_oXdnV0k7kJN6kqLNQZnEnxuv';
  const MAX_MESSAGES = 2000;

  let userId = localStorage.getItem('userId');
  if (!userId) {
    const fpPromise = FingerprintJS.load();
    const fp = await fpPromise;
    const result = await fp.get();
    userId = result.visitorId;
    localStorage.setItem('userId', userId);
  }

  const historyKey = `chatbotHistory_${userId}_${ASSISTANT_ID_CITOYEN1}`;
  let existingThreadId = null;

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem(historyKey)) || [];
    history.forEach(msg => {
      const messageHtml = `<p class="${msg.sender === 'user' ? 'user-message' : 'bot-message'}">${msg.text}</p>`;
      chatOutput.innerHTML += messageHtml;
    });
    scrollToBottom();
  }

  function saveMessage(sender, text) {
    let history = JSON.parse(localStorage.getItem(historyKey)) || [];
    if (history.length >= MAX_MESSAGES) {
      history.shift(); // Supprime le message le plus ancien si la limite est atteinte
    }
    history.push({
      sender,
      text
    });
    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  function cleanResponse(text) {
    // Supprimer les annotations de type [source]
    text = text.replace(/\[source\][^\]]*\]/g, '');
    // Supprimer les balises JSON
    text = text.replace(/```json[\s\S]*?```/g, '');
    text = text.replace(/```[\s\S]*?```/g, '');
    return text.trim();
  }

  function scrollToBottom() {
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  const sendMessage = async () => {
    const userMessage = chatInput.value;
    if (userMessage) {
      // Afficher le message utilisateur
      chatOutput.innerHTML += `<p class="user-message">${userMessage}</p>`;
      saveMessage('user', userMessage);
      
      // Logger le message de manière asynchrone
      chatLogger.logMessage('Météo', userMessage, 'user').catch(console.error);
      
      chatInput.value = '';
      scrollToBottom();

      try {
        // Afficher l'animation pendant l'appel API
        const typingBubble = document.createElement('p');
        typingBubble.className = 'bot-message typing-bubble';
        typingBubble.innerHTML = '<span></span><span></span><span></span>';
        chatOutput.appendChild(typingBubble);
        scrollToBottom();

        const startTime = Date.now();
        const response = await fetch('/.netlify/functions/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage,
            thread_id: existingThreadId,
            assistant_id: ASSISTANT_ID_CITOYEN1,
            user_id: userId,
          }),
        });

        // Supprimer l'animation des points
        typingBubble.remove();

        if (response.ok) {
          const data = await response.json();
          let botResponse = cleanResponse(data.botResponse);
          existingThreadId = data.threadId;

          // Afficher la réponse du bot
          chatOutput.innerHTML += `<p class="bot-message">${botResponse}</p>`;
          saveMessage('bot', botResponse);
          
          // Logger la réponse du bot de manière asynchrone
          const responseTime = Date.now() - startTime;
          chatLogger.logMessage('Météo', botResponse, 'bot', responseTime).catch(console.error);
          
          scrollToBottom();
        } else {
          throw new Error('Failed to get response');
        }
      } catch (error) {
        console.error('Error:', error);
        chatOutput.innerHTML += `<p class="error-message">Désolé, une erreur s'est produite.</p>`;
        scrollToBottom();
      }
    }
  };

  // Charger l'historique des messages dès le chargement de la page
  loadHistory();

  envoyerBtn.addEventListener('click', sendMessage);

  chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});
