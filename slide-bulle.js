// assistant-test.js
import Glider from 'glider-js';
import 'glider-js/glider.min.css';
import './style.css';

document.addEventListener('DOMContentLoaded', function () {
  const chatInput = document.getElementById('chat-input-bulle-1');
  const chatContainer = document.querySelector('.glider-bulle'); // Conteneur Glider pour les messages
  const envoyerBtn = document.getElementById('envoyer-btn-bulle-1');
  const ASSISTANT_ID_TEST = 'asst_rTP2BEN5XKX5kpvdRhl3ejKO'; // ID de l'assistant à remplacer

  let existingThreadId = null;
  const maxMessages = 10;

  // Initialisation de Glider.js pour les messages dans la bulle
  const glider = new Glider(chatContainer, {
    slidesToShow: 1,
    dots: '#dots',
    draggable: true,
    loop: true,
    controls: true,
    rewind: true,
    arrows: {
      prev: '.glider-prev-bulle',
      next: '.glider-next-bulle',
    },
  });

  // Fonction pour ajouter un message à la bulle
  function addMessage(message, sender = 'bot') {
    const newMessage = document.createElement('div');
    newMessage.classList.add('chat-message', sender === 'bot' ? 'bot-message' : 'user-message');
    newMessage.textContent = message;

    const newSlide = document.createElement('div');
    newSlide.appendChild(newMessage);

    chatContainer.appendChild(newSlide);

    // Rafraîchir Glider.js après avoir ajouté un nouveau message
    setTimeout(() => {
      glider.refresh(true);
      glider.scrollItem(glider.slides.length - 1); // Scroll automatique vers le dernier message
    }, 100); // Petite temporisation pour assurer le bon rafraîchissement
  }

  // Fonction pour envoyer le message
  const sendMessage = async () => {
    const userMessage = chatInput.value;
    if (userMessage) {
      addMessage(userMessage, 'user'); // Ajouter le message de l'utilisateur
      chatInput.value = ''; // Réinitialiser le champ de saisie

      try {
        const response = await fetch('/.netlify/functions/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage,
            thread_id: existingThreadId,
            assistant_id: ASSISTANT_ID_TEST,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const botResponse = data.botResponse;
          existingThreadId = data.threadId; // Met à jour le threadId pour les prochains messages
          addMessage(botResponse, 'bot'); // Ajouter la réponse du bot dans la bulle
        } else {
          const errorText = await response.text();
          addMessage(`Erreur: ${errorText}`, 'bot');
        }
      } catch (error) {
        addMessage('Erreur de communication avec l\'assistant.', 'bot');
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    }
  };

  // Événement clic sur le bouton Envoyer
  envoyerBtn.addEventListener('click', sendMessage);

  // Événement Enter pour envoyer le message
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Empêche le saut de ligne
      sendMessage(); // Envoie le message
    }
  });
});