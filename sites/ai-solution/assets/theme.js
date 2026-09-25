(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;

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

  /* Prompt demo: cycles example tasks, then sketches an agent plan for whatever is typed */
  $$('[data-prompt]').forEach((form) => {
    const input = $('input', form);
    const plan = $('.plan', form.parentElement);
    const examples = [
      'Qualify inbound leads and book calls with the right rep',
      'Reconcile invoices in Xero every Friday',
      'Summarise support tickets into Slack each morning',
      'Draft replies to RFP questionnaires from our docs',
    ];

    // Typewriter placeholder, paused while the field is focused or filled
    let ex = 0;
    let ch = 0;
    let deleting = false;
    const type = () => {
      if (document.activeElement !== input && !input.value) {
        const text = examples[ex];
        ch += deleting ? -1 : 1;
        input.placeholder = text.slice(0, ch);
        if (!deleting && ch >= text.length) {
          deleting = true;
          return setTimeout(type, 1800);
        }
        if (deleting && ch <= 0) {
          deleting = false;
          ex = (ex + 1) % examples.length;
        }
      }
      setTimeout(type, deleting ? 22 : 45);
    };
    if (!reduce) type();
    else input.placeholder = examples[0];

    const recipes = [
      { re: /lead|inbound|book|call|demo|sales/i, steps: ['Trigger: a new lead lands in your CRM or inbox', 'Agent enriches the record and scores it against your ideal customer', 'Qualified leads get a booking link; the rest get nurtured automatically'], tools: 'HubSpot · Gmail · Calendar' },
      { re: /invoice|xero|finance|reconcil|payment|expense/i, steps: ['Trigger: every Friday at 9am', 'Agent matches invoices to bank lines and chases missing receipts', 'Mismatches are flagged in Slack for a person to approve'], tools: 'Xero · Slack · Drive' },
      { re: /support|ticket|customer|complaint|help/i, steps: ['Trigger: new tickets in your help desk', 'Agent tags, summarises and drafts a reply from your docs', 'A daily digest of trends lands in Slack at 8am'], tools: 'Zendesk · Notion · Slack' },
      { re: /rfp|proposal|questionnaire|tender|doc/i, steps: ['Trigger: an RFP or questionnaire is uploaded', 'Agent drafts every answer from your past bids and knowledge base', 'Your team reviews, edits and exports in one place'], tools: 'Drive · Notion · Word' },
    ];
    const generic = { steps: ['Trigger: whenever this task comes in', 'Agent completes it using your docs, data and tools', 'A person approves anything important before it goes out'], tools: 'Your existing tools' };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = input.value.trim() || input.placeholder;
      const r = recipes.find((x) => x.re.test(task)) || generic;
      const day = task.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
      const when = day ? `Trigger: every ${day[1][0].toUpperCase()}${day[1].slice(1).toLowerCase()} at 9am` : /daily|every (day|morning)/i.test(task) ? 'Trigger: every morning at 8am' : null;
      const steps = r.steps.map((s, i) => (i === 0 && when && /^Trigger: (every|whenever)/.test(s) ? when : s));
      const hours = 6 + (task.length % 13);
      plan.replaceChildren();

      const h = document.createElement('h4');
      h.append(document.createElement('i'), `How we'd automate: “${task}”`);
      const ol = document.createElement('ol');
      steps.forEach((s) => {
        const li = document.createElement('li');
        li.textContent = s;
        ol.append(li);
      });
      const foot = document.createElement('div');
      foot.className = 'foot';
      const est = document.createElement('span');
      const b = document.createElement('b');
      b.textContent = `~${hours} hours/week`;
      est.append('Saves ', b, ` · ${r.tools}`);
      const cta = document.createElement('a');
      cta.className = 'pill blue';
      cta.href = '#book';
      cta.textContent = 'Build this for me';
      foot.append(est, cta);
      plan.append(h, ol, foot);
      plan.classList.add('show');
      if (gsap && !reduce) gsap.from(plan.children, { y: 12, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
    });
  });

  /* Floating collaborator cursors */
  if (gsap && !reduce) {
    $$('.cursor').forEach((c, i) => {
      const drift = () =>
        gsap.to(c, {
          x: gsap.utils.random(-40, 40),
          y: gsap.utils.random(-24, 24),
          duration: gsap.utils.random(2.2, 3.6),
          ease: 'sine.inOut',
          onComplete: drift,
        });
      gsap.from(c, { opacity: 0, scale: 0.6, duration: 0.8, delay: 1 + i * 0.25, ease: 'back.out(2)' });
      drift();
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

  /* Sticky CTA appears once the hero CTA scrolls away */
  const sticky = $('.sticky-cta');
  const anchor = $('[data-sticky-anchor]');
  if (sticky && anchor) {
    new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(anchor);
  }

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
