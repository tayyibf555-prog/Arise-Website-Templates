/*
  Motion: opt-in GSAP animations driven by data attributes.
  Load after gsap.min.js, ScrollTrigger.min.js and SplitText.min.js.

  data-split             headline lines slide up out of a mask when scrolled into view
  data-split="load"      same, but plays on page load (for hero headlines)
  data-delay="0.2"       delay for data-split (seconds)
  data-count             count up to the number in the element's text ("£12m", "1,200+", "3.4x")
                         — use on an element with text only, no child elements
  data-parallax="-0.15"  drift vertically while its section scrolls past (fraction of own height)
  data-grow              scale from 0.9 to 1 as it scrolls into view
  data-stagger           children rise in one after another when the container enters
  data-magnetic          pulls slightly towards the cursor on hover
  data-rotate="A, B, C"  word rotator: cycles through the words in place (e.g. inside a headline);
                         the element's text is the first word. data-hold sets seconds per word.

  Don't combine these with a CSS transform animation on the same element;
  put the attribute on a child instead.
*/
(() => {
  const gsap = window.gsap;
  if (!gsap) return;
  const ST = window.ScrollTrigger;
  const Split = window.SplitText;
  if (ST) gsap.registerPlugin(ST);
  if (Split) gsap.registerPlugin(Split);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s) => [...document.querySelectorAll(s)];

  /* Word rotator — screen readers get the full list, the visible word cycles */
  const rotators = $$('[data-rotate]');
  if (rotators.length) {
    const css = document.createElement('style');
    css.textContent =
      '.rotate{display:inline-block;position:relative;white-space:nowrap;clip-path:inset(-0.1em -0.4em -0.3em -0.4em)}' +
      '.rotate-word{display:inline-block;white-space:nowrap}' +
      '.rotate-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
    document.head.append(css);

    rotators.forEach((el) => {
      const words = el.dataset.rotate.split(',').map((w) => w.trim()).filter(Boolean);
      if (words.length < 2) return;
      const sr = document.createElement('span');
      sr.className = 'rotate-sr';
      sr.textContent = words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1];
      el.after(sr);
      el.setAttribute('aria-hidden', 'true');
      el.classList.add('rotate');
      if (reduce) return; // keep the first word, no auto-changing text

      const make = (w) => {
        const s = document.createElement('span');
        s.className = 'rotate-word';
        s.textContent = w;
        return s;
      };
      const measure = (w) => {
        const probe = make(w);
        probe.style.cssText = 'position:absolute;visibility:hidden';
        el.append(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return width;
      };
      const hold = parseFloat(el.dataset.hold || '2.2');
      let i = 0;
      let cur;

      const start = () => {
        el.textContent = '';
        cur = make(words[0]);
        el.append(cur);
        gsap.set(el, { width: measure(words[0]) });
        gsap.delayedCall(hold + 0.6, next);
      };
      const next = () => {
        i = (i + 1) % words.length;
        const incoming = make(words[i]);
        incoming.style.cssText = 'position:absolute;left:0;top:0';
        el.append(incoming);
        const outgoing = cur;
        cur = incoming;
        gsap
          .timeline({
            onComplete: () => {
              outgoing.remove();
              incoming.style.cssText = '';
              gsap.delayedCall(hold, next);
            },
          })
          .to(outgoing, { yPercent: -80, opacity: 0, filter: 'blur(8px)', duration: 0.55, ease: 'power3.in' }, 0)
          .to(el, { width: measure(words[i]), duration: 0.8, ease: 'power3.inOut' }, 0.1)
          .fromTo(
            incoming,
            { yPercent: 80, opacity: 0, filter: 'blur(8px)' },
            { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' },
            0.3
          );
      };
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
    });
  }

  if (reduce) return;
  const once = (el, start = 'top 88%') => (ST ? { trigger: el, start, once: true } : undefined);

  /* Count-up numbers */
  $$('[data-count]').forEach((el) => {
    if (el.children.length) return;
    const m = el.textContent.trim().match(/^([^\d]*?)([\d,]*\.?\d+)(.*)$/);
    if (!m) return;
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(/,/g, ''));
    const decimals = (num.split('.')[1] || '').length;
    const commas = num.includes(',');
    const fmt = (v) => {
      const s = v.toFixed(decimals);
      return commas ? Number(s).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s;
    };
    const o = { v: 0 };
    el.style.fontVariantNumeric = 'tabular-nums';
    el.textContent = pre + fmt(0) + post;
    gsap.to(o, {
      v: target,
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: once(el, 'top 92%'),
      onUpdate: () => (el.textContent = pre + fmt(o.v) + post),
    });
  });

  /* Parallax drift */
  if (ST) {
    $$('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax || '-0.15');
      const zone = el.closest('section, header, footer') || el;
      gsap.fromTo(
        el,
        { yPercent: -amt * 50 },
        { yPercent: amt * 50, ease: 'none', scrollTrigger: { trigger: zone, start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    });

    /* Grow into view */
    $$('[data-grow]').forEach((el) => {
      gsap.fromTo(
        el,
        { scale: 0.9, transformOrigin: '50% 100%' },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: 0.6 } }
      );
    });
  }

  /* Staggered children */
  $$('[data-stagger]').forEach((el) => {
    gsap.from(el.children, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: once(el),
    });
  });

  /* Magnetic buttons */
  if (matchMedia('(hover: hover)').matches) {
    $$('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.25);
        y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => {
        x(0);
        y(0);
      });
    });
  }

  /* Split headlines — after fonts load so line breaks are measured correctly */
  const splitAll = () => {
    if (!Split) return;
    $$('[data-split]').forEach((el) => {
      const onLoad = el.dataset.split === 'load';
      Split.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) => {
          // Give each line mask room for descenders (g, y, p) without changing line spacing
          (self.masks || []).forEach((m) => {
            m.style.paddingBottom = '0.16em';
            m.style.marginBottom = '-0.16em';
          });
          return gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.15,
            ease: 'expo.out',
            stagger: 0.09,
            delay: parseFloat(el.dataset.delay || (onLoad ? '0.15' : '0')),
            scrollTrigger: onLoad ? undefined : once(el),
          });
        },
      });
    });
    if (ST) ST.refresh();
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(splitAll);
})();
