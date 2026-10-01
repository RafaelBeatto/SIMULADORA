// RBAppLauncher — menu de aplicativos da Central RB (estilo "menu de apps do Google").
// Componente independente: não depende de framework nem de outros scripts deste projeto.
//
// Uso no HTML:
//   <div class="rb-launcher" data-rb-launcher data-current-app="investimentos">
//     <button class="rb-launcher__button" type="button"> <img src="img/rb-logo.png" alt="RB"> </button>
//   </div>
//   <script src="js/rb-apps.js"></script>
//   <script src="js/rb-launcher.js"></script>
//
// A lista de aplicativos vem de window.RB_APPS (js/rb-apps.js).
// Cada aplicativo abre em NOVA ABA; a aba atual não muda.
(() => {
  const ICONS = {
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    notebook: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M9 7h7M9 11h5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l5 5M13.4 13.4l5 5M18.4 5.6l-5 5M10.6 13.4l-5 5"/>',
    app: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
  };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const hasUrl = (app) => /^https?:\/\//i.test(app.url || "");

  function iconHtml(icon) {
    if (icon && /[./]/.test(icon)) return `<img src="${escapeHtml(icon)}" alt="">`;
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[icon] || ICONS.app}</svg>`;
  }

  function itemHtml(app, currentId) {
    const current = app.id === currentId;
    const ready = hasUrl(app);
    const label = `${escapeHtml(app.name)}`;
    const note = current ? '<span class="rb-launcher__note">Você está aqui</span>'
      : ready ? "" : '<span class="rb-launcher__note">Link pendente</span>';
    const inner = `<span class="rb-launcher__icon">${iconHtml(app.icon)}</span><span class="rb-launcher__name">${label}</span>${note}`;
    const title = escapeHtml(app.description || app.name);
    if (!ready) return `<li><span class="rb-launcher__item is-disabled" title="${title}" aria-disabled="true">${inner}</span></li>`;
    return `<li><a class="rb-launcher__item${current ? " is-current" : ""}" href="${escapeHtml(app.url)}" target="_blank" rel="noopener noreferrer" title="${title}"${current ? ' aria-current="page"' : ""}>${inner}</a></li>`;
  }

  function mount(root, options = {}) {
    const button = root.querySelector(".rb-launcher__button");
    if (!button || root.dataset.rbLauncherReady) return;
    root.dataset.rbLauncherReady = "true";
    const apps = (options.apps || window.RB_APPS || [])
      .filter((app) => app && app.enabled !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const currentId = options.currentApp || root.dataset.currentApp || "";
    const panelId = `rb-launcher-panel-${Math.random().toString(36).slice(2, 8)}`;

    const panel = document.createElement("div");
    panel.className = "rb-launcher__panel";
    panel.id = panelId;
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Aplicativos RB");
    panel.innerHTML = `<div class="rb-launcher__title">Aplicativos</div>` +
      (apps.length ? `<ul class="rb-launcher__grid">${apps.map((app) => itemHtml(app, currentId)).join("")}</ul>`
        : `<p class="rb-launcher__empty">Nenhum aplicativo cadastrado.</p>`);
    root.appendChild(panel);

    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panelId);
    if (!button.getAttribute("aria-label")) button.setAttribute("aria-label", "Abrir aplicativos RB");
    if (!button.title) button.title = "Aplicativos RB";

    const isOpen = () => !panel.hidden;
    // Posiciona o painel (fixo na janela) logo abaixo da logo, sempre dentro da tela (12px de margem).
    // Ser "fixo" evita que barras laterais ou áreas com rolagem cortem o painel.
    function place() {
      const gap = 12, width = Math.min(336, window.innerWidth - gap * 2);
      const rect = button.getBoundingClientRect();
      const left = Math.max(gap, Math.min(rect.left - 8, window.innerWidth - gap - width));
      panel.style.width = `${width}px`;
      panel.style.left = `${left}px`;
      panel.style.top = `${Math.round(rect.bottom + 10)}px`;
    }
    function open() {
      place();
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
      root.classList.add("is-open");
      const first = panel.querySelector("a.rb-launcher__item");
      if (first) first.focus({ preventScroll: true });
    }
    function close(returnFocus) {
      if (!isOpen()) return;
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
      root.classList.remove("is-open");
      if (returnFocus) button.focus();
    }

    button.addEventListener("click", () => (isOpen() ? close(false) : open()));
    document.addEventListener("click", (event) => { if (!root.contains(event.target)) close(false); });
    window.addEventListener("resize", () => { if (isOpen()) place(); });
    window.addEventListener("scroll", () => { if (isOpen()) place(); }, true);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && isOpen()) close(true); });
    // Fecha ao escolher um app (ele abre em nova aba; esta aba continua como está).
    panel.addEventListener("click", (event) => { if (event.target.closest("a.rb-launcher__item")) close(false); });
    // Fecha se o foco sair do componente (ex.: Tab para fora).
    root.addEventListener("focusout", (event) => { if (event.relatedTarget && !root.contains(event.relatedTarget)) close(false); });

    return { open, close: () => close(false) };
  }

  window.RBAppLauncher = { mount, icons: ICONS };
  document.querySelectorAll("[data-rb-launcher]").forEach((root) => mount(root));
})();
