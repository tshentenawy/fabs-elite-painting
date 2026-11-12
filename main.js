// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ===== MOBILE HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ===== SCROLL REVEAL =====
const revealEls = document.querySelectorAll(
  '.service-card, .testimonial-card, .gallery-item, .trust-item, .about-content, .about-images, .contact-item'
);
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

// ===== ANIMATED COUNTERS =====
const counters = document.querySelectorAll('.trust-num');
let counted = false;

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !counted) {
      counted = true;
      counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 1600;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          counter.textContent = Math.floor(current);
        }, 16);
      });
    }
  });
}, { threshold: 0.5 });

const trustBar = document.querySelector('.trust-bar');
if (trustBar) countObserver.observe(trustBar);

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
  });
  navAnchors.forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + current) a.classList.add('active');
  });
});

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm && formStatus) {
  const trap = document.createElement('input');
  trap.type = 'text';
  trap.name = 'company_website';
  trap.tabIndex = -1;
  trap.autocomplete = 'off';
  trap.setAttribute('aria-hidden', 'true');
  trap.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;opacity:0;';
  contactForm.appendChild(trap);

  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const btnHTML = submitBtn ? submitBtn.innerHTML : '';
  const showStatus = (type, text) => {
    formStatus.className = `form-status ${type}`;
    formStatus.style.display = 'block';
    formStatus.textContent = text;
  };

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(contactForm).entries());
    const name = (data.name || '').trim();
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
    formStatus.style.display = 'none';
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || 'Something went wrong.');
      contactForm.reset();
      showStatus('success', `✓ Thank you, ${name}! Your quote request has been sent. We'll get back to you shortly.`);
    } catch (err) {
      showStatus('error', `${err.message} You can also call us at (343) 984-8363 or email info@fabsconstruction.ca.`);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = btnHTML; }
    }
  });
}
