(() => {
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  $$('[data-reveal]').forEach((el) => io.observe(el));

  /* Services: hover or focus picks the active row; otherwise it cycles */
  $$('.svc-list').forEach((list) => {
    const items = $$('.svc-item', list);
    if (!items.length) return;
    let i = Math.max(0, items.findIndex((el) => el.classList.contains('on')));
    let paused = false;
    const set = (n) => {
      i = n;
      items.forEach((el, k) => el.classList.toggle('on', k === n));
    };
    items.forEach((el, k) => {
      el.addEventListener('mouseenter', () => set(k));
      el.addEventListener('focus', () => set(k));
    });
    list.addEventListener('mouseenter', () => (paused = true));
    list.addEventListener('mouseleave', () => (paused = false));
    if (!reduce) setInterval(() => !paused && set((i + 1) % items.length), 3200);
    set(i);
  });

  /* Testimonial carousel */
  $$('[data-carousel]').forEach((root) => {
    const slides = $$('.slide', root);
    const count = $('.count', root);
    let i = 0;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.toggle('on', k === i);
        s.setAttribute('aria-hidden', String(k !== i));
      });
      if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };
    $('[data-prev]', root)?.addEventListener('click', () => show(i - 1));
    $('[data-next]', root)?.addEventListener('click', () => show(i + 1));
    show(0);
  });

  /* ⌘ + C copies the contact email (when nothing is selected) */
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  const email = document.body.dataset.email;
  const copyEmail = async () => {
    if (!email) return;
    $$('.keycap').forEach((k) => k.classList.add('down'));
    setTimeout(() => $$('.keycap').forEach((k) => k.classList.remove('down')), 160);
    try {
      await navigator.clipboard.writeText(email);
      say(`Copied ${email}`);
    } catch {
      say(email);
    }
  };
  $$('.keycap').forEach((k) => k.addEventListener('click', copyEmail));
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && !String(getSelection())) copyEmail();
  });

  /* VSL: swap the poster for the real embed when one is set */
  $$('[data-vsl]').forEach((box) => {
    const btn = $('.vsl-play', box);
    btn?.addEventListener('click', () => {
      const src = box.dataset.embed;
      if (!src) {
        say('Add your video URL to data-embed on the player');
        return;
      }
      const f = document.createElement('iframe');
      f.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      f.title = 'Video sales letter';
      box.classList.add('playing');
      $('.vsl-screen', box).replaceChildren(f);
    });
  });

  /* Sticky CTA appears once the hero CTA scrolls away */
  const sticky = $('.sticky-cta');
  const anchor = $('[data-sticky-anchor]');
  if (sticky && anchor) {
    new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(anchor);
  }

  /* Current year */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
