(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;

  /* Blossom symbol, drawn once and reused by every <svg class="bloom"><use href="#bloom"/></svg> */
  const petals = [0, 58, 122, 180, 238, 300]
    .map((a, i) => {
      const s = [1, 0.92, 1.05, 0.95, 1, 0.9][i];
      return `<path transform="rotate(${a}) scale(${s})" d="M0 0C44-26 78-104 6-152C-8-160-20-158-30-148C-82-100-42-28 0 0Z"/>`;
    })
    .join('');
  const stamens = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const r = 22 + (i % 3) * 5;
    return `<line x1="0" y1="0" x2="${(Math.cos(a) * r).toFixed(1)}" y2="${(Math.sin(a) * r).toFixed(1)}"/><circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="3.2"/>`;
  }).join('');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', '0');
  defs.setAttribute('height', '0');
  defs.setAttribute('aria-hidden', 'true');
  defs.style.position = 'absolute';
  defs.innerHTML = `<defs>
    <radialGradient id="petal" cx="0" cy="0" r="160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff7fb"/><stop offset=".3" stop-color="#fbd6e6"/><stop offset=".72" stop-color="#f29cc2"/><stop offset="1" stop-color="#e67aa9"/>
    </radialGradient>
    <symbol id="bloom" viewBox="-170 -170 340 340">
      <g fill="url(#petal)">${petals}</g>
      <g stroke="#f2a14f" stroke-width="2" fill="#f07f3a">${stamens}</g>
      <circle r="14" fill="#f6c066"/>
    </symbol></defs>`;
  document.body.prepend(defs);

  /* Toast */
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let tt;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('show'), 2400);
  };
  $$('[data-say]').forEach((el) => el.addEventListener('click', (e) => (e.preventDefault(), say(el.dataset.say))));

  /* How-it-works tabs */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[role="tab"]', root);
    const panes = $$('.pane', root);
    let i = 0;
    let timer;
    const show = (n, user) => {
      i = n;
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === n));
        t.tabIndex = k === n ? 0 : -1;
      });
      panes.forEach((p, k) => p.classList.toggle('on', k === n));
      if (gsap && !reduce) gsap.from(panes[n].children, { y: 12, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
      if (user) clearInterval(timer);
    };
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => show(k, true));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') (e.preventDefault(), show((i + 1) % tabs.length, true), tabs[i].focus());
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') (e.preventDefault(), show((i - 1 + tabs.length) % tabs.length, true), tabs[i].focus());
      });
    });
    if (!reduce) timer = setInterval(() => show((i + 1) % tabs.length), 5000);
    root.addEventListener('pointerenter', () => clearInterval(timer), { once: true });
  });

  /* Testimonial carousel */
  $$('[data-quotes]').forEach((root) => {
    const slides = $$('.qslide', root);
    const stat = $('[data-stat]', root);
    const statLabel = $('[data-stat-label]', root);
    const brand = $('[data-brand]', root);
    let i = 0;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.toggle('on', k === i);
        s.setAttribute('aria-hidden', String(k !== i));
      });
      const d = slides[i].dataset;
      if (stat) stat.textContent = d.stat;
      if (statLabel) statLabel.textContent = d.label;
      if (brand) brand.textContent = d.brand;
    };
    $('[data-prev]', root)?.addEventListener('click', () => show(i - 1));
    $('[data-next]', root)?.addEventListener('click', () => show(i + 1));
    show(0);
  });

  /* Gentle floating for cards, tags and avatars */
  if (gsap && !reduce) {
    $$('[data-float]').forEach((el, k) => {
      gsap.to(el, {
        y: gsap.utils.random(-10, -4),
        x: gsap.utils.random(-4, 4),
        duration: gsap.utils.random(2.4, 3.8),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: k * 0.2,
      });
    });
  }

  /* VSL: swap the poster for the real embed when one is set */
  $$('[data-vsl]').forEach((box) => {
    $('.vsl-play', box)?.addEventListener('click', () => {
      const src = box.dataset.embed;
      if (!src) return say('Add your video URL to data-embed on the player');
      const f = document.createElement('iframe');
      f.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      f.title = 'Video sales letter';
      box.classList.add('playing');
      $('.vsl-screen', box).replaceChildren(f);
    });
  });

  /* Sticky CTA: visible after the hero CTA, hidden again at the final CTA */
  const sticky = $('.sticky-cta');
  const anchor = $('[data-sticky-anchor]');
  const end = $('[data-sticky-end]');
  if (sticky && anchor) {
    const update = () => {
      const past = anchor.getBoundingClientRect().bottom < 0;
      const atEnd = end && end.getBoundingClientRect().top < innerHeight;
      sticky.classList.toggle('show', past && !atEnd);
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
