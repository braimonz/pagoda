/* ============================================================
   PAGODA GYM — Main Script
============================================================ */

// ── NAV SCROLL ─────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ── MOBILE MENU ────────────────────────────────────────────
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ── SCROLL REVEAL ──────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
revealEls.forEach(el => revealObserver.observe(el));

// ── CHALLENGE COUNTER ANIMATION ────────────────────────────
const counterEl = document.getElementById('challengeCounter');
const barEl = document.getElementById('challengeBar');
const TARGET = 73;
const GOAL = 100;
let counted = false;

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !counted) {
      counted = true;
      animateCounter(counterEl, 0, TARGET, 1800);
      setTimeout(() => {
        barEl.style.width = (TARGET / GOAL * 100) + '%';
      }, 200);
    }
  });
}, { threshold: 0.5 });

if (counterEl) countObserver.observe(counterEl);

function animateCounter(el, from, to, duration) {
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ── SMOOTH SCROLL FOR NAV ANCHORS ─────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── TICKER DUPLICATE FOR SEAMLESS LOOP ────────────────────
const ticker = document.querySelector('.diff-ticker');
if (ticker) {
  ticker.innerHTML += ticker.innerHTML;
}

// ── HERO PARALLAX (subtle) ─────────────────────────────────
const heroBg = document.querySelector('.hero__bg');
window.addEventListener('scroll', () => {
  if (!heroBg) return;
  const y = window.scrollY;
  heroBg.style.transform = `translateY(${y * 0.3}px)`;
}, { passive: true });

// ── BENEFIT CARD TILT ──────────────────────────────────────
document.querySelectorAll('.benefit-card, .price-card, .coach-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * 4;
    const ry = ((x - cx) / cx) * -4;
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ── WHATSAPP FLOAT PULSE ANIMATION ─────────────────────────
const waFloat = document.querySelector('.whatsapp-float');
if (waFloat) {
  setInterval(() => {
    waFloat.style.boxShadow = '0 4px 24px rgba(37, 211, 102, 0.7)';
    setTimeout(() => {
      waFloat.style.boxShadow = '0 4px 24px rgba(37, 211, 102, 0.4)';
    }, 600);
  }, 3000);
}

// ── RANKING HIGHLIGHT ON HOVER ─────────────────────────────
document.querySelectorAll('.rank-item').forEach((item, i) => {
  item.style.transitionDelay = `${i * 0.05}s`;
});

// ── ACTIVE NAV LINK ON SCROLL ─────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
  });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}`
      ? 'var(--white)'
      : 'rgba(255,255,255,0.7)';
  });
}, { passive: true });
