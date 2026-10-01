// Inicialização geral: textos da tela e troca entre Modo Simples e Modo Avançado.
(() => {
  const T = window.Textos;
  const byId = (id) => document.getElementById(id);

  // Preenche elementos marcados com data-texto="grupo.chave" a partir de js/textos.js.
  document.querySelectorAll("[data-texto]").forEach((element) => {
    const value = element.dataset.texto.split(".").reduce((node, key) => (node ? node[key] : undefined), T);
    if (typeof value === "string") element.textContent = value;
  });

  function setMode(mode) {
    const simple = mode !== "avancado";
    byId("modo-simples").hidden = !simple;
    byId("modo-avancado").hidden = simple;
    byId("assumption-stamp").hidden = simple;
    byId("intro-text").textContent = simple ? T.modos.introSimples : T.modos.introAvancado;
    document.querySelectorAll("[data-modo]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.modo === (simple ? "simples" : "avancado")));
    });
    try { localStorage.setItem("simuladora-modo", simple ? "simples" : "avancado"); } catch (error) { /* sem armazenamento */ }
    window.dispatchEvent(new Event("resize")); // redesenha o gráfico visível
  }

  document.querySelectorAll("[data-modo]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.modo));
  });

  // Tema claro/escuro (padrão escuro). O <head> já aplica o tema salvo antes de desenhar.
  function setTheme(theme) {
    if (theme === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "light" ? "#FFFFFF" : "#0A0A0A";
    try { localStorage.setItem("rb-tema", theme); } catch (error) { /* sem armazenamento */ }
    window.dispatchEvent(new Event("resize")); // gráfico relê as cores do tema
  }
  byId("theme-toggle").addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  });

  setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");

  let saved = "simples";
  try { saved = localStorage.getItem("simuladora-modo") || "simples"; } catch (error) { /* sem armazenamento */ }
  setMode(saved);
})();
