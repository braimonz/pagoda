/* ============================================================
   PAGODA FITNESS CENTER — Animations & Interactions
============================================================ */

// ── NAV ────────────────────────────────────────────────────
const nav    = document.getElementById('nav');
const burger = document.getElementById('burger');
const menu   = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  menu.classList.toggle('open');
});

menu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    menu.classList.remove('open');
  });
});

// ── SMOOTH SCROLL ──────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── HERO IMAGE LOAD ANIMATION ──────────────────────────────
const heroBgImg = document.querySelector('.hero__bg-img');
if (heroBgImg) {
  if (heroBgImg.complete) heroBgImg.classList.add('loaded');
  else heroBgImg.addEventListener('load', () => heroBgImg.classList.add('loaded'));
}

// ── TICKER DUPLICATE ───────────────────────────────────────
const ticker = document.getElementById('ticker');
if (ticker) ticker.innerHTML += ticker.innerHTML;

// ── SPLIT WORD REVEAL ──────────────────────────────────────
const splitWords = document.querySelectorAll('.js-split-word');
const splitObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el    = entry.target;
    const delay = parseInt(el.dataset.delay || 0);
    setTimeout(() => el.classList.add('visible'), delay);
    splitObserver.unobserve(el);
  });
}, { threshold: 0.2 });
splitWords.forEach(el => splitObserver.observe(el));

// ── GENERIC REVEAL OBSERVER ────────────────────────────────
function makeRevealObserver(selector, threshold = 0.15) {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseInt(el.dataset.delay || 0);
      setTimeout(() => el.classList.add('is-visible'), delay);
      obs.unobserve(el);
    });
  }, { threshold, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
}

makeRevealObserver('.js-reveal-fade', 0.2);
makeRevealObserver('.js-reveal-up',   0.15);
makeRevealObserver('.js-reveal-left', 0.15);
makeRevealObserver('.js-reveal-right',0.15);
makeRevealObserver('.js-reveal-card', 0.12);

// ── COUNTER ANIMATION ──────────────────────────────────────
const counters = document.querySelectorAll('.js-counter');

function animateCount(el, from, to, duration) {
  if (isNaN(to)) return; // skip if not a number (XXX placeholder)
  const start = performance.now();
  const step  = (time) => {
    const p = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el  = entry.target;
    const val = parseInt(el.dataset.target);
    if (!isNaN(val)) animateCount(el, 0, val, 1800);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });

counters.forEach(el => counterObs.observe(el));

// ── PARALLAX HERO BG ──────────────────────────────────────
const heroBg = document.querySelector('.hero__bg');
window.addEventListener('scroll', () => {
  if (!heroBg) return;
  heroBg.style.transform = `translateY(${window.scrollY * 0.25}px)`;
}, { passive: true });

// ── PARALLAX PRICING BG ───────────────────────────────────
const pricingBg = document.querySelector('.pricing__parallax-bg');
const pricingSection = document.querySelector('.pricing');
if (pricingBg && pricingSection) {
  window.addEventListener('scroll', () => {
    const rect = pricingSection.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    const offset = (window.innerHeight - rect.top) * 0.12;
    pricingBg.style.transform = `translateY(${offset}px)`;
  }, { passive: true });
}

// ── PARALLAX FINAL CTA BG ─────────────────────────────────
const finalBg = document.querySelector('.final-cta__img');
const finalSection = document.querySelector('.final-cta');
if (finalBg && finalSection) {
  window.addEventListener('scroll', () => {
    const rect = finalSection.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    const offset = (window.innerHeight - rect.top) * 0.1;
    finalBg.style.transform = `translateY(${offset}px)`;
  }, { passive: true });
}

// ── 3D CARD TILT ──────────────────────────────────────────
function enableTilt(selector) {
  document.querySelectorAll(selector).forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r  = card.getBoundingClientRect();
      const x  = e.clientX - r.left;
      const y  = e.clientY - r.top;
      const rx = ((y - r.height / 2) / r.height) * 6;
      const ry = ((x - r.width  / 2) / r.width ) * -6;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

enableTilt('.price-card');
enableTilt('.benefit-card');
enableTilt('.coach-card');

// ── ACTIVE NAV LINK ───────────────────────────────────────
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav__links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 140) current = s.id;
  });
  navLinks.forEach(a => {
    const matches = a.getAttribute('href') === `#${current}`;
    a.classList.toggle('active', matches);
  });
}, { passive: true });

// ── HORIZONTAL SCROLL BENEFIT CARDS (mobile) ─────────────
// On mobile the grid collapses, no action needed.

// ── CURSOR GLOW (desktop only) ───────────────────────────
if (window.innerWidth > 1024) {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9999;
    width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(225,6,0,0.06) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: opacity 0.3s;
    top: 0; left: 0;
  `;
  document.body.appendChild(glow);

  let mx = 0, my = 0, gx = 0, gy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function followMouse() {
    gx += (mx - gx) * 0.08;
    gy += (my - gy) * 0.08;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(followMouse);
  })();
}

// ── WHATSAPP FLOAT PULSE ─────────────────────────────────
const waBtn = document.querySelector('.whatsapp-float');
if (waBtn) {
  let pulseDir = 1;
  setInterval(() => {
    waBtn.style.boxShadow = `0 4px 32px rgba(37,211,102,${pulseDir === 1 ? '0.6' : '0.35'})`;
    pulseDir *= -1;
  }, 2000);
}

// ── TEXT SCRAMBLE on hero title (optional cinematic effect) ─
function scrambleText(el, final, duration = 900) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const total  = final.length;
  let frame    = 0;
  const frames = Math.round(duration / 16);

  const run = () => {
    let output = '';
    for (let i = 0; i < total; i++) {
      if (frame / frames > i / total) {
        output += final[i];
      } else {
        output += final[i] === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
      }
    }
    el.textContent = output;
    frame++;
    if (frame <= frames) requestAnimationFrame(run);
    else el.textContent = final;
  };
  requestAnimationFrame(run);
}

// Trigger scramble on first hero word after page load
window.addEventListener('load', () => {
  const heroWords = document.querySelectorAll('.js-split-word');
  heroWords.forEach((w, i) => {
    const original = w.textContent.trim();
    const delay    = parseInt(w.dataset.delay || 0);
    setTimeout(() => scrambleText(w, original, 700), delay + 200);
  });
});
