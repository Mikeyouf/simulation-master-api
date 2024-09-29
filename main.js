import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';
import './style.css';

document.addEventListener('DOMContentLoaded', function () {
  // Initialisation du carrousel Swiper (si besoin)
  const swiper = new Swiper('.swiper', {
    slidesPerView: 1,
    spaceBetween: 10,
    centeredSlides: true,
    loop: true,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    breakpoints: {
      992: {
        slidesPerView: 3,
        spaceBetween: 30,
      },
    },
  });

  // Gestion du chatbot
  const chatInput = document.getElementById('chat-input-1');
  const chatOutput = document.getElementById('chat-output-1');
  const envoyerBtn = document.getElementById('envoyer-btn-1');

  let existingThreadId = null; // Initialisez à null au début

  function scrollToBottom() {
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
  // Fonction pour envoyer le message
  const sendMessage = async () => {
    const userMessage = chatInput.value;
    if (userMessage) {
      // Affiche le message de l'utilisateur
      chatOutput.innerHTML += `<p><strong>Vous:</strong> ${userMessage}</p>`;
      chatInput.value = ''; // Réinitialiser le champ de saisie
      scrollToBottom(); // Après ajout du message

      try {
        // Envoie le message à la Fonction Netlify
        const response = await fetch('/.netlify/functions/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage,
            thread_id: existingThreadId, // Utiliser le thread_id existant ou null si nouveau thread
          }),
        });

        // Vérifie si la réponse est OK (statut 200)
        if (response.ok) {
          const data = await response.json();
          const botResponse = data.botResponse;
          existingThreadId = data.threadId; // Met à jour le threadId pour les futurs messages
          chatOutput.innerHTML += `<p><strong>Assistant:</strong> ${botResponse}</p>`;
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

  // Envoi du message via clic sur le bouton
  envoyerBtn.addEventListener('click', sendMessage);

  // Envoi du message avec la touche "Enter"
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Empêche le comportement par défaut (nouvelle ligne)
      sendMessage(); // Envoie le message
    }
  });
});