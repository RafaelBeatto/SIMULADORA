// Modo Simples: poucas perguntas, resultado claro. Usa o Catálogo + Config + Motor.
(() => {
  const { addMonths, roundMoney, currency, percentage, daysBetween, holidaySet, taxRate, runSimulation } = window.Motor;
  const T = window.Textos;
  const byId = (id) => document.getElementById(id);
  let lastResult = null;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  // ---------- Formulário ----------
  function fillBanks() {
    byId("s-banco").innerHTML = window.Catalogo.bancos.map((banco) => `<option value="${banco.id}">${escapeHtml(banco.nome)}</option>`).join("");
    fillProducts();
  }

  function fillProducts() {
    const banco = window.Catalogo.banco(byId("s-banco").value);
    const produtos = banco ? banco.produtos : [];
    byId("s-produto").innerHTML = produtos.map((produto) => `<option value="${produto.id}">${escapeHtml(produto.nome)}</option>`).join("");
    // Com um único produto, o campo some e mostramos só o resumo.
    byId("s-produto-campo").hidden = produtos.length <= 1;
    showProductSummary();
  }

  function showProductSummary() {
    const found = window.Catalogo.produto(byId("s-produto").value);
    byId("s-produto-resumo").textContent = found ? `${found.produto.nome}: ${found.produto.resumo}` : "";
    // Produtos com taxa variável (ex.: RDB Planejado) mostram o campo de taxa, já com o valor padrão.
    const editable = Boolean(found && found.produto.taxaEditavel);
    byId("s-taxa-campo").hidden = !editable;
    if (editable) byId("s-taxa").value = found.produto.percentualCdi;
  }

  function readMonths() {
    const amount = Number(byId("s-prazo").value);
    return byId("s-prazo-unidade").value === "anos" ? Math.round(amount * 12) : Math.round(amount);
  }

  function prazoTexto(months) {
    if (months % 12 === 0) return months === 12 ? "1 ano" : `${months / 12} anos`;
    return months === 1 ? "1 mês" : `${months} meses`;
  }

  function buildSettings() {
    const found = window.Catalogo.produto(byId("s-produto").value);
    if (!found) throw new Error(T.erros.produto);
    const initial = Number(byId("s-valor").value) || 0;
    const monthly = Number(byId("s-mensal").value) || 0;
    const months = readMonths();
    if (initial < 0 || monthly < 0) throw new Error(T.erros.valorNegativo);
    if (initial === 0 && monthly === 0) throw new Error(T.erros.valorVazio);
    if (!Number.isFinite(months) || months < 1 || months > 600) throw new Error(T.erros.prazo);

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = addMonths(start, months);
    const settings = {
      ...window.Config.impostos,
      ...(found.produto.parametros || {}),
      start, end, initial,
      cdiFuture: window.Config.cdiPadrao / 100,
      depositFrequency: monthly > 0 ? "monthly" : "none",
      depositAmount: monthly,
      depositStart: addMonths(start, 1),
      withdrawFrequency: "none",
      withdrawAmount: 0,
      holidays: holidaySet(start, end)
    };
    const produto = found.produto;
    const percentual = produto.taxaEditavel ? Number(byId("s-taxa").value) : produto.percentualCdi;
    if (!Number.isFinite(percentual) || percentual < 50 || percentual > 300) throw new Error(T.erros.taxa);
    const spec = { key: produto.id, name: produto.nome, rule: produto.regra, rate: percentual / 100 };
    if (produto.limiteValor) {
      spec.limit = produto.limiteValor;
      spec.rateAbove = produto.percentualAcimaDoLimite / 100;
    }
    return { settings, spec, found, months, percentual };
  }

  // ---------- Resultado ----------
  function investedPoints(result) {
    const { settings, deposits } = result;
    const entries = [...deposits.entries()].map(([key, amount]) => [window.Motor.parseDate(key), amount]);
    return result.products[0].points.map((point) => ({
      date: point.date,
      value: settings.initial + entries.filter(([date]) => date <= point.date).reduce((sum, [, amount]) => sum + amount, 0)
    }));
  }

  function grossPoints(product) {
    const points = product.points.map((point) => ({ ...point }));
    points[points.length - 1].value = product.grossFinalValue;
    return points;
  }

  function renderChart() {
    if (!lastResult) return;
    window.Grafico.render([
      { color: "#9aa59f", points: investedPoints(lastResult), dashed: true },
      // Saldo antes do imposto (o imposto só é cobrado quando a pessoa tira o dinheiro).
      { color: "#176b50", points: grossPoints(lastResult.products[0]) }
    ], byId("s-grafico"));
  }

  function renderResult(result, found, months, percentual) {
    const r = result.products[0];
    const R = T.resultado, D = R.detalhes;
    const { produto, banco } = found;
    const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
    const gross = roundMoney(r.earnings) + roundMoney(r.totalTaxes) + roundMoney(r.totalFees);
    const lastAge = daysBetween(result.settings.start, result.settings.end);
    const irFinal = produto.regra === "lci" && result.settings.lciExempt ? 0 : taxRate(lastAge, produto.regra === "fund" && result.settings.fundType === "short", result.settings);

    byId("s-resultado").innerHTML = `
      <div class="big-grid">
        <div class="big-card"><div class="big-name">${R.investiu}</div><div class="big-value">${currency(r.invested)}</div><div class="big-meta">${R.investiuMeta}</div></div>
        <div class="big-card gain"><div class="big-name">${R.ganhou}</div><div class="big-value">${currency(r.earnings)}</div><div class="big-meta">${R.ganhouMeta}</div></div>
        <div class="big-card final"><div class="big-name">${R.final}</div><div class="big-value">${currency(r.finalValue)}</div><div class="big-meta">${R.finalMeta}</div></div>
      </div>
      <p class="plain-explain">${escapeHtml(R.explicacao({ prazo: prazoTexto(months), inicial: result.settings.initial, mensal: result.settings.depositAmount, final: currency(r.finalValue), impostos: currency(r.totalTaxes) }))}</p>
      <div class="panel result-panel">
        <ul class="breakdown">
          <li><span>${R.rendimentoBruto}</span><strong>${currency(gross)}</strong></li>
          <li><span>− ${R.impostos}</span><strong>${currency(r.totalTaxes)}</strong></li>
          <li><span>− ${R.taxas}</span><strong>${r.totalFees > 0.004 ? currency(r.totalFees) : `${currency(0)} <small>${R.semTaxas}</small>`}</strong></li>
          <li class="total"><span>${R.rendimentoLiquido}</span><strong>${currency(r.earnings)}</strong></li>
        </ul>
      </div>
      <div class="panel result-panel">
        <div class="chart-title-row"><h3>${R.graficoTitulo}</h3><span>${R.graficoNota}</span></div>
        <div class="chart-wrap"><canvas id="s-grafico" role="img" aria-label="${R.graficoTitulo}"></canvas></div>
        <div class="legend">
          <span class="legend-item"><i class="legend-mark" style="background:#9aa59f"></i>${R.graficoColocou}</span>
          <span class="legend-item"><i class="legend-mark" style="background:#176b50"></i>${R.graficoSaldo}</span>
        </div>
      </div>
      <details class="panel result-panel simple-details">
        <summary>${R.verDetalhes}</summary>
        <dl class="detail-list">
          <dt>${D.produto}</dt><dd>${escapeHtml(banco.nome)} · ${escapeHtml(produto.nome)}</dd>
          <dt>${D.rende}</dt><dd>${String(percentual).replace(".", ",")}% do CDI${produto.limiteValor ? ` até ${currency(produto.limiteValor)}; ${D.acimaDoLimite} ${produto.percentualAcimaDoLimite}% do CDI` : ""}</dd>
          ${produto.condicao ? `<dt>${D.condicao}</dt><dd>${escapeHtml(produto.condicao)}</dd>` : ""}
          <dt>${D.cdi}</dt><dd>${percentage(window.Config.cdiPadrao)} ao ano (${escapeHtml(window.Config.cdiReferencia)})<br><small>${D.cdiExplica}</small></dd>
          <dt>${D.periodo}</dt><dd>${dateFormat.format(result.settings.start)} a ${dateFormat.format(result.settings.end)}</dd>
          <dt>${D.liquidez}</dt><dd>${escapeHtml(produto.liquidez)}</dd>
          <dt>${D.impostos}</dt><dd>${escapeHtml(window.Catalogo.regras[produto.regra])}</dd>
          <dt>${D.aliquota}</dt><dd>${percentage(irFinal * 100)} <small>(${D.aliquotaExplica})</small></dd>
          <dt>${D.fgc}</dt><dd>${produto.fgc ? D.fgcSim : D.fgcNao}</dd>
        </dl>
        <p class="hint">${D.avancado}</p>
      </details>`;
    lastResult = result;
    renderChart();
  }

  // ---------- Ajuda ----------
  function openHelp(key) {
    const help = T.ajuda[key];
    if (!help) return;
    const L = T.rotulosAjuda;
    byId("ajuda-titulo").textContent = help.titulo;
    byId("ajuda-corpo").innerHTML = ["oQue", "paraQue", "colocar", "exemplo"]
      .filter((part) => help[part])
      .map((part) => `<p><strong>${L[part]}:</strong> ${escapeHtml(help[part])}</p>`).join("");
    const dialog = byId("ajuda-modal");
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
  }

  function closeHelp() {
    const dialog = byId("ajuda-modal");
    if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
  }

  // ---------- Eventos ----------
  document.querySelectorAll("[data-ajuda]").forEach((button) => {
    button.setAttribute("aria-label", `${T.botoes.ajuda} ${T.ajuda[button.dataset.ajuda]?.titulo || ""}`);
    button.addEventListener("click", () => openHelp(button.dataset.ajuda));
  });
  byId("ajuda-fechar").addEventListener("click", closeHelp);
  byId("ajuda-modal").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeHelp(); });

  byId("s-banco").addEventListener("change", fillProducts);
  byId("s-produto").addEventListener("change", showProductSummary);

  byId("simple-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const error = byId("s-erro");
    error.style.display = "none";
    try {
      const { settings, spec, found, months, percentual } = buildSettings();
      renderResult(runSimulation(settings, [spec]), found, months, percentual);
    } catch (problem) {
      error.textContent = problem.message;
      error.style.display = "block";
    }
  });

  window.addEventListener("resize", renderChart);

  fillBanks();
})();
