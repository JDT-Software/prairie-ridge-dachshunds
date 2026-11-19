(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Live litter dates ---------- */
  const DAY = 864e5;
  const BORN = new Date(2026, 9, 15);      // Oct 15, 2026
  const GO_HOME = new Date(2026, 11, 28);  // Dec 28, 2026
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const ageDays = Math.max(0, Math.round((today - BORN) / DAY));
  const ageEl = $('[data-age]');
  if (ageEl) ageEl.textContent = ageDays < 14 ? `${ageDays} days` : `${Math.floor(ageDays / 7)} wks`;

  const daysLeft = Math.round((GO_HOME - today) / DAY);
  const daysEl = $('[data-days]');
  const labelEl = $('[data-countdown-label]');
  if (daysEl) {
    if (daysLeft > 0) {
      daysEl.textContent = daysLeft;
      daysEl.dataset.count = daysLeft;
      if (daysLeft === 1) daysEl.nextElementSibling.textContent = 'day';
    } else {
      daysEl.textContent = '✓';
      daysEl.nextElementSibling.textContent = '';
      labelEl.textContent = 'The Grace Litter has gone home';
    }
  }
  $$('[data-year]').forEach(el => (el.textContent = today.getFullYear()));

  /* ---------- Mobile menu ---------- */
  const nav = $('[data-nav]');
  const toggle = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });

  /* ---------- No GSAP? Show everything, use native gallery ---------- */
  const gallery = $('.gallery');
  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.remove('js');
    gallery.classList.add('is-native');
    nav.classList.add('is-solid');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: 'power3.out', duration: 1 });

  const hero = $('.hero');
  const heroImg = $('[data-hero-img]');
  const heroTitle = $('[data-hero-title]');
  const heroFades = $$('[data-hero-fade]');

  /* ---------- Nav: solid after hero, hide on scroll down ---------- */
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > hero.offsetHeight - 90);
      const hide = self.direction === 1 && y > window.innerHeight && !nav.classList.contains('is-open');
      nav.classList.toggle('is-hidden', hide);
    }
  });

  const init = () => {
    const mm = gsap.matchMedia();

    /* ===== Horizontal gallery (desktop + motion) / native swipe otherwise ===== */
    mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
      gallery.classList.remove('is-native');
      const track = $('[data-gallery]');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.timeline({
        scrollTrigger: {
          trigger: '.gallery__pin', pin: true, scrub: 0.6,
          start: 'top top', end: () => '+=' + distance(),
          invalidateOnRefresh: true
        }
      })
        .to(track, { x: () => -distance(), ease: 'none' }, 0)
        .to('[data-gallery-bar]', { scaleX: 1, ease: 'none' }, 0);
      return () => gallery.classList.add('is-native');
    });


    mm.add({
      motion: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)'
    }, ctx => {
      const { motion } = ctx.conditions;

      /* ===== Reduced motion: show it all, no choreography ===== */
      if (!motion) {
        gsap.set([heroTitle, ...heroFades], { autoAlpha: 1 });
        return;
      }

      /* ===== Hero intro ===== */
      const split = SplitText.create(heroTitle, { type: 'lines', mask: 'lines', linesClass: 'line' });
      gsap.set(heroTitle, { autoAlpha: 1 });
      gsap.timeline({ onComplete: () => split.revert() })
        .fromTo(heroImg, { scale: 1.22 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 0)
        .from(split.lines, { yPercent: 115, duration: 1.3, stagger: 0.14, ease: 'expo.out' }, 0.25)
        .fromTo(heroFades, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.75);

      // Hero parallax out
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
        .to(heroImg, { yPercent: 14, ease: 'none' }, 0)
        .to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none' }, 0);

      /* ===== Marquee: loops forever, speeds up with scroll velocity ===== */
      const marquee = gsap.to('[data-marquee]', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate(self) {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 5);
          gsap.to(marquee, {
            timeScale: boost, duration: 0.25, overwrite: true,
            onComplete: () => gsap.to(marquee, { timeScale: 1, duration: 1.2, overwrite: true })
          });
        }
      });

      /* ===== The big 7 ===== */
      const seven = $('.litter__seven');
      gsap.from(seven, {
        textContent: 0, snap: { textContent: 1 }, yPercent: 20, rotate: -6, autoAlpha: 0,
        duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: '#litter', start: 'top 70%' }
      });

      /* ===== Counters ===== */
      $$('.stats [data-count], [data-days][data-count]').forEach(el => {
        gsap.from(el, {
          textContent: 0, snap: { textContent: 1 }, duration: 1.4, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      });

      /* ===== Generic reveals ===== */
      const reveals = $$('[data-reveal]');
      gsap.set(reveals, { autoAlpha: 0, y: 36 });
      ScrollTrigger.batch(reveals, {
        start: 'top 88%',
        onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09, overwrite: true })
      });

      $$('[data-reveal-group]').forEach(group => {
        gsap.from(group.children, {
          autoAlpha: 0, y: 40, duration: 1, stagger: 0.1,
          scrollTrigger: { trigger: group, start: 'top 85%' }
        });
      });

      /* ===== Image clip reveals + parallax ===== */
      $$('[data-clip]').forEach(fig => {
        const img = $('img', fig);
        gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%' } })
          .fromTo(fig, { clipPath: 'inset(14% 10% 14% 10% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.6, ease: 'expo.out' }, 0)
          .from(img, { scale: 1.25, duration: 1.8, ease: 'expo.out' }, 0)
          .from($$('.profile__tag', fig), { autoAlpha: 0, y: 12, duration: 0.8 }, 0.7);
      });
      $$('[data-parallax]').forEach(img => {
        gsap.fromTo(img, { yPercent: -7 }, {
          yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

      /* ===== Process timeline ===== */
      const steps = $('[data-steps]');
      gsap.to('[data-steps-fill]', {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: steps, start: 'top 60%', end: 'bottom 60%', scrub: true }
      });
      $$('.step', steps).forEach(step => {
        ScrollTrigger.create({
          trigger: step, start: 'top 60%',
          onEnter: () => step.classList.add('is-active'),
          onLeaveBack: () => step.classList.remove('is-active')
        });
        gsap.from(step.querySelectorAll('.step__n, .step > div'), {
          autoAlpha: 0, x: 24, duration: 0.9, stagger: 0.06,
          scrollTrigger: { trigger: step, start: 'top 85%' }
        });
      });

      /* ===== Statement: words light up as you scroll ===== */
      const statement = $('[data-scrub-words]');
      const words = SplitText.create(statement, { type: 'words', wordsClass: 'w' });
      gsap.to(words.words, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true }
      });

      return () => words.revert();
    });

    // Active link per section
    $$('.nav__links a').forEach(link => {
      const sec = $(link.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: self => link.classList.toggle('is-active', self.isActive)
      });
    });

    // Gallery pin spacing shifts everything below it: refresh in page order.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();

  };

  document.fonts.ready.then(init);
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
