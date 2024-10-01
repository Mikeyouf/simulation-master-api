import Glider from 'glider-js'; // Importation de Glider.js
import 'glider-js/glider.min.css'; // Importation du fichier CSS de Glider
import './style.css'; // Ton fichier CSS personnalisé

document.addEventListener('DOMContentLoaded', function () {
  const isMobile = window.innerWidth <= 768;

  new Glider(document.querySelector('.glider'), {
    slidesToShow: 1,
    dots: '#dots',
    draggable: false,
    loop: true,
    controls: true,
    rewind: true,
    scrollLock: isMobile,
    arrows: {
      prev: '.glider-prev',
      next: '.glider-next'
    }
  });

  window.addEventListener('resize', function () {
    // Actualise la détection mobile si la fenêtre est redimensionnée
    const isMobile = window.innerWidth <= 768;
    glider.setOption({
      draggable: isMobile
    });
  });

});