(() => {
  const header = document.querySelector('#site-header');
  const nav = document.querySelector('#navigation');
  const links = [...nav.querySelectorAll('a.nav-link')];
  const sections = [...document.querySelectorAll('main > section[data-tone]')];
  const reportDate = document.querySelector('#report-date');

  if (reportDate) {
    const date = new Date(`${reportDate.dateTime}T12:00:00`);
    reportDate.textContent = new Intl.DateTimeFormat('en-CA', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  // Close the mobile menu after picking a link
  links.forEach((a) =>
    a.addEventListener('click', () => {
      const open = document.querySelector('.navbar-collapse.show');
      if (open && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(open).hide();
    })
  );

  // Which section is under the header right now?
  function sectionUnderHeader() {
    const line = header.offsetHeight + 4;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
    }
    return current;
  }

  function update() {
    const current = sectionUnderHeader();

    // 1. Recolor the header to match the section beneath it
    header.dataset.tone = current.dataset.tone;
    header.style.setProperty('--header-bg', getComputedStyle(current).backgroundColor);

    // 2. Highlight the matching nav link. At the very bottom of the page,
    //    the last section wins even if it is too short to reach the top.
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const active = atBottom ? sections[sections.length - 1] : current;
    links.forEach((a) => {
      if (a.hash === '#' + active.id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
  update();

  // Gentle reveal for the column, question, and acknowledgment blocks
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('pending');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.04 }
    );
    document.querySelectorAll('.role-col, .qa, .ack-item').forEach((el) => {
      el.classList.add('reveal', 'pending');
      observer.observe(el);
    });
  }
})();
