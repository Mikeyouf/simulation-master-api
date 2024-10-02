// gendarme.js
import './style.css';

document.addEventListener('DOMContentLoaded', function () {
  const chatInput = document.getElementById('chat-input-2');
  const chatOutput = document.getElementById('chat-output-2');
  const envoyerBtn = document.getElementById('envoyer-btn-2');

  const ASSISTANT_ID_GENDARME = 'asst_TOUKhERXwfs3BN387LIXmodn';

  let existingThreadId = null;

  function scrollToBottom() {
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // Fonction pour supprimer les annotations de type  
  function cleanResponse(text) {
    // Remplacement des annotations de type  
    return text.replace(/【\d+:\d+†source】/g, '');
  }

  const sendMessage = async () => {
    const userMessage = chatInput.value;
    if (userMessage) {
      // Ajoute un message utilisateur avec la classe correspondante
      chatOutput.innerHTML += `<p class="user-message"><strong>Vous:</strong> ${userMessage}</p>`;
      chatInput.value = '';
      scrollToBottom();

      try {
        const response = await fetch('/.netlify/functions/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage,
            thread_id: existingThreadId,
            assistant_id: ASSISTANT_ID_GENDARME,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let botResponse = data.botResponse;

          // Nettoyage de la réponse pour retirer les annotations de type [source]
          botResponse = cleanResponse(botResponse);

          existingThreadId = data.threadId;
          // Ajoute un message du bot avec la classe correspondante
          chatOutput.innerHTML += `<p class="bot-message"><strong>Pompier:</strong> ${botResponse}</p>`;
          scrollToBottom();
        } else {
          const errorText = await response.text();
          chatOutput.innerHTML += `<p class="bot-message"><strong>Erreur:</strong> ${errorText}</p>`;
        }
      } catch (error) {
        chatOutput.innerHTML += `<p class="bot-message"><strong>Erreur:</strong> Erreur de communication avec l'assistant</p>`;
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    }
  };

  envoyerBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
});