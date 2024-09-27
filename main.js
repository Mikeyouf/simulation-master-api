import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';
import './style.css';

document.addEventListener('DOMContentLoaded', function () {
  // Initialisation du carrousel Swiper
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

  envoyerBtn.addEventListener('click', async () => {
    const userMessage = chatInput.value;

    if (userMessage) {
      // Affiche le message de l'utilisateur
      chatOutput.innerHTML += `<p><strong>Vous:</strong> ${userMessage}</p>`;
      chatInput.value = '';

      try {
        // Envoie le message à la Fonction Netlify
        const response = await fetch('/.netlify/functions/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage
          }),
        });

        // Vérifiez si la réponse est OK (statut entre 200-299)
        if (response.ok) {
          const data = await response.json();
          const botResponse = data.botResponse;

          // Affiche la réponse du bot
          chatOutput.innerHTML += `<p><strong>Bot:</strong> ${botResponse}</p>`;
        } else {
          // Si la réponse n'est pas 2xx, essayez de récupérer un message d'erreur du corps de la réponse
          const errorMessage = await response.text(); // Utilisez .text() pour lire la réponse complète
          chatOutput.innerHTML += `<p><strong>Bot:</strong> Erreur: ${errorMessage}</p>`;
        }
      } catch (error) {
        // Gestion de toute erreur réseau ou autre
        chatOutput.innerHTML += `<p><strong>Bot:</strong> Erreur de communication avec l'assistant</p>`;
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    }
  });
});