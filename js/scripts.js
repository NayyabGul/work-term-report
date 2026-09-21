(() => {
  const header = document.querySelector('#site-header');
  const nav = document.querySelector('#navigation');
  const links = [...nav.querySelectorAll('.nav-link[data-section]')];
  const sectionControls = [...document.querySelectorAll('[data-section]')];
  const sections = [...document.querySelectorAll('main > section[data-tone]')];
  const roleTrack = document.querySelector('.role-track');
  const roleItems = [...document.querySelectorAll('.role-item')];
  const roleCount = document.querySelector('.role-count');
  const rolePrevious = document.querySelector('.role-prev');
  const roleNext = document.querySelector('.role-next');
  const reportDate = document.querySelector('#report-date');
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let roleIndex = 0;

  if (reportDate?.dateTime) {
    const date = new Date(`${reportDate.dateTime}T12:00:00`);
    if (!Number.isNaN(date.getTime())) {
      reportDate.textContent = new Intl.DateTimeFormat('en-CA', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }
  }

  function visibleRoleItems() {
    return window.innerWidth <= 750 ? 1 : 2;
  }

  function setRoleIndex(index, animate = true) {
    if (!roleTrack || !roleItems.length) return;

    const visibleItems = visibleRoleItems();
    const maxIndex = Math.max(0, roleItems.length - visibleItems);
    roleIndex = Math.max(0, Math.min(index, maxIndex));
    const offset = roleItems[roleIndex].offsetLeft - roleTrack.offsetLeft;

    if (!animate) roleTrack.style.transition = 'none';
    roleTrack.style.transform = `translate3d(${-offset}px, 0, 0)`;
    if (!animate) {
      requestAnimationFrame(() => {
        roleTrack.style.transition = '';
      });
    }

    const first = roleIndex + 1;
    const last = Math.min(roleIndex + visibleItems, roleItems.length);
    if (roleCount) {
      roleCount.textContent =
        visibleItems === 1
          ? `${String(first).padStart(2, '0')} / 04`
          : `${String(first).padStart(2, '0')}–${String(last).padStart(2, '0')} / 04`;
    }
    if (rolePrevious) rolePrevious.disabled = roleIndex === 0;
    if (roleNext) roleNext.disabled = roleIndex === maxIndex;
    roleItems.forEach((item, itemIndex) => {
      const visible = itemIndex >= roleIndex && itemIndex < roleIndex + visibleItems;
      item.setAttribute('aria-hidden', String(!visible));
    });
  }

  rolePrevious?.addEventListener('click', () => setRoleIndex(roleIndex - 1));
  roleNext?.addEventListener('click', () => setRoleIndex(roleIndex + 1));

  function scrollToSection(sectionId) {
    const target = sectionId === 'top' ? document.querySelector('#top') : document.querySelector(`#${sectionId}`);
    if (!target) return;

    const instantNavigation = prefersReducedMotion || window.innerWidth < 992;
    if (sectionId === 'role') setRoleIndex(0, false);
    document.documentElement.style.scrollSnapType = 'none';
    if (instantNavigation) document.documentElement.style.scrollBehavior = 'auto';
    const top =
      sectionId === 'top'
        ? 0
        : window.scrollY + target.getBoundingClientRect().top - header.offsetHeight;

    window.scrollTo({
      top,
      behavior: instantNavigation ? 'auto' : 'smooth',
    });

    window.setTimeout(
      () => {
        document.documentElement.style.scrollSnapType = '';
        document.documentElement.style.scrollBehavior = '';
        update();
      },
      instantNavigation ? 50 : 900
    );
  }

  // Move around without changing the URL hash.
  sectionControls.forEach((control) =>
    control.addEventListener('click', () => {
      const open = document.querySelector(
        '.navbar-collapse.show, .navbar-collapse.collapsing'
      );
      if (open && window.bootstrap) {
        bootstrap.Collapse.getOrCreateInstance(open).hide();
        window.setTimeout(() => {
          open.classList.remove('show', 'collapsing');
          open.classList.add('collapse');
          open.style.height = '';
          document
            .querySelector('[data-bs-target="#navigation"]')
            ?.setAttribute('aria-expanded', 'false');
          scrollToSection(control.dataset.section);
        }, 380);
      } else {
        scrollToSection(control.dataset.section);
      }
    })
  );

  // Which section is under the header right now?
  function sectionUnderHeader() {
    const line = header.offsetHeight + Math.min(180, window.innerHeight * 0.25);
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
    }
    return current;
  }

  function update() {
    const current = sectionUnderHeader();

    // 1. Keep the header contrasted with the section beneath it.
    header.dataset.tone = current.dataset.tone === 'dark' ? 'light' : 'dark';
    sections.forEach((section) =>
      section.classList.toggle('section-active', section === current)
    );

    // 2. Highlight the matching nav link. At the very bottom of the page,
    //    the last section wins even if it is too short to reach the top.
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const active = atBottom ? sections[sections.length - 1] : current;
    links.forEach((a) => {
      if (a.dataset.section === active.id) a.setAttribute('aria-current', 'location');
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
  window.addEventListener('resize', () => {
    setRoleIndex(roleIndex, false);
    onScroll();
  });
  window.addEventListener('load', update);
  window.addEventListener('pageshow', () => setRoleIndex(0, false));
  setRoleIndex(0, false);
  update();

  // Gentle reveal for the column, question, and acknowledgment blocks
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
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
    document
      .querySelectorAll('.role-item, .goals-column')
      .forEach((el) => {
        el.classList.add('reveal', 'pending');
        observer.observe(el);
      });
  }
})();
