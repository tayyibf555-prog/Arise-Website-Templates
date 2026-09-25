/*
  Renders client testimonials from window.TESTIMONIALS (set in sites/<offer>/assets/testimonials.js).

  <section class="tbar" data-tbar> … <div class="tbar-viewport"><div class="tbar-track"></div></div></section>
      → horizontally scrolling bar of every testimonial
  <div data-tgrid="4"></div>
      → the first N testimonials as result cards (thank-you pages)
  [data-circle] → hand-drawn circle that draws itself when scrolled into view
*/
(() => {
  const data = window.TESTIMONIALS || [];
  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  const initials = (name) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const card = (t) => {
    const fig = make('figure', 'tcard');
    const top = make('div', 'tcard-top');
    top.append(make('span', 'tcard-result', t.result), make('span', 'tcard-stars', '★★★★★'));
    const cap = make('figcaption');
    const who = make('div');
    who.append(make('b', null, t.name), make('small', null, t.role));
    cap.append(make('span', 'tcard-av', initials(t.name)), who);
    fig.append(top, make('blockquote', null, `“${t.quote}”`), cap);
    return fig;
  };

  document.querySelectorAll('[data-tbar]').forEach((root) => {
    const track = root.querySelector('.tbar-track');
    if (!track || !data.length) return;
    const clones = data.map(card);
    clones.forEach((c) => c.setAttribute('aria-hidden', 'true'));
    track.append(...data.map(card), ...clones);
    track.style.setProperty('--tb-speed', `${Math.max(36, data.length * 9)}s`);
  });

  document.querySelectorAll('[data-tgrid]').forEach((root) => {
    const n = parseInt(root.dataset.tgrid, 10) || 4;
    data.slice(0, n).forEach((t) => {
      const item = make('article', 'tresult');
      const head = make('div', 'tresult-head');
      head.append(make('h3', 'tresult-result', t.result), make('p', 'tresult-who', `${t.name} | ${t.role}`));
      const quote = make('blockquote', 'tresult-quote');
      quote.append(make('span', 'tresult-stars', '★★★★★'), make('p', null, `“${t.quote}”`));
      item.append(head, quote);
      root.append(item);
    });
  });

  const circles = document.querySelectorAll('[data-circle]');
  if (circles.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('drawn'), io.unobserve(e.target))),
      { threshold: 0.6 }
    );
    circles.forEach((c) => io.observe(c));
  }
})();
