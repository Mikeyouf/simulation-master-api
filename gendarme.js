import FingerprintJS from '@fingerprintjs/fingerprintjs';
import './style.css';
import { chatLogger } from './chat-logger.js';

document.addEventListener('DOMContentLoaded', async function () {
  const chatInput = document.getElementById('chat-input-2');
  const chatOutput = document.getElementById('chat-output-2');
  const envoyerBtn = document.getElementById('envoyer-btn-2');
  const ASSISTANT_ID_GENDARME = 'asst_TOUKhERXwfs3BN387LIXmodn';
  const MAX_MESSAGES = 2000; // Limite de messages à stocker dans le localStorage

  // Fonction pour récupérer ou générer l'ID utilisateur avec FingerprintJS
  let userId = localStorage.getItem('userId');
  if (!userId) {
    const fpPromise = FingerprintJS.load();
    const fp = await fpPromise;
    const result = await fp.get();
    userId = result.visitorId;
    localStorage.setItem('userId', userId);
  }

  const historyKey = `chatbotHistory_${userId}_${ASSISTANT_ID_GENDARME}`;
  let existingThreadId = null;

  // Fonction pour charger l'historique des messages depuis le localStorage
  function loadHistory() {
    const history = JSON.parse(localStorage.getItem(historyKey)) || [];
    history.forEach(msg => {
      const messageHtml = `<p class="${msg.sender === 'user' ? 'user-message' : 'bot-message'}">${msg.text}</p>`;
      chatOutput.innerHTML += messageHtml;
    });
    scrollToBottom();
  }

  // Fonction pour sauvegarder les messages dans le localStorage avec gestion de la limite
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

  // Fonction pour supprimer les annotations de type [source] et autres balises JSON
  function cleanResponse(text) {
    // Supprimer les annotations OpenAI
    const cleanedText = text.replace(/【\d+:\d+†[^\]]+】/g, '').trim();

    // Remplacer les formats Markdown [texte](lien) par des liens HTML corrects
    const formattedText = cleanedText.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    return formattedText;
  }

  // Fonction pour faire défiler jusqu'en bas
  function scrollToBottom() {
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  const sendMessage = async () => {
    const userMessage = chatInput.value;
    if (userMessage) {
      // Afficher et sauvegarder le message utilisateur
      chatOutput.innerHTML += `<p class="user-message">${userMessage}</p>`;
      saveMessage('user', userMessage);
      await chatLogger.logMessage('Cartographie et logiciel', userMessage, 'user');
      chatInput.value = '';
      scrollToBottom();

      try {
        // Afficher l'animation pendant l'appel API
        chatOutput.innerHTML += `
          <p class="bot-message typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </p>`;
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
            assistant_id: ASSISTANT_ID_GENDARME,
            user_id: userId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let botResponse = data.botResponse;
          botResponse = cleanResponse(botResponse);

          existingThreadId = data.threadId;

          // Remplacer l'animation par la réponse du bot
          const messages = chatOutput.getElementsByClassName('bot-message');
          const lastMessage = messages[messages.length - 1];
          lastMessage.innerHTML = `<p class="bot-message">${botResponse}</p>`;
          lastMessage.classList.remove('typing');

          saveMessage('bot', botResponse);
          const responseTime = Date.now() - startTime;
          await chatLogger.logMessage('Cartographie et logiciel', botResponse, 'bot', responseTime);
          scrollToBottom();
        } else {
          const errorText = await response.text();
          const messages = chatOutput.getElementsByClassName('bot-message');
          const lastMessage = messages[messages.length - 1];
          lastMessage.innerHTML = `<strong>Erreur:</strong> ${errorText}`;
        }
      } catch (error) {
        const messages = chatOutput.getElementsByClassName('bot-message');
        const lastMessage = messages[messages.length - 1];
        lastMessage.innerHTML = `<strong>Erreur:</strong> Erreur de communication avec l'assistant`;
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    }
  };

  // Charger l'historique des messages dès le chargement de la page
  loadHistory();

  envoyerBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
});