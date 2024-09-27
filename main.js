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

  let existingThreadId = null; // Initialisez à null au début

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
            userMessage,
            thread_id: existingThreadId // Utilise le thread_id existant, ou null si nouveau thread
          }),
        });

        // Vérifiez si la réponse est OK (statut 200)
        if (response.ok) {
          const data = await response.json(); // Extrait le corps de la réponse JSON

          const botResponse = data.botResponse;

          existingThreadId = data.threadId; // Mettez à jour le threadId pour les futurs messages
          chatOutput.innerHTML += `<p><strong>Robert Marchand :</strong> ${botResponse}</p>`;
        } else {
          const errorText = await response.text(); // Obtenez la réponse texte en cas d'erreur
          chatOutput.innerHTML += `<p><strong>Bot:</strong> Erreur: ${errorText}</p>`;
        }
      } catch (error) {
        // Gestion de toute erreur réseau ou autre
        chatOutput.innerHTML += `<p><strong>Bot:</strong> Erreur de communication avec l'assistant</p>`;
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    }
  });


});