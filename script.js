// Web3Forms access key (public by design). Replace the placeholder with the key received by email.
const WEB3FORMS_KEY = '04e9d334-18ae-421e-b707-cbea91e27650';

// Mobile menu: toggle the navigation and keep aria-expanded in sync
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('site-nav');

function setMenu(open) {
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
}

menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Contact form: validate in the browser, then send the data to the backend
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');
const submitBtn = form.querySelector('button[type="submit"]');
const fields = [...form.querySelectorAll('input[name="name"], input[name="email"], textarea')];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Check one field and show or clear its error message
function validateField(field) {
  const value = field.value.trim();
  let msg = '';
  if (!value) msg = 'This field is required.';
  else if (field.name === 'email' && !EMAIL_RE.test(value)) msg = 'Enter a valid email address.';
  else if (field.name === 'message' && value.length < 10) msg = 'Please write at least 10 characters.';
  form.querySelector(`.err[data-for="${field.name}"]`).textContent = msg;
  field.setAttribute('aria-invalid', String(Boolean(msg)));
  return !msg;
}

// Validate when leaving a field, and re-check live once an error is shown
fields.forEach((f) => {
  f.addEventListener('blur', () => validateField(f));
  f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') validateField(f); });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  note.className = '';
  if (!fields.map((f) => validateField(f)).every(Boolean)) {
    note.textContent = 'Please fix the highlighted fields.';
    note.className = 'bad';
    return;
  }
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  let message = 'Could not send your message. Please try again later.';
  let ok = false;
  const values = Object.fromEntries(new FormData(form));
  try {
    if (WEB3FORMS_KEY.startsWith('YOUR_')) {
      message = 'The contact form is not set up yet. Please use WhatsApp or email.';
    } else if (values.website) {
      ok = true; // honeypot filled in: skip sending and show the normal success message
    } else {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'New portfolio message from ' + values.name,
          name: values.name,
          email: values.email,
          message: values.message
        })
      });
      const data = await res.json();
      ok = res.ok && data.success === true;
    }
    if (ok) message = 'Thank you! Your message has been sent.';
  } catch (err) { /* network error: keep the default message */ }
  if (ok) form.reset();
  note.textContent = message;
  note.className = ok ? '' : 'bad';
  submitBtn.disabled = false;
  submitBtn.textContent = 'Send message';
});

// Copy the contact email to the clipboard
const copyBtn = document.getElementById('copy-email');
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('engr.abdulbarimemon@gmail.com');
    copyBtn.textContent = 'Copied';
  } catch (err) {
    copyBtn.textContent = 'Copy failed';
  }
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
});

// Scroll-spy: highlight the navigation link of the section in view
const navLinks = [...document.querySelectorAll('nav a')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));

// Reveal headings and cards with a short fade as they enter the viewport
const reveal = new IntersectionObserver((entries, obs) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.card, h2').forEach((el) => { el.classList.add('reveal'); reveal.observe(el); });

// Footer: current year
document.getElementById('year').textContent = new Date().getFullYear();