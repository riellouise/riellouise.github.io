// toolbar coordinate readout
const coords = document.getElementById('coords');
if (coords) {
  document.addEventListener('mousemove', (e) => {
    coords.textContent = `x: ${e.clientX} · y: ${e.clientY}`;
  });
}

// logo mark: pupils follow the cursor, whole mark tilts slightly
const logoMark = document.getElementById('logoMark');
const eyes = [
  { group: document.getElementById('eyeL'), pupil: null, baseX: 68, baseY: 122, range: 7 },
  { group: document.getElementById('eyeR'), pupil: null, baseX: 150, baseY: 118, range: 6 }
];
eyes.forEach(e => {
  e.pupil = e.group.querySelector('.pupil');
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (logoMark && !reduceMotion) {
  document.addEventListener('mousemove', (e) => {
    const rect = logoMark.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const angle = Math.atan2(dy, dx);

    eyes.forEach(eye => {
      const px = eye.baseX + Math.cos(angle) * eye.range;
      const py = eye.baseY + Math.sin(angle) * eye.range;
      eye.pupil.setAttribute('cx', px);
      eye.pupil.setAttribute('cy', py);
    });

    const tiltX = Math.max(-6, Math.min(6, dx / 60));
    const tiltY = Math.max(-6, Math.min(6, dy / 60));
    logoMark.style.transform = `rotate(${tiltX * 0.3}deg) translate(${tiltX * 0.2}px, ${tiltY * 0.2}px)`;
  });

  setInterval(() => {
    logoMark.classList.add('blink');
    setTimeout(() => logoMark.classList.remove('blink'), 320);
  }, 4200);
}
