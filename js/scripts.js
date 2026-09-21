(() => {
  const header = document.querySelector('#site-header');
  const nav = document.querySelector('#navigation');
  const links = [...nav.querySelectorAll('.nav-link[data-section]')];
  const sectionControls = [...document.querySelectorAll('[data-section]')];
  const sections = [...document.querySelectorAll('main > section[data-tone]')];
  const roleSection = document.querySelector('#role');
  const rolePages = [...document.querySelectorAll('[data-role-page]')];
  const roleCount = document.querySelector('.role-count');
  const reportDate = document.querySelector('#report-date');
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paging = false;
  let activeIndex = 0;
  let allowLongJump = false;
  let settleTimer = null;
  let targetIndex = null;
  let initialized = false;
  let rolePageIndex = 0;
  let rolePaging = false;

  if (reportDate) {
    const date = new Date(`${reportDate.dateTime}T12:00:00`);
    reportDate.textContent = new Intl.DateTimeFormat('en-CA', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  function setRolePage(index, animate = true) {
    const nextIndex = Math.max(0, Math.min(index, rolePages.length - 1));
    rolePageIndex = nextIndex;

    if (!animate) roleSection?.classList.add('role-no-motion');
    rolePages.forEach((page, pageIndex) => {
      const active = pageIndex === nextIndex;
      page.classList.toggle('is-active', active);
      page.setAttribute('aria-hidden', String(!active));
    });
    if (roleCount) roleCount.textContent = nextIndex === 0 ? '01–02 / 04' : '03–04 / 04';
    if (!animate) requestAnimationFrame(() => roleSection?.classList.remove('role-no-motion'));
  }

  function stepRole(direction) {
    if (window.innerWidth < 992 || rolePaging) return false;
    const nextIndex = rolePageIndex + direction;
    if (!rolePages[nextIndex]) return false;

    rolePaging = true;
    setRolePage(nextIndex);
    window.setTimeout(() => {
      rolePaging = false;
    }, prefersReducedMotion ? 0 : 520);
    return true;
  }

  function scrollToSection(sectionId) {
    const target = sectionId === 'top' ? document.querySelector('#top') : document.querySelector(`#${sectionId}`);
    if (!target) return;

    allowLongJump = true;
    if (sectionId === 'role') setRolePage(0, false);
    document.documentElement.style.scrollSnapType = 'none';
    const top =
      sectionId === 'top'
        ? 0
        : window.scrollY + target.getBoundingClientRect().top - header.offsetHeight;

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });

    window.setTimeout(
      () => {
        document.documentElement.style.scrollSnapType = '';
        activeIndex = Math.max(0, sections.indexOf(sectionUnderHeader()));
        allowLongJump = false;
        update();
      },
      prefersReducedMotion ? 0 : 900
    );
  }

  // Move around without changing the URL hash.
  sectionControls.forEach((control) =>
    control.addEventListener('click', () => {
      scrollToSection(control.dataset.section);
      const open = document.querySelector('.navbar-collapse.show');
      if (open && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(open).hide();
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
    const currentIndex = sections.indexOf(current);

    if (!initialized) {
      activeIndex = currentIndex;
      initialized = true;
    }

    if (!paging && !allowLongJump && Math.abs(currentIndex - activeIndex) > 1) {
      snapToIndex(activeIndex + Math.sign(currentIndex - activeIndex));
      return;
    }

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

    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      activeIndex = sections.indexOf(sectionUnderHeader());
    }, prefersReducedMotion ? 0 : 850);
  }

  function canScrollInside(section, direction) {
    const rect = section.getBoundingClientRect();
    if (section.offsetHeight <= window.innerHeight + 12) return false;

    const topLimit = header.offsetHeight + 10;
    const bottomLimit = window.innerHeight - 10;

    if (direction > 0) return rect.bottom > bottomLimit;
    return rect.top < topLimit;
  }

  function pageTo(direction) {
    if (paging) return;

    const current = sectionUnderHeader();
    if (canScrollInside(current, direction)) return;

    const currentIndex = sections.indexOf(current);
    const next = sections[currentIndex + direction];
    if (!next) return;

    snapToIndex(currentIndex + direction);
  }

  function snapToIndex(index) {
    const next = sections[index];
    if (!next || paging) return;

    const currentIndex = sections.indexOf(sectionUnderHeader());
    if (next === roleSection) setRolePage(index > currentIndex ? 0 : rolePages.length - 1, false);

    paging = true;
    targetIndex = index;
    next.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    window.setTimeout(() => {
      const landedIndex = sections.indexOf(sectionUnderHeader());
      if (targetIndex !== null && landedIndex !== targetIndex) {
        sections[targetIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      paging = false;
      activeIndex = targetIndex ?? sections.indexOf(sectionUnderHeader());
      targetIndex = null;
      update();
    }, prefersReducedMotion ? 0 : 760);
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
  window.addEventListener('pageshow', () => setRolePage(0, false));
  window.addEventListener(
    'wheel',
    (event) => {
      const direction = Math.sign(event.deltaY);
      if (!direction || Math.abs(event.deltaY) < 16) return;

      const current = sectionUnderHeader();
      if (current === roleSection && stepRole(direction)) {
        event.preventDefault();
        return;
      }
      if (!canScrollInside(current, direction)) {
        event.preventDefault();
        pageTo(direction);
      }
    },
    { passive: false }
  );

  let touchStartY = null;
  window.addEventListener(
    'touchstart',
    (event) => {
      touchStartY = event.touches[0]?.clientY ?? null;
    },
    { passive: true }
  );
  window.addEventListener(
    'touchmove',
    (event) => {
      if (touchStartY === null) return;

      const distance = touchStartY - (event.touches[0]?.clientY ?? touchStartY);
      if (Math.abs(distance) < 54) return;

      const direction = Math.sign(distance);
      const current = sectionUnderHeader();
      if (current === roleSection && stepRole(direction)) {
        event.preventDefault();
        touchStartY = null;
        return;
      }
      if (!canScrollInside(current, direction)) {
        event.preventDefault();
        touchStartY = null;
        pageTo(direction);
      }
    },
    { passive: false }
  );
  window.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key)) return;
    if (event.target.closest('button, a, input, textarea, select')) return;

    const direction = event.key === 'ArrowDown' || event.key === 'PageDown' ? 1 : -1;
    const current = sectionUnderHeader();
    if (current === roleSection && stepRole(direction)) {
      event.preventDefault();
    }
  });
  if (!prefersReducedMotion) {
    sections.forEach((section) => section.classList.add('section-motion'));
  }
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
