(() => {
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Scroll reveal */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  $$('[data-reveal]').forEach((el) => io.observe(el));

  /* Logo marquee: duplicate the track so it loops seamlessly */
  $$('.marquee-track').forEach((t) => t.append(...[...t.children].map((c) => {
    const k = c.cloneNode(true);
    k.setAttribute('aria-hidden', 'true');
    return k;
  })));

  /* Testimonial carousel (quotes + matching portraits) */
  $$('[data-carousel]').forEach((root) => {
    const slides = $$('.slide', root);
    const portraits = $$('.portrait', root);
    const who = $('[data-who]', root);
    const count = $('.count', root);
    let i = 0;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.toggle('on', k === i);
        s.setAttribute('aria-hidden', String(k !== i));
      });
      portraits.forEach((p, k) => p.classList.toggle('on', k === i));
      if (who) who.textContent = `— ${slides[i].dataset.name}`;
      if (count) count.innerHTML = `${String(i + 1).padStart(2, '0')}<span>/${String(slides.length).padStart(2, '0')}</span>`;
    };
    $('[data-prev]', root)?.addEventListener('click', () => show(i - 1));
    $('[data-next]', root)?.addEventListener('click', () => show(i + 1));
    show(0);
  });

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

  /* Sticky CTA appears once the hero CTA scrolls away */
  const sticky = $('.sticky-cta');
  const anchor = $('[data-sticky-anchor]');
  if (sticky && anchor) {
    new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(anchor);
  }

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
