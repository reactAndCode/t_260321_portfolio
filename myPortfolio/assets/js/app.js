(function () {
  const data = window.PORTFOLIO_SITE_DATA;
  const root = document.getElementById("app");
  const page = document.body.dataset.page || "home";
  const isNested = document.body.dataset.depth === "nested";
  const localeKey = "portfolio-locale";
  const pathMap = {
    home: isNested ? "../index.html" : "./index.html",
    projects: isNested ? "../projects/index.html" : "./projects/index.html",
    services: isNested ? "../services/index.html" : "./services/index.html",
    about: isNested ? "../about/index.html" : "./about/index.html",
    contact: isNested ? "../contact/index.html" : "./contact/index.html"
  };

  render(getInitialLocale());

  function getInitialLocale() {
    const saved = window.localStorage.getItem(localeKey);
    if (saved === "ko" || saved === "en") return saved;

    const queryValue = new URLSearchParams(window.location.search).get("lang");
    if (queryValue === "ko" || queryValue === "en") {
      window.localStorage.setItem(localeKey, queryValue);
      return queryValue;
    }

    return "ko";
  }

  function t(value, locale) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.ko || "";
  }

  function render(locale) {
    document.documentElement.lang = locale;
    root.innerHTML = `
      <div class="site-shell">
        ${renderHeader(locale)}
        <main class="page">${renderPage(page, locale)}</main>
        ${renderFooter(locale)}
      </div>
    `;

    document.querySelectorAll("[data-locale]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextLocale = button.dataset.locale;
        window.localStorage.setItem(localeKey, nextLocale);
        render(nextLocale);
      });
    });

    bindReveal();
  }

  function renderHeader(locale) {
    const nav = Object.entries(data.navigation)
      .map(([key, label]) => {
        const current = key === page || (page === "not-found" && key === "home") ? "is-current" : "";
        return `<a class="${current}" href="${pathMap[key]}">${t(label, locale)}</a>`;
      })
      .join("");

    return `
      <header class="topbar">
        <div class="topbar__inner">
          <a class="brand" href="${pathMap.home}">
            <span class="brand__mark">SB</span>
            <span class="brand__text">${data.profile.name}<span>${t(data.profile.role, locale)}</span></span>
          </a>
          <nav class="nav">${nav}</nav>
          <div class="lang-switch" aria-label="${t(data.labels.locale, locale)}">
            <button type="button" data-locale="ko" class="${locale === "ko" ? "is-active" : ""}">KR</button>
            <button type="button" data-locale="en" class="${locale === "en" ? "is-active" : ""}">EN</button>
          </div>
        </div>
      </header>
    `;
  }

  function renderFooter(locale) {
    return `
      <footer class="footer">
        <div class="footer__inner">
          <div>${data.profile.name} · ${t(data.profile.location, locale)}</div>
          <div>${t(data.labels.footer, locale)}</div>
        </div>
      </footer>
    `;
  }

  function renderPage(pageKey, locale) {
    const renderers = {
      home: renderHome,
      projects: renderProjects,
      services: renderServices,
      about: renderAbout,
      contact: renderContact,
      "not-found": renderNotFound
    };

    return renderers[pageKey](locale);
  }

  function renderHome(locale) {
    return `
      <section class="hero section">
        <div class="hero__grid">
          <div class="reveal">
            <div class="eyebrow">${t(data.home.eyebrow, locale)}</div>
            <h1>${t(data.home.title, locale)}</h1>
            <p>${t(data.home.summary, locale)}</p>
            <div class="hero__actions">
              <a class="button" href="${pathMap.contact}">${t(data.labels.ctaPrimary, locale)}</a>
              <a class="button--ghost" href="${pathMap.projects}">${t(data.labels.ctaSecondary, locale)}</a>
            </div>
          </div>
          <div class="panel reveal">
            <span class="panel__orb panel__orb--one"></span>
            <span class="panel__orb panel__orb--two"></span>
            <div class="panel__content">
              <div class="panel__label">${t(data.home.panel.label, locale)}</div>
              <div class="panel__headline">${t(data.home.panel.headline, locale)}</div>
              <p>${t(data.home.panel.body, locale)}</p>
              <div class="panel__metrics">
                ${data.home.panel.metrics
                  .map(
                    (metric) => `
                      <div class="metric">
                        <strong>${metric.value}</strong>
                        <span>${t({ ko: metric.ko, en: metric.en }, locale)}</span>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-title reveal">
          <div class="eyebrow">${t(data.labels.builtFor, locale)}</div>
          <h2>${t({ ko: "서비스와 운영이 만나는 지점에 집중합니다.", en: "Focused where service experience meets operations." }, locale)}</h2>
        </div>
        <div class="kpi-grid">
          ${data.home.kpis
            .map(
              (item) => `
                <article class="kpi reveal">
                  <strong>${item.value}</strong>
                  <div class="kpi__text">${t(item.text, locale)}</div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
      <section class="section">
        <div class="split-grid">
          ${data.home.highlights
            .map(
              (item) => `
                <article class="card reveal">
                  <div class="meta-label">${t(data.home.eyebrow, locale)}</div>
                  <h3>${t(item.title, locale)}</h3>
                  <p>${t(item.body, locale)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderServices(locale) {
    return `
      <section class="section page-title">
        <div class="reveal">
          <div class="eyebrow">${t(data.navigation.services, locale)}</div>
          <h1>${t(data.services.title, locale)}</h1>
          <p>${t(data.services.summary, locale)}</p>
        </div>
      </section>
      <section class="section">
        <div class="service-grid">
          ${data.services.items
            .map(
              (item) => `
                <article class="service-card reveal">
                  <div class="service-card__top">
                    <div class="meta-label">${t(data.navigation.services, locale)}</div>
                    <div class="service-card__meta">${t(item.meta, locale)}</div>
                  </div>
                  <h3>${t(item.title, locale)}</h3>
                  <p>${t(item.body, locale)}</p>
                  <div class="chip-row">${item.chips.map((chip) => `<span class="chip">${chip}</span>`).join("")}</div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderProjects(locale) {
    return `
      <section class="section page-title">
        <div class="reveal">
          <div class="eyebrow">${t(data.navigation.projects, locale)}</div>
          <h1>${t(data.projects.title, locale)}</h1>
          <p>${t(data.projects.summary, locale)}</p>
        </div>
      </section>
      <section class="section">
        <div class="project-grid">
          ${data.projects.items
            .map(
              (item) => `
                <article class="project-card reveal">
                  <div class="project-card__top">
                    <div class="meta-label">${t(data.navigation.projects, locale)}</div>
                    <div class="project-card__meta">${t(item.role, locale)}</div>
                  </div>
                  <h3>${t(item.title, locale)}</h3>
                  <p>${t(item.body, locale)}</p>
                  <p><strong>${t({ ko: "결과", en: "Outcome" }, locale)}</strong><br />${t(item.result, locale)}</p>
                  <div class="tag-row">${item.stack.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
      <section class="section">
        <div class="section-title reveal">
          <div class="eyebrow">${t(data.navigation.projects, locale)}</div>
          <h2>${t(data.projects.historyTitle, locale)}</h2>
          <p>${t(data.projects.historySummary, locale)}</p>
        </div>
        <div class="year-history">
          ${data.projects.history
            .map(
              (group) => `
                <section class="year-group reveal">
                  <div class="year-group__header">
                    <div class="year-group__year">${group.year}</div>
                  </div>
                  <div class="year-group__entries">
                    ${group.entries
                      .map(
                        (entry) => `
                          <article class="year-entry">
                            <div class="year-entry__top">
                              <div class="meta-label">${t(entry.period, locale)}</div>
                            </div>
                            <h3>${t(entry.title, locale)}</h3>
                            <p>${t(entry.body, locale)}</p>
                            <div class="tag-row">${entry.tags
                              .map((tag) => `<span class="tag">${tag}</span>`)
                              .join("")}</div>
                          </article>
                        `
                      )
                      .join("")}
                  </div>
                </section>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderAbout(locale) {
    return `
      <section class="section page-title">
        <div class="reveal">
          <div class="eyebrow">${t(data.navigation.about, locale)}</div>
          <h1>${t(data.about.title, locale)}</h1>
          <p>${t(data.about.summary, locale)}</p>
        </div>
      </section>
      <section class="section">
        <div class="story-grid">
          <div class="stack">
            ${data.about.story
              .map(
                (item) => `
                  <article class="card reveal">
                    <div class="meta-label">${t(data.navigation.about, locale)}</div>
                    <h3>${t(item.title, locale)}</h3>
                    <p>${t(item.body, locale)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
          <aside class="quote reveal">
            ${t(data.about.quote.text, locale)}
            <strong>${data.about.quote.by}</strong>
          </aside>
        </div>
      </section>
      <section class="section">
        <div class="about-grid">
          <div class="timeline">
            ${data.about.timeline
              .map(
                (item) => `
                  <article class="timeline__item reveal">
                    <div class="meta-label">${t(data.navigation.about, locale)}</div>
                    <h3>${t(item.title, locale)}</h3>
                    <p>${t(item.body, locale)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
          <div class="card reveal">
            <div class="meta-label">${t({ ko: "Capabilities", en: "Capabilities" }, locale)}</div>
            <h3>${t({ ko: "다루는 영역", en: "What I Cover" }, locale)}</h3>
            <p>${t({ ko: "프론트엔드 구현, 정적 사이트 구조, 콘텐츠 설계, 운영 관점 개선을 하나의 흐름으로 묶습니다.", en: "I connect frontend execution, static architecture, content shaping, and operational thinking into one delivery flow." }, locale)}</p>
            <div class="tag-row">${data.about.stack.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderContact(locale) {
    return `
      <section class="section page-title">
        <div class="reveal">
          <div class="eyebrow">${t(data.navigation.contact, locale)}</div>
          <h1>${t(data.contact.title, locale)}</h1>
          <p>${t(data.contact.summary, locale)}</p>
        </div>
      </section>
      <section class="section">
        <div class="contact-grid">
          ${data.contact.cards
            .map(
              (item) => `
                <article class="contact-card reveal">
                  <div class="contact-card__top">
                    <div class="meta-label">${t(data.navigation.contact, locale)}</div>
                  </div>
                  <h3>${t(item.title, locale)}</h3>
                  <p>${t(item.body, locale)}</p>
                  <a href="${item.link}"${item.link.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${item.label}</a>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
      <section class="section">
        <div class="card reveal">
          <div class="meta-label">${t({ ko: "Before You Reach Out", en: "Before You Reach Out" }, locale)}</div>
          <h3>${t({ ko: "이 내용을 함께 보내주면 좋습니다.", en: "Helpful context to include" }, locale)}</h3>
          <div class="stack">
            ${data.contact.checklist.map((item) => `<p class="muted">• ${t(item, locale)}</p>`).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderNotFound(locale) {
    return `
      <section class="hero section">
        <div class="reveal">
          <div class="eyebrow">404</div>
          <h1>${t(data.notFound.title, locale)}</h1>
          <p>${t(data.notFound.summary, locale)}</p>
          <div class="button-row">
            <a class="button" href="${pathMap.home}">${t(data.navigation.home, locale)}</a>
            <a class="button--ghost" href="${pathMap.contact}">${t(data.navigation.contact, locale)}</a>
          </div>
        </div>
      </section>
    `;
  }

  function bindReveal() {
    const items = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    items.forEach((item) => observer.observe(item));
  }
})();
