import Glider from 'glider-js'; // Importation de Glider.js
import 'glider-js/glider.min.css'; // Importation du fichier CSS de Glider
import './style.css'; // Ton fichier CSS personnalisé

document.addEventListener('DOMContentLoaded', function () {
  new Glider(document.querySelector('.glider'), {
    slidesToShow: 1,
    dots: '#dots',
    draggable: false,
    loop: true,
    controls: true,
    rewind: true,
    arrows: {
      prev: '.glider-prev',
      next: '.glider-next'
    }
  });
});