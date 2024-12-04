import FingerprintJS from '@fingerprintjs/fingerprintjs';
import './style.css';
import { chatLogger } from './chat-logger.js';

document.addEventListener('DOMContentLoaded', async function () {
  const chatInput = document.getElementById('chat-input-5');
  const chatOutput = document.getElementById('chat-output-5');
  const envoyerBtn = document.getElementById('envoyer-btn-5');
  const ASSISTANT_ID_CITOYEN3 = 'asst_TOUKhERXwfs3BN387LIXmodn'; // À remplacer par l'ID correct
  const MAX_MESSAGES = 2000;

  let userId = localStorage.getItem('userId');
  if (!userId) {
    const fpPromise = FingerprintJS.load();
    const fp = await fpPromise;
    const result = await fp.get();
    userId = result.visitorId;
    localStorage.setItem('userId', userId);
  }

  const historyKey = `chatbotHistory_${userId}_${ASSISTANT_ID_CITOYEN3}`;
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
      // Afficher et sauvegarder le message utilisateur
      chatOutput.innerHTML += `<p class="user-message">${userMessage}</p>`;
      saveMessage('user', userMessage);
      await chatLogger.logMessage('citoyen-3', userMessage, 'user');
      chatInput.value = '';
      scrollToBottom();

      // Afficher l'indicateur de chargement
      chatOutput.innerHTML += `
        <p class="bot-message typing">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </p>`;
      scrollToBottom();

      const startTime = Date.now();
      
      try {
        const response = await fetch('/.netlify/functions/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage,
            thread_id: existingThreadId,
            assistant_id: ASSISTANT_ID_CITOYEN3,
            user_id: userId,
          }),
        });

        // Supprimer l'animation des points
        const typingBubble = chatOutput.querySelector('.typing');
        if (typingBubble) {
          typingBubble.remove();
        }

        if (response.ok) {
          const data = await response.json();
          let botResponse = data.botResponse;
          botResponse = cleanResponse(botResponse);

          existingThreadId = data.threadId;

          // Afficher et sauvegarder la réponse du bot
          chatOutput.innerHTML += `<p class="bot-message">${botResponse}</p>`;
          saveMessage('bot', botResponse);
          const responseTime = Date.now() - startTime;
          await chatLogger.logMessage('citoyen-3', botResponse, 'bot', responseTime);
          scrollToBottom();
        } else {
          const errorText = await response.text();
          chatOutput.innerHTML += `<p class="bot-message"><strong>Erreur:</strong> ${errorText}</p>`;
        }
      } catch (error) {
        // Supprimer l'animation des points en cas d'erreur
        const typingBubble = chatOutput.querySelector('.typing');
        if (typingBubble) {
          typingBubble.remove();
        }
        chatOutput.innerHTML += `<p class="bot-message"><strong>Erreur:</strong> Erreur de communication avec l'assistant</p>`;
        console.error('Erreur lors de l\'envoi du message:', error);
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
