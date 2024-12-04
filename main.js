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
  glider.ele.addEventListener('glider-slide-visible', () => {
    updateActiveButton(glider.getCurrentSlide());
  });

  function updateActiveButton(activeIndex) {
    buttons.forEach((button, index) => {
      if (index === activeIndex) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  // Initialiser le premier bouton comme actif
  updateActiveButton(0);
});