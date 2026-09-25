(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

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

  /* Post cards: like toggles, comment and share give feedback */
  const fmt = (n) => n.toLocaleString('en-GB');
  $$('.post').forEach((post) => {
    const like = $('[data-like]', post);
    if (like) {
      const count = $('span', like);
      like.addEventListener('click', () => {
        const n = parseInt(count.textContent.replace(/\D/g, ''), 10) || 0;
        const on = like.classList.toggle('liked');
        like.setAttribute('aria-pressed', String(on));
        count.textContent = fmt(n + (on ? 1 : -1));
      });
    }
    $('[data-comment]', post)?.addEventListener('click', () => say('Comments are where the pipeline starts.'));
    $('[data-share]', post)?.addEventListener('click', () => say('Reposted to 2,400 followers'));
  });

  /* Vertical testimonial marquee: duplicate each column so it loops seamlessly */
  $$('.col-track').forEach((t) =>
    t.append(
      ...[...t.children].map((c) => {
        const k = c.cloneNode(true);
        k.setAttribute('aria-hidden', 'true');
        return k;
      })
    )
  );

  /* Before / after rewrite toggle */
  $$('[data-rewrite]').forEach((root) => {
    const btns = $$('.toggle button', root);
    const sides = $$('[data-side]', root);
    const show = (side) => {
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.show === side)));
      sides.forEach((s) => s.classList.toggle('on', s.dataset.side === side));
      if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.from($(`[data-side="${side}"]`, root).children, { y: 10, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' });
      }
    };
    btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.show)));
  });

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

  /* Sticky CTA appears once the hero CTA scrolls away, hides at the final CTA */
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
