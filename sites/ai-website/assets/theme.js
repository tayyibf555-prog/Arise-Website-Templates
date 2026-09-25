/* AI Website Agency (Halden Studio): shared behaviour for the standard site and the VSL page. */
(() => {
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Toast */
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.append(toast);
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  /* Scroll reveal */
  const onReveal = new Map();
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        onReveal.get(e.target)?.();
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  $$('[data-reveal]').forEach((el) => io.observe(el));

  /* Giant wordmarks: scale the text so it spans its container exactly */
  const fits = $$('[data-fit]');
  const fit = (el) => {
    const span = el.firstElementChild;
    if (!span) return;
    const cs = getComputedStyle(el);
    const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (avail <= 0) return;
    // offsetWidth ignores transforms (e.g. a parent that is scaling in), unlike getBoundingClientRect
    el.style.fontSize = '1000px';
    const w = span.offsetWidth;
    if (w) el.style.fontSize = `${Math.floor(((1000 * avail) / w) * 100) / 100}px`;
  };
  const fitAll = () => fits.forEach(fit);
  if (fits.length) {
    fitAll();
    document.fonts?.ready.then(fitAll);
    let lastW = innerWidth;
    addEventListener('resize', () => {
      if (innerWidth === lastW) return;
      lastW = innerWidth;
      fitAll();
    });
  }

  /* Hero wordmark entrance: letters rise in one after another (GSAP + SplitText), CSS fallback otherwise */
  const gsap = window.gsap;
  const Split = window.SplitText;
  const useGsap = !!(gsap && Split && document.documentElement.classList.contains('gs'));
  $$('.mark-in').forEach((el) => {
    const span = el.firstElementChild;
    if (!span) return;
    if (!useGsap) {
      el.classList.add('mark-play');
      return;
    }
    gsap.registerPlugin(Split);
    const split = Split.create(span, { type: 'chars', charsClass: 'mk' });
    fit(el);
    gsap.set(span, { visibility: 'visible' });
    gsap.from(split.chars, {
      yPercent: 62,
      opacity: 0,
      filter: 'blur(14px)',
      duration: 1.5,
      ease: 'expo.out',
      stagger: 0.045,
      delay: parseFloat(getComputedStyle(el).getPropertyValue('--rd')) || 0.2,
      clearProps: 'filter',
    });
  });

  /* Headlines split on load by motion.js stay hidden until they've been split */
  const showSplit = () => $$('[data-split="load"]').forEach((el) => (el.style.visibility = 'visible'));
  if (document.fonts) document.fonts.ready.then(() => requestAnimationFrame(showSplit));
  else showSplit();
  setTimeout(showSplit, 2500);

  /* Live clock (Europe/London by default) */
  $$('[data-clock]').forEach((el) => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: el.dataset.tz || 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short',
    });
    const node = (tag, text, cls) => {
      const n = document.createElement(tag);
      n.textContent = text;
      if (cls) n.className = cls;
      return n;
    };
    const tick = () => {
      const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
      el.replaceChildren(node('b', p.hour), node('span', ':', 'colon'), node('b', p.minute), ` ${p.timeZoneName || ''}`);
      el.setAttribute('datetime', new Date().toISOString());
    };
    tick();
    setInterval(tick, 10000);
  });

  /* Journey timeline: fill up to the active step; VSL version cycles through steps */
  $$('[data-journey]').forEach((root) => {
    const line = $('.timeline', root);
    const steps = $$('.jstep', root);
    const detail = $('.jdetail', root);
    const n = steps.length;
    if (!line || n < 2) return;
    let i = Math.min(n - 1, parseInt(root.dataset.active || '0', 10));
    let timer;
    const set = (k) => {
      i = k;
      line.style.setProperty('--p', Math.min(k + 1, n - 1) / (n - 1));
      steps.forEach((s, j) => {
        s.classList.toggle('done', j <= k);
        s.classList.toggle('on', j === k);
        if (s.tagName === 'BUTTON') s.setAttribute('aria-pressed', String(j === k));
      });
      if (detail && steps[k].dataset.detail) {
        detail.classList.remove('swap');
        void detail.offsetWidth;
        detail.textContent = steps[k].dataset.detail;
        detail.classList.add('swap');
      }
    };
    const cycle = root.hasAttribute('data-cycle');
    const start = () => {
      set(i);
      if (cycle && !reduce) timer = setInterval(() => set((i + 1) % n), 3400);
    };
    if (cycle) {
      steps.forEach((s, k) =>
        s.addEventListener('click', () => {
          clearInterval(timer);
          set(k);
        })
      );
    }
    steps.forEach((s, j) => s.classList.toggle('done', j === 0));
    if (root.hasAttribute('data-reveal') && !reduce) onReveal.set(root, () => setTimeout(start, 350));
    else start();
  });

  /* Stacking project cards: earlier cards shrink and dim as the next one covers them */
  const cards = $$('.pcard');
  if (cards.length > 1 && !reduce) {
    let ticking = false;
    const update = () => {
      ticking = false;
      cards.forEach((card, k) => {
        const inner = card.firstElementChild;
        const next = cards[k + 1];
        if (!next || !inner) return;
        const a = card.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (b.top - a.top) / a.height));
        inner.style.transform = p ? `scale(${(1 - p * 0.06).toFixed(4)})` : '';
        inner.style.filter = p ? `brightness(${(1 - p * 0.35).toFixed(3)})` : '';
      });
    };
    addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* Newsletter (placeholder: nothing is sent anywhere) */
  $$('form[data-newsletter]').forEach((form) =>
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('input[type="email"]', form);
      if (input && !input.checkValidity()) {
        say('Please enter a valid email address');
        input.focus();
        return;
      }
      form.reset();
      say('Thanks, you’re on the list');
    })
  );

  /* VSL: swap the poster for the real embed when one is set */
  $$('[data-vsl]').forEach((box) => {
    const btn = $('.vsl-play', box);
    btn?.addEventListener('click', () => {
      const src = (box.dataset.embed || '').trim();
      if (!src) {
        say('Add your video URL to data-embed on the player');
        return;
      }
      const f = document.createElement('iframe');
      f.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
      f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      f.title = 'Video sales letter';
      box.classList.add('playing');
      $('.vsl-screen', box).replaceChildren(f);
    });
  });

  /* Sticky CTA: in once the hero CTA has scrolled away, out again over the final CTA.
     Measured on scroll (not IntersectionObserver) so jumps via anchor links are handled too. */
  const sticky = $('.sticky-cta');
  const anchor = $('[data-sticky-anchor]');
  if (sticky && anchor) {
    document.body.classList.add('has-sticky');
    const end = $('[data-sticky-hide]');
    let queued = false;
    const sync = () => {
      queued = false;
      const past = anchor.getBoundingClientRect().bottom < 0;
      const atEnd = !!end && end.getBoundingClientRect().top < innerHeight * 0.85;
      const show = past && !atEnd;
      if (show === sticky.classList.contains('show')) return;
      sticky.classList.toggle('show', show);
      sticky.toggleAttribute('inert', !show);
    };
    const queue = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(sync);
      }
    };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    sync();
  }

  /* Booking buttons: open the calendar link set in data-booking-url on <body> */
  $$('[data-book]').forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = (document.body.dataset.bookingUrl || '').trim();
      if (!url) {
        say('Add your booking link to data-booking-url on <body>');
        return;
      }
      window.open(url, '_blank', 'noopener');
    })
  );

  /* Placeholder links */
  $$('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  /* Current year */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
