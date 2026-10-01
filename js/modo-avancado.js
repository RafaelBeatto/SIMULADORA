// Modo Avançado: tela original do simulador (compara 4 produtos com todos os parâmetros).
(() => {
  const { localIso, parseDate, currency, holidaySet, runSimulation } = window.Motor;
  const colors = { cdb: "#176b50", lci: "#bd542b", tesouro: "#406f8a", fund: "#b28630" };
  const names = { cdb: "CDB / RDB", lci: "LCI / LCA", tesouro: "Tesouro Selic", fund: "Fundo DI" };
  const percentInputs = { cdb: "cdb-percent", lci: "lci-percent", tesouro: "tesouro-percent", fund: "fund-percent" };
  const cdiSeries = new Map();
  let lastResults = null;

  const byId = (id) => document.getElementById(id);

  function readSettings() {
    const dateStart = parseDate(byId("start-date").value);
    const dateEnd = parseDate(byId("end-date").value);
    const iofRates = byId("iof-table").value.split(/[;,\s]+/).filter(Boolean).map(Number);
    return {
      start: dateStart, end: dateEnd,
      initial: Number(byId("initial-amount").value),
      cdiFuture: Number(byId("cdi-rate").value) / 100,
      depositFrequency: byId("deposit-frequency").value,
      depositAmount: Number(byId("deposit-amount").value),
      withdrawFrequency: byId("withdraw-frequency").value,
      withdrawAmount: Number(byId("withdraw-amount").value),
      lciLockDays: Number(byId("lci-lock-days").value),
      lciExempt: byId("lci-tax-exempt").value === "yes",
      fundType: byId("fund-type").value,
      fundFee: Number(byId("fund-fee").value) / 100,
      custodyRate: Number(byId("custody-rate").value) / 100,
      custodyExempt: Number(byId("custody-exempt").value),
      custodyMonths: byId("custody-months").value.split(/[;,\s]+/).map(Number).filter((month) => month >= 1 && month <= 12),
      iof: byId("iof-enabled").value === "yes",
      lciIof: byId("lci-iof").value === "yes",
      irRates: ["ir-day-180", "ir-day-360", "ir-day-720", "ir-over-720"].map((id) => Number(byId(id).value) / 100),
      comeCotasRates: { short: Number(byId("come-short").value) / 100, long: Number(byId("come-long").value) / 100 },
      comeCotasMonths: byId("come-months").value.split(/[;,\s]+/).map(Number).filter((month) => month >= 1 && month <= 12),
      iofRates,
      holidays: holidaySet(dateStart, dateEnd, byId("holiday-extra").value)
    };
  }

  function readProducts() {
    return Object.keys(names).map((key) => ({ key, name: names[key], rule: key, rate: Number(byId(percentInputs[key]).value) / 100 }));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function renderChart(products, canvas) {
    window.Grafico.render(products.map((product) => ({ color: colors[product.product], points: product.points })), canvas);
  }

  function renderResults(result) {
    const products = result.products;
    const best = [...products].sort((a, b) => b.finalValue - a.finalValue)[0];
    const netInvested = products[0].invested;
    const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
    byId("result-period").textContent = `${dateFormat.format(result.settings.start)} a ${dateFormat.format(result.settings.end)} · ${currency(netInvested)} em aportes programados`;
    byId("results-content").innerHTML = `
      <div class="summary-grid">
        <div class="summary-card"><div class="summary-name">Maior saldo final</div><div class="summary-value">${currency(best.finalValue)}</div><div class="summary-meta">${escapeHtml(best.name)} · após custos e tributos</div></div>
        <div class="summary-card"><div class="summary-name">Rendimento líquido</div><div class="summary-value">${currency(best.earnings)}</div><div class="summary-meta">${escapeHtml(best.name)} · resgates líquidos incluídos</div></div>
        <div class="summary-card"><div class="summary-name">Impostos estimados</div><div class="summary-value">${currency(best.totalTaxes)}</div><div class="summary-meta">${escapeHtml(best.name)} · IR, IOF e come-cotas</div></div>
        <div class="summary-card"><div class="summary-name">Custos estimados</div><div class="summary-value">${currency(best.totalFees)}</div><div class="summary-meta">${escapeHtml(best.name)} · taxas de administração/custódia</div></div>
      </div>
      <div class="panel result-panel"><div class="chart-title-row"><h3>Evolução do saldo</h3><span>Valores nominais · sem inflação</span></div><div class="chart-wrap"><canvas id="balance-chart" aria-label="Gráfico de evolução estimada dos saldos" role="img"></canvas></div><div class="legend">${products.map((product) => `<span class="legend-item"><i class="legend-mark" style="background:${colors[product.product]}"></i>${escapeHtml(product.name)}</span>`).join("")}</div></div>
      <div class="panel result-panel"><div class="chart-title-row"><h3>Resultado por alternativa</h3><span>${currency(netInvested)} aportados no período</span></div><div class="table-scroll"><table><thead><tr><th>Produto</th><th>Saldo final líquido*</th><th>Rendimento líquido</th><th>Impostos</th><th>Custos</th><th>Resgates líquidos</th></tr></thead><tbody>${products.map((product) => `<tr><td><span class="table-product"><i class="dot" style="background:${colors[product.product]}"></i>${escapeHtml(product.name)}</span></td><td class="positive">${currency(product.finalValue)}${product.blockedAtEnd > 0.01 ? `<br><span class="hint">${currency(product.blockedAtEnd)} em carência</span>` : ""}</td><td>${currency(product.earnings)}</td><td>${currency(product.totalTaxes)}</td><td>${currency(product.totalFees)}</td><td>${currency(product.netWithdrawals)}</td></tr>`).join("")}</tbody></table></div><p class="hint">* Após resgate hipotético na data final; parcelas ainda em carência são mostradas pelo valor bruto e permanecem indisponíveis.</p></div>
      <div class="panel result-panel"><div class="chart-title-row"><h3>Eventos fiscais e movimentações</h3><span>Datas efetivas na simulação</span></div><div class="event-list" id="event-list"></div></div>`;
    renderChart(products, byId("balance-chart"));
    const eventList = products.flatMap((product) => product.events.map((event) => ({ ...event, name: product.name })))
      .sort((a, b) => a.date - b.date).slice(0, 80);
    const allEventCount = products.reduce((sum, product) => sum + product.events.length, 0);
    byId("event-list").innerHTML = eventList.length ? `${eventList.map((event) => `<div class="event-row"><span class="event-date">${dateFormat.format(event.date)}</span><span><strong>${escapeHtml(event.type)} · ${escapeHtml(event.name)}</strong><br>${escapeHtml(event.detail)}</span><span class="event-amount">${currency(event.amount)}</span></div>`).join("")}${allEventCount > eventList.length ? `<p class="hint">Exibindo ${eventList.length} de ${allEventCount} eventos. Os totais incluem todo o período.</p>` : ""}` : `<p class="hint">Não houve resgates ou cobranças fiscais no período.</p>`;
    if (products.some((product) => product.unmet > 0.01)) {
      byId("error-message").textContent = "Um ou mais resgates excederam o saldo disponível ou foram bloqueados pela carência informada; a parcela não atendida não foi retirada.";
      byId("error-message").style.display = "block";
    }
    lastResults = result;
  }

  function validate(settings) {
    if (!Number.isFinite(settings.start.getTime()) || !Number.isFinite(settings.end.getTime())) throw new Error("Informe datas válidas para a simulação.");
    if (settings.end < settings.start) throw new Error("A data final precisa ser igual ou posterior à data inicial.");
    if (settings.initial < 0 || settings.depositAmount < 0 || settings.withdrawAmount < 0) throw new Error("Valores de aporte e resgate não podem ser negativos.");
    if (settings.iofRates.length !== 30 || settings.iofRates.some((rate) => !Number.isFinite(rate) || rate < 0 || rate > 100)) throw new Error("A tabela de IOF precisa ter 30 percentuais entre 0 e 100.");
    if ([...settings.irRates, ...Object.values(settings.comeCotasRates)].some((rate) => !Number.isFinite(rate) || rate < 0 || rate > 1)) throw new Error("Confira as alíquotas de IR e come-cotas (0 a 100%).");
    if (settings.end.getFullYear() - settings.start.getFullYear() > 50) throw new Error("O período máximo da simulação é de 50 anos.");
  }

  byId("simulation-form").addEventListener("submit", (event) => {
    event.preventDefault();
    byId("error-message").style.display = "none";
    try {
      const settings = readSettings();
      validate(settings);
      renderResults(runSimulation(settings, readProducts(), cdiSeries));
    } catch (error) {
      byId("error-message").textContent = error.message;
      byId("error-message").style.display = "block";
    }
  });

  byId("fetch-cdi").addEventListener("click", async () => {
    const start = byId("start-date").value;
    const end = byId("end-date").value;
    if (!start || !end) return;
    const toBrazilDate = (value) => {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    };
    const status = byId("rate-status");
    status.textContent = "Consultando série diária do Banco Central...";
    try {
      const query = new URLSearchParams({ dataInicial: toBrazilDate(start), dataFinal: toBrazilDate(end), formato: "json" });
      const response = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?${query}`);
      if (!response.ok) throw new Error("A fonte respondeu com erro.");
      const rows = await response.json();
      if (!Array.isArray(rows) || !rows.length) throw new Error("A série não retornou observações para esse intervalo.");
      rows.forEach((row) => {
        const [day, month, year] = row.data.split("/");
        const key = `${year}-${month}-${day}`;
        // A série 12 do BCB vem em % ao dia; o motor usa % ao ano (base 252).
        const daily = Number(row.valor.replace(",", ".")) / 100;
        cdiSeries.set(key, (Math.pow(1 + daily, 252) - 1) * 100);
      });
      status.textContent = `${rows.length} observações carregadas do SGS/BCB. Dias ausentes usam a taxa futura informada.`;
    } catch (error) {
      status.textContent = `Consulta indisponível (${error.message}). Importe CSV ou use a hipótese de CDI futuro.`;
    }
  });

  byId("csv-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const status = byId("rate-status");
    try {
      const text = await file.text();
      const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim());
      let count = 0;
      lines.forEach((line, index) => {
        const columns = line.split(/[;,\t]/).map((part) => part.trim().replace(/^"|"$/g, ""));
        if (index === 0 && !/^\d{4}-\d{2}-\d{2}$/.test(columns[0]) && !/^\d{2}\/\d{2}\/\d{4}$/.test(columns[0])) return;
        let key = columns[0];
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(key)) {
          const [day, month, year] = key.split("/"); key = `${year}-${month}-${day}`;
        }
        const rate = Number(columns[1].replace(",", "."));
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(rate)) { cdiSeries.set(key, rate); count++; }
      });
      if (!count) throw new Error("Não encontrei linhas com data e taxa anualizada.");
      status.textContent = `${count} observações importadas. CSV: data (AAAA-MM-DD ou DD/MM/AAAA), taxa anualizada (%).`;
    } catch (error) {
      status.textContent = `Falha na importação: ${error.message}`;
    }
    event.target.value = "";
  });

  window.addEventListener("resize", () => {
    if (lastResults) renderChart(lastResults.products, byId("balance-chart"));
  });

  const today = new Date();
  const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  byId("start-date").value = localIso(today);
  byId("end-date").value = localIso(oneYearLater);
  byId("cdi-rate").value = window.Config.cdiPadrao;
  byId("assumption-stamp").textContent = `Premissas editáveis · ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(today)}`;
})();
