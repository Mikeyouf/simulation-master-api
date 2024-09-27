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
  const chatInput = document.getElementById('chat-input');
  const chatOutput = document.getElementById('chat-output');
  const envoyerBtn = document.getElementById('envoyer-btn');

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

        const data = await response.json();

        if (response.ok) {
          const botResponse = data.botResponse;
          // Affiche la réponse du bot
          chatOutput.innerHTML += `<p><strong>Bot:</strong> ${botResponse}</p>`;
        } else {
          chatOutput.innerHTML += `<p><strong>Bot:</strong> Erreur: ${data.error}</p>`;
        }
      } catch (error) {
        chatOutput.innerHTML += `<p><strong>Bot:</strong> Erreur de communication avec l'assistant</p>`;
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    }
  });
});