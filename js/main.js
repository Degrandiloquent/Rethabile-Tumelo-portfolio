const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.documentElement.classList.add('js');

let letterIndex = 0;
$$('[data-split] .w').forEach(word => {
  const letters = [...word.textContent];
  word.textContent = '';
  letters.forEach(letter => {
    const span = document.createElement('span');
    span.className = 'l';
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--i', letterIndex++);
    span.textContent = letter;
    word.appendChild(span);
  });
});

const revealItems = $$('.rv');
const counters = $$('[data-n]');
const animatedCounters = new WeakSet();
const greeting = $('#hello-title');
const greetingText = greeting?.textContent ?? '';
let greetingStarted = false;

if (greeting) {
  greeting.setAttribute('aria-label', greetingText);
  if (reducedMotion) greeting.textContent = greetingText;
  else greeting.textContent = '';
}

function startGreeting() {
  if (!greeting || greetingStarted) return;
  greetingStarted = true;
  let index = 0;
  const typeNextLetter = () => {
    index += 1;
    greeting.textContent = greetingText.slice(0, index);
    if (index < greetingText.length) setTimeout(typeNextLetter, 115);
  };
  typeNextLetter();
}

function animateCounter(element) {
  if (animatedCounters.has(element)) return;
  animatedCounters.add(element);
  const target = Number(element.dataset.n);
  if (reducedMotion) {
    element.textContent = target;
    return;
  }
  const start = performance.now();
  const animate = now => {
    const progress = Math.min((now - start) / 1400, 1);
    element.textContent = Math.round(target * (1 - (1 - progress) ** 3));
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

const navLinks = $$('nav a[href^="#"]');
const navSections = navLinks
  .map(link => $(link.getAttribute('href')))
  .filter(Boolean);
const navMenu = $('nav');
const navToggle = $('.nav-toggle');

function setNavMenuOpen(isOpen) {
  navMenu.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.querySelector('span').textContent = isOpen ? 'Close' : 'Menu';
}

navToggle.addEventListener('click', () => {
  setNavMenuOpen(navToggle.getAttribute('aria-expanded') !== 'true');
});
navLinks.forEach(link => link.addEventListener('click', () => setNavMenuOpen(false)));
document.addEventListener('click', event => {
  if (!navMenu.contains(event.target)) setNavMenuOpen(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
    setNavMenuOpen(false);
    navToggle.focus();
  }
});
const floatingItems = $$('.fl').map(element => ({
  element,
  section: element.closest('section'),
  speed: Number(element.dataset.s) || 0,
  x: Number(element.dataset.x) || 0,
  rotation: Number(element.dataset.r) || 0,
  horizontalOffset: 0
}));
const progressBar = $('.bar');
let scrollScheduled = false;

function updateScrollEffects() {
  scrollScheduled = false;
  const revealThreshold = innerHeight * 0.88;

  revealItems.forEach(element => {
    if (element.classList.contains('in')) return;
    if (element.getBoundingClientRect().top < revealThreshold) {
      element.classList.add('in');
    }
  });

  if (greeting && !greetingStarted && greeting.getBoundingClientRect().top < innerHeight * 0.85) {
    startGreeting();
  }

  counters.forEach(element => {
    if (element.getBoundingClientRect().top < revealThreshold) animateCounter(element);
  });

  const activeSection = navSections.find(section => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= innerHeight * 0.35 && bounds.bottom > innerHeight * 0.35;
  });
  if (activeSection) {
    navLinks.forEach(link => {
      if (link.hash === `#${activeSection.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  if (!reducedMotion) {
    floatingItems.forEach(item => {
      const bounds = item.section.getBoundingClientRect();
      const distance = innerHeight / 2 - (bounds.top + bounds.height / 2);
      const elementBounds = item.element.getBoundingClientRect();
      const baseLeft = elementBounds.left - item.horizontalOffset;
      const baseRight = elementBounds.right - item.horizontalOffset;
      const minimumOffset = 12 - baseLeft;
      const maximumOffset = document.documentElement.clientWidth - 12 - baseRight;
      const desiredOffset = innerWidth > 640 ? distance * item.x : 0;
      const horizontalOffset = Math.min(maximumOffset, Math.max(minimumOffset, desiredOffset));
      item.horizontalOffset = horizontalOffset;
      item.element.style.transform = `translate3d(${horizontalOffset}px, ${distance * item.speed}px, 0) rotate(${distance * item.rotation}deg)`;
    });
  }

  const scrollableHeight = document.documentElement.scrollHeight - innerHeight;
  const progress = scrollableHeight > 0 ? scrollY / scrollableHeight * 100 : 0;
  if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

function scheduleScrollEffects() {
  if (scrollScheduled) return;
  scrollScheduled = true;
  requestAnimationFrame(updateScrollEffects);
}

addEventListener('scroll', scheduleScrollEffects, { passive: true });
addEventListener('resize', scheduleScrollEffects);
scheduleScrollEffects();

const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

const quoteForm = $('#quote-form');
if (quoteForm) {
  const service = $('#quote-service');
  const wordCount = $('#quote-word-count');
  const wordCountRow = $('#word-count-row');
  const estimate = $('#quote-estimate');
  const result = $('#quote-result');
  const emailLink = $('#quote-email-link');
  const translationRate = 0.35;

  function updateQuoteEstimate() {
    const isTranslation = service.value === 'Translation';
    wordCountRow.hidden = !isTranslation;
    wordCount.required = isTranslation;
    if (!isTranslation || !wordCount.value) {
      estimate.querySelector('strong').textContent = 'Enter a word count';
      return;
    }

    const words = Number(wordCount.value);
    const amount = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(words * translationRate);
    estimate.querySelector('strong').textContent = amount;
  }

  service.addEventListener('change', updateQuoteEstimate);
  wordCount.addEventListener('input', updateQuoteEstimate);
  quoteForm.addEventListener('input', () => { result.hidden = true; });
  quoteForm.addEventListener('change', () => { result.hidden = true; });

  quoteForm.addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(quoteForm);
    const words = fields.get('wordCount');
    const isTranslation = fields.get('service') === 'Translation';
    const estimateLine = isTranslation
      ? `Estimated translation cost: R${(Number(words) * translationRate).toFixed(2)} (R0.35 × ${words} words; final quote confirmed after review).`
      : 'Please provide a quote for this service.';
    const message = [
      'Hello Rethabile,',
      '',
      'I would like to request a quote.',
      `Name: ${fields.get('name')}`,
      `Email: ${fields.get('email')}`,
      `Service: ${fields.get('service')}`,
      `Language pair: ${fields.get('languages')}`,
      ...(isTranslation ? [`Approximate word count: ${words}`] : []),
      `Preferred deadline: ${fields.get('deadline') || 'Flexible / to be discussed'}`,
      estimateLine,
      '',
      'Project details:',
      fields.get('details')
    ].join('\n');
    const subject = `Quote request - ${fields.get('service')}`;
    const params = new URLSearchParams({ subject, body: message });

    emailLink.href = `mailto:Tswelelopele.services@gmail.com?${params}`;
    result.hidden = false;
  });

  updateQuoteEstimate();
}
