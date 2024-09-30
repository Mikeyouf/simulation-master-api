// pompier.js
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

  const sendMessage = async () => {
    const userMessage = chatInput.value;
    if (userMessage) {
      chatOutput.innerHTML += `<p><strong>Vous:</strong> ${userMessage}</p>`;
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
          const botResponse = data.botResponse;
          existingThreadId = data.threadId;
          chatOutput.innerHTML += `<p><strong>Pompier:</strong> ${botResponse}</p>`;
        } else {
          const errorText = await response.text();
          chatOutput.innerHTML += `<p><strong>Erreur:</strong> ${errorText}</p>`;
        }
      } catch (error) {
        chatOutput.innerHTML += `<p><strong>Erreur:</strong> Erreur de communication avec l'assistant</p>`;
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