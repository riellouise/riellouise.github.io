const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- generic typewriter ---------- */
let sharedCaret = null;

function getCaret() {
  if (!sharedCaret) {
    sharedCaret = document.createElement('span');
    sharedCaret.className = 'caret show';
    sharedCaret.textContent = '|';
  }
  return sharedCaret;
}

function typeInto(container, text, { min = 14, max = 26, spacePause = 40 } = {}) {
  return new Promise((resolve) => {
    const caret = getCaret();
    let i = 0;
    let currentWord = null;

    function step() {
      if (i >= text.length) {
        container.appendChild(caret);
        resolve();
        return;
      }
      const char = text[i];

      if (char === ' ') {
        currentWord = null;
        container.appendChild(document.createTextNode(' ')); // real, breakable space
        container.appendChild(caret);
      } else {
        if (!currentWord) {
          currentWord = document.createElement('span');
          currentWord.className = 'word';
          container.appendChild(currentWord);
        }
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = char;
        currentWord.appendChild(span);
        requestAnimationFrame(() => span.classList.add('typed'));
        currentWord.appendChild(caret); // caret stays glued to last letter typed
      }

      i++;
      const delay = min + Math.random() * (max - min) + (char === ' ' ? spacePause : 0);
      setTimeout(step, delay);
    }
    step();
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runHeroTypewriter() {
  const hiLine = document.querySelector('.hi-line');
  const heroName = document.getElementById('heroName');
  const tagLine = document.querySelector('.tag-line');
  const role = document.querySelector('.hero .role');
  const paragraph = document.querySelector('.hero p');
  const ctaButtons = document.querySelectorAll('.cta-row .btn');

  if (!hiLine || !heroName || !tagLine || !role || !paragraph) return;

  const hiText = hiLine.textContent;
  const nameText = heroName.textContent;
  const roleText = role.textContent;
  const paraText = paragraph.textContent;

  hiLine.textContent = '';
  heroName.textContent = '';
  tagLine.textContent = '';
  role.textContent = '';
  paragraph.textContent = '';

  if (reduceMotion) {
    hiLine.textContent = hiText;
    heroName.textContent = nameText;
    tagLine.innerHTML = `Here's my <span class="outline-text">portfolio</span>.`;
    role.textContent = roleText;
    paragraph.textContent = paraText;
    ctaButtons.forEach(b => b.classList.add('revealed'));
    return;
  }

  const ENTER_PAUSE = 220;

  await delay(650); // let toolbar/breadcrumb/logo settle in first
  await typeInto(hiLine, hiText);
  await delay(ENTER_PAUSE);

  await typeInto(heroName, nameText, { min: 60, max: 130, spacePause: 60 }); // slower, mechanical keystrikes
  await delay(ENTER_PAUSE);

  // tag-line: "Here's my " + outline word + "."
  await typeInto(tagLine, "Here's my ");
  const outlineSpan = document.createElement('span');
  outlineSpan.className = 'outline-text';
  tagLine.appendChild(outlineSpan);
  await typeInto(outlineSpan, 'portfolio');
  tagLine.appendChild(document.createTextNode('.'));
  await delay(ENTER_PAUSE);

  await typeInto(role, roleText, { min: 8, max: 16 });
  await delay(ENTER_PAUSE);

  await typeInto(paragraph, paraText, { min: 8, max: 18, spacePause: 20 });

  sharedCaret.classList.add('hide');

  ctaButtons.forEach((btn, i) => {
    setTimeout(() => btn.classList.add('revealed'), 150 + i * 90);
  });
}

runHeroTypewriter();

/* ---------- breadcrumb: highlight active section on scroll ---------- */
const crumbs = document.querySelectorAll('.crumb');
const fileMeta = document.getElementById('fileMeta');
const sectionIds = Array.from(crumbs).map(c => c.dataset.crumb);
const sections = sectionIds
  .map(id => document.getElementById(id))
  .filter(Boolean);

if (sections.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        crumbs.forEach(c => c.classList.toggle('active', c.dataset.crumb === id));
        if (fileMeta) {
          const idx = sectionIds.indexOf(id) + 1;
          fileMeta.textContent = `${idx} of ${sectionIds.length} · mariel-gomez.folder`;
        }
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(sec => observer.observe(sec));
}

/* ---------- view toggle buttons (decorative) ---------- */
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ---------- bubble field: fills empty hero space, pops on click ---------- */
(function initBubbles() {
  const field = document.getElementById('bubbleField');
  const heroText = document.querySelector('.hero-text');
  const heroVisual = document.querySelector('.hero-visual');
  if (!field) return;

  const fills = [
    { fill: 'var(--teal-soft)', stroke: 'rgba(78,157,184,0.35)' },
    { fill: 'var(--accent-soft)', stroke: 'rgba(244,104,10,0.28)' },
    { fill: 'var(--sky-soft)', stroke: 'rgba(180,213,221,0.55)' },
    { fill: 'rgba(249,157,69,0.14)', stroke: 'rgba(249,157,69,0.32)' }
  ];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  // percentage-space rectangles (relative to the field) to keep bubbles out of,
  // with a little padding so they don't spawn hugging the text/blob edges either
  function getExclusionZones() {
    const fieldRect = field.getBoundingClientRect();
    const pad = 3; // % padding around each zone
    return [heroText, heroVisual].filter(Boolean).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: ((r.left - fieldRect.left) / fieldRect.width) * 100 - pad,
        right: ((r.right - fieldRect.left) / fieldRect.width) * 100 + pad,
        top: ((r.top - fieldRect.top) / fieldRect.height) * 100 - pad,
        bottom: ((r.bottom - fieldRect.top) / fieldRect.height) * 100 + pad
      };
    });
  }

  function overlapsZone(xPct, yPct, zones) {
    return zones.some(z => xPct >= z.left && xPct <= z.right && yPct >= z.top && yPct <= z.bottom);
  }

  function findOpenSpot(zones) {
    for (let i = 0; i < 24; i++) {
      const x = rand(2, 96);
      const y = rand(3, 95);
      if (!overlapsZone(x, y, zones)) return { x, y };
    }
    return null; // gave up — every attempt landed on content, skip this spawn
  }

  function spawnBubble() {
    const zones = getExclusionZones();
    const spot = findOpenSpot(zones);
    if (!spot) return null;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const size = rand(40, 110);
    const palette = fills[Math.floor(rand(0, fills.length))];

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${spot.x}%`;
    bubble.style.top = `${spot.y}%`;
    bubble.style.setProperty('--bubble-fill', palette.fill);
    bubble.style.setProperty('--bubble-stroke', palette.stroke);
    bubble.style.setProperty('--bubble-dur', `${rand(5, 9).toFixed(2)}s`);
    bubble.style.setProperty('--bubble-delay', `${rand(0, 3).toFixed(2)}s`);
    bubble.style.setProperty('--bubble-drift-x', `${rand(-8, 8).toFixed(1)}px`);
    bubble.style.setProperty('--bubble-drift-y', `${rand(-14, -5).toFixed(1)}px`);

    field.appendChild(bubble);
    return bubble;
  }

  function popBubble(bubble) {
    if (bubble.classList.contains('pop')) return;
    bubble.classList.add('pop');
    setTimeout(() => {
      bubble.remove();
      // try to replace what popped, after a short beat
      setTimeout(spawnBubble, rand(700, 2000));
    }, 340);
  }

  const BUBBLE_COUNT = 6;
  let hintDismissed = false;
  let hintEl = null;

  function dismissHint() {
    if (hintDismissed) return;
    hintDismissed = true;
    if (hintEl) {
      hintEl.classList.remove('show');
      setTimeout(() => hintEl && hintEl.remove(), 400);
    }
  }

  function showHintNear(bubble) {
    if (hintDismissed || !bubble) return;
    bubble.classList.add('hint-target');

    hintEl = document.createElement('div');
    hintEl.className = 'bubble-hint';
    hintEl.textContent = 'pop me!';
    hintEl.style.left = bubble.style.left;
    hintEl.style.top = bubble.style.top;
    field.appendChild(hintEl);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!hintDismissed) hintEl.classList.add('show');
    }));

    // fade the hint on its own after a while either way
    setTimeout(dismissHint, 7000);
  }

  // spawn after layout has settled so text/blob rects are accurate
  requestAnimationFrame(() => {
    let targetBubble = null;
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const b = spawnBubble();
      if (b && !targetBubble) targetBubble = b;
    }
    setTimeout(() => showHintNear(targetBubble), 900);
  });

  field.addEventListener('click', (e) => {
    const bubble = e.target.closest('.bubble');
    if (bubble) {
      dismissHint();
      popBubble(bubble);
    }
  });
})();
const logoMark = document.getElementById('logoMark');
if (logoMark) {
  logoMark.addEventListener('animationend', () => {
    // the entrance animation (logoUnfold) is what was holding opacity:1 and the
    // final transform via fill-mode "both". Clearing the animation without
    // locking those values in first made the mark snap back to its opacity:0
    // base state right after the animation finished.
    logoMark.style.opacity = '1';
    logoMark.style.transform = 'scale(1) rotate(0deg)';
    logoMark.style.animation = 'none';
  }, { once: true });
}
const eyes = [
  { group: document.getElementById('eyeL'), pupil: null, baseX: 68, baseY: 126, range: 14 },
  { group: document.getElementById('eyeR'), pupil: null, baseX: 163, baseY: 122, range: 13 }
];
eyes.forEach(e => { e.pupil = e.group.querySelector('.pupil'); });

let lastMove = Date.now();

function pointEyesAt(clientX, clientY) {
  const rect = logoMark.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const angle = Math.atan2(dy, dx);
  eyes.forEach(eye => {
    const px = eye.baseX + Math.cos(angle) * eye.range;
    const py = eye.baseY + Math.sin(angle) * eye.range;
    eye.pupil.setAttribute('cx', px);
    eye.pupil.setAttribute('cy', py);
  });
  return { dx, dy };
}

if (logoMark && !reduceMotion) {
  document.addEventListener('mousemove', (e) => {
    lastMove = Date.now();
    const { dx, dy } = pointEyesAt(e.clientX, e.clientY);
    const tiltX = Math.max(-6, Math.min(6, dx / 60));
    const tiltY = Math.max(-6, Math.min(6, dy / 60));
    logoMark.classList.remove('idle-wiggle');
    logoMark.style.transform = `rotate(${tiltX * 0.3}deg) translate(${tiltX * 0.2}px, ${tiltY * 0.2}px)`;
  });

  setInterval(() => {
    logoMark.classList.add('blink');
    setTimeout(() => logoMark.classList.remove('blink'), 320);
  }, 4200);

  // idle tilt when the cursor's been still
  (function idleTiltLoop() {
    const wait = 4000 + Math.random() * 3000;
    setTimeout(() => {
      if (Date.now() - lastMove > 2500) {
        const tiltX = Math.random() * 10 - 5;
        const tiltY = Math.random() * 8 - 4;
        logoMark.classList.add('idle-wiggle');
        logoMark.style.transform = `rotate(${tiltX}deg) translate(${tiltX * 0.5}px, ${tiltY * 0.5}px)`;
        setTimeout(() => {
          logoMark.style.transform = 'rotate(0deg) translate(0,0)';
          setTimeout(() => logoMark.classList.remove('idle-wiggle'), 650);
        }, 650);
      }
      idleTiltLoop();
    }, wait);
  })();

  // reacts to a click anywhere on the page: glances at the click point, blinks, pops
  document.addEventListener('click', (e) => {
    lastMove = Date.now();
    pointEyesAt(e.clientX, e.clientY);

    logoMark.classList.add('blink', 'reacting');
    setTimeout(() => logoMark.classList.remove('blink'), 320); 

    logoMark.style.transform = 'scale(0.94, 1.08) rotate(-2deg)';
    setTimeout(() => {
      logoMark.style.transform = 'scale(1.04, 0.97) rotate(2deg)';
      setTimeout(() => {
        logoMark.style.transform = 'scale(1) rotate(0deg)';
        setTimeout(() => logoMark.classList.remove('reacting'), 350);
      }, 140);
    }, 140);
  });
}