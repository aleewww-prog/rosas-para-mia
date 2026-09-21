/* Regalo de Alejandro para Mia. Sin librerías ni conexiones externas. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));
  let transitioning = false;
  let petalTimer = 0;
  let petalStopTimer = 0;
  let pointerDrift = 0;
  let letterOpened = false;
  let openingLetter = false;

  async function showScene(id) {
    if (transitioning) return false;
    transitioning = true;
    const current = document.querySelector('.scene:not([hidden])');
    current.classList.add('is-leaving');
    await wait(reducedMotion.matches ? 0 : 440);
    current.hidden = true;
    current.classList.remove('is-leaving', 'is-entering');
    const next = document.getElementById(id);
    next.hidden = false;
    next.classList.add('is-entering');
    document.body.dataset.stage = id;
    window.scrollTo({ top: 0, behavior: 'instant' });
    next.querySelector('h1, h2')?.focus({ preventScroll: true });
    transitioning = false;
    return true;
  }

  // Pocos pétalos en pantalla y limpieza al terminar; sin ciclos de dibujo continuos.
  function addPetal() {
    if (reducedMotion.matches || document.hidden) return;
    const container = document.getElementById('petals');
    if (container.childElementCount >= 18) return;
    const petal = document.createElement('i');
    petal.className = 'petal';
    const duration = 7 + Math.random() * 4;
    petal.style.cssText = `left:${Math.random() * 100}%;--fall-time:${duration}s;--drift:${(Math.random() - .5) * 100 + pointerDrift}px;--turn:${(Math.random() - .5) * 520}deg`;
    container.append(petal);
    petal.addEventListener('animationend', () => petal.remove(), { once: true });
    // Respaldo si se cambia la preferencia de movimiento durante la animación.
    setTimeout(() => petal.remove(), (duration + 2) * 1000);
  }

  function stopPetals() {
    clearInterval(petalTimer);
    clearTimeout(petalStopTimer);
  }

  function rainPetals(seconds = 12) {
    stopPetals();
    if (reducedMotion.matches) return;
    addPetal();
    petalTimer = setInterval(addPetal, 650);
    petalStopTimer = setTimeout(stopPetals, seconds * 1000);
  }

  window.addEventListener('pointermove', (event) => {
    pointerDrift = (event.clientX / window.innerWidth - .5) * 65;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-paused', document.hidden);
    if (document.hidden) {
      stopPetals();
    }
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      stopPetals();
      document.getElementById('petals').replaceChildren();
    }
  });

  for (let i = 0; i < 24; i += 1) {
    const light = document.createElement('i');
    light.className = 'light';
    light.style.cssText = `left:${(i * 37.7) % 100}%;top:${(i * 23.3) % 100}%;--duration:${5 + i % 7}s;--delay:-${i % 9}s`;
    document.getElementById('particles').append(light);
  }

  document.getElementById('open-gift').addEventListener('click', async () => {
    if (transitioning || document.body.dataset.stage !== 'welcome') return;
    rainPetals(14);
    if (!await showScene('story')) return;
    await wait(reducedMotion.matches ? 0 : 2200);
    document.getElementById('story-continuation').hidden = false;
  });

  document.getElementById('receive-roses').addEventListener('click', async () => {
    if (!await showScene('garden')) return;
    const bouquet = document.getElementById('bouquet');
    bouquet.classList.add('forming');
    rainPetals(10);
    await wait(reducedMotion.matches ? 0 : 4850);
    bouquet.classList.add('complete');
    bouquet.classList.remove('forming');
    document.getElementById('bouquet-message').hidden = false;
    document.getElementById('meanings').hidden = false;
    document.getElementById('garden-title').focus({ preventScroll: true });
  });

  const reasons = [
    'Por hacer mis días más lindos.',
    'Por cada vez que lográs sacarme una sonrisa.',
    'Por todos nuestros momentos juntos, incluso estando lejos.',
    'Por la forma en que te volviste alguien tan especial para mí.',
    'Por todas las conversaciones que no quiero que terminen.',
    'Por simplemente ser vos.'
  ];
  const seenRoses = new Set();
  const grid = document.getElementById('rose-grid');
  reasons.forEach((reason, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rose-card';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Descubrir la rosa ${index + 1}`);
    button.innerHTML = `<span class="rose-number" aria-hidden="true">0${index + 1}</span>
      <svg viewBox="-78 -72 156 252" aria-hidden="true"><g transform="rotate(${[-8, 4, -4, 7, -6, 3][index]})"><use href="#long-rose"/></g></svg>
      <span class="rose-label">Tocá para descubrir</span><span class="rose-message">${reason}</span>`;
    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-pressed') === 'true';
      button.setAttribute('aria-pressed', String(!isOpen));
      button.setAttribute('aria-label', isOpen ? `Descubrir la rosa ${index + 1}` : `Rosa ${index + 1}: ${reason}`);
      if (!isOpen) seenRoses.add(index);
      const count = seenRoses.size;
      document.getElementById('rose-progress').textContent = count === 6
        ? 'Seis rosas. Y tantas razones más para quererte.'
        : `${count} de 6 pequeños porqués descubiertos`;
    });
    grid.append(button);
  });

  document.getElementById('show-envelope').addEventListener('click', () => showScene('letter-scene'));

  async function revealLetter(animate = true) {
    if (openingLetter) return;
    openingLetter = true;
    const envelope = document.getElementById('envelope');
    envelope.disabled = true;
    envelope.classList.add('opened');
    envelope.setAttribute('aria-expanded', 'true');
    document.getElementById('envelope-hint').textContent = 'Para vos, cada palabra.';
    await wait(animate && !reducedMotion.matches ? 1750 : 0);
    envelope.hidden = true;
    const scene = document.getElementById('letter-scene');
    scene.classList.add('reading');
    document.getElementById('letter').hidden = false;
    scene.setAttribute('aria-labelledby', 'letter-title');
    document.getElementById('letter-title').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    letterOpened = true;
    openingLetter = false;
  }

  document.getElementById('envelope').addEventListener('click', () => revealLetter());
  document.getElementById('finish-letter').addEventListener('click', async () => {
    if (!await showScene('final')) return;
    document.getElementById('final-bouquet-space').append(document.getElementById('bouquet'));
    rainPetals(7);
  });
  document.getElementById('reread-letter').addEventListener('click', async () => {
    if (!await showScene('letter-scene')) return;
    if (letterOpened) await revealLetter(false);
  });
})();
