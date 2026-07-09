// Address of the PostCup app (POS + admin panel). Update this one line when
// the frontend moves from localhost to its real hosting address.
const APP_URL = 'http://localhost:5173';

document.getElementById('appLink').href = APP_URL;

document.getElementById('year').textContent = new Date().getFullYear();

const leadForm = document.getElementById('leadForm');
const leadSuccess = document.getElementById('leadSuccess');

leadForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!leadForm.reportValidity()) {
    return;
  }

  leadForm.hidden = true;
  leadSuccess.hidden = false;
  leadSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// Subtle parallax on the hero background — desktop/tablet only, and only
// when the user hasn't asked for reduced motion.
const heroBg = document.querySelector('.hero__bg');
const canParallax = window.matchMedia('(min-width: 768px)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (heroBg && canParallax) {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      heroBg.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      ticking = false;
    });
  });
}
