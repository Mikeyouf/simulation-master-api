import Glider from 'glider-js';
import 'glider-js/glider.min.css';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Initialisation de Glider.js avec glissement désactivé
  const glider = new Glider(document.querySelector('.glider'), {
    slidesToShow: 1,
    dots: '#dots',
    draggable: false,
    scrollLock: true,
    arrows: {
      prev: '.glider-prev',
      next: '.glider-next'
    },
    scrollPropagate: false
  });

  // Gestion des boutons de navigation
  const buttons = document.querySelectorAll('.nav-button');
  
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      glider.scrollItem(index);
      updateActiveButton(index);
    });
  });

  // Mise à jour des boutons lors du défilement
  glider.ele.addEventListener('glider-slide-visible', (event) => {
    const currentSlide = glider.getCurrentSlide();
    updateActiveButton(currentSlide);
  });

  // Ajouter un écouteur pour les changements de slide
  glider.ele.addEventListener('glider-animated', () => {
    const currentSlide = glider.getCurrentSlide();
    updateActiveButton(currentSlide);
  });

  function updateActiveButton(activeIndex) {
    if (activeIndex === undefined || activeIndex === null) return;
    
    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === activeIndex);
    });
  }

  // Initialiser le premier bouton comme actif
  updateActiveButton(0);
});