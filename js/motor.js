// Motor de cálculo: não lê nem escreve na tela.
// Recebe um objeto `settings` e uma lista de produtos ({ key, name, rule, rate }).
// rule: "cdb" (CDB/RDB/Caixinha), "lci" (LCI/LCA), "tesouro" (Tesouro Selic), "fund" (Fundo DI).
// Opcional: limit + rateAbove → só os primeiros `limit` reais do saldo rendem `rate`; o excedente rende `rateAbove`.
(() => {
  const DAY = 86400000;

  const localIso = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const parseDate = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const addDays = (date, amount) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  const currency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const percentage = (value) => `${value.toFixed(2).replace(".", ",")}%`;
  const daysBetween = (first, second) => Math.floor((second - first) / DAY);
  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

  function easterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function holidaySet(start, end, extra = "") {
    const holidays = new Set();
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
      const fixed = [[0, 1], [3, 21], [4, 1], [8, 7], [9, 12], [10, 2], [10, 15], [10, 20], [11, 25]];
      fixed.forEach(([month, day]) => holidays.add(localIso(new Date(year, month, day))));
      const easter = easterSunday(year);
      [-48, -47, -46, -2, 60].forEach((offset) => holidays.add(localIso(addDays(easter, offset))));
    }
    extra.split(/[;,\s]+/).filter(Boolean).forEach((value) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) holidays.add(value);
    });
    return holidays;
  }

  function isBusinessDay(date, holidays) {
    return !isWeekend(date) && !holidays.has(localIso(date));
  }

  function lastBusinessDay(year, month, holidays) {
    let date = new Date(year, month + 1, 0);
    while (!isBusinessDay(date, holidays)) date = addDays(date, -1);
    return date;
  }

  function firstBusinessDay(year, month, holidays) {
    let date = new Date(year, month, 1);
    while (!isBusinessDay(date, holidays)) date = addDays(date, 1);
    return date;
  }

  function nextBusinessDay(date, holidays) {
    let adjusted = new Date(date);
    while (!isBusinessDay(adjusted, holidays)) adjusted = addDays(adjusted, 1);
    return adjusted;
  }

  function clampDate(year, month, day) {
    return new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
  }

  function addMonths(date, months) {
    return clampDate(date.getFullYear(), date.getMonth() + months, date.getDate());
  }

  function scheduledDates(start, end, frequency) {
    const dates = [];
    if (frequency === "none") return dates;
    if (frequency === "weekly") {
      for (let date = new Date(start); date <= end; date = addDays(date, 7)) dates.push(new Date(date));
      return dates;
    }
    const monthStep = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
    const day = start.getDate();
    let year = start.getFullYear(), month = start.getMonth();
    while (true) {
      const date = clampDate(year, month, day);
      if (date > end) break;
      dates.push(date);
      month += monthStep;
      year += Math.floor(month / 12);
      month %= 12;
    }
    return dates;
  }

  function taxRate(days, isShortFund, settings) {
    if (isShortFund) return days <= 180 ? settings.irRates[0] : settings.irRates[1];
    if (days <= 180) return settings.irRates[0];
    if (days <= 360) return settings.irRates[1];
    if (days <= 720) return settings.irRates[2];
    return settings.irRates[3];
  }

  function iofRate(days, settings) {
    if (days <= 0 || days > settings.iofRates.length) return 0;
    return settings.iofRates[days - 1] / 100;
  }

  function makeLot(amount, date) {
    return { value: amount, basis: amount, date: new Date(date), taxesPaid: 0, gainSinceComeCotas: 0 };
  }

  function distributeCost(lots, amount, reduceFundGain = false) {
    const total = lots.reduce((sum, lot) => sum + lot.value, 0);
    if (total <= 0 || amount <= 0) return;
    lots.forEach((lot) => {
      const share = lot.value / total;
      const cost = Math.min(lot.value, amount * share);
      lot.value -= cost;
      if (reduceFundGain) lot.gainSinceComeCotas -= cost;
    });
  }

  function calcIofTax(lot, gross, settings, rule, date) {
    const age = daysBetween(lot.date, date);
    const earns = Math.max(0, lot.value + lot.taxesPaid - lot.basis);
    const ratio = lot.value > 0 ? Math.min(1, gross / lot.value) : 0;
    const taxableGain = earns * ratio;
    const applyIof = rule === "lci" ? settings.lciIof : settings.iof;
    const iof = applyIof ? taxableGain * iofRate(age, settings) : 0;
    if (rule === "lci" && settings.lciExempt) return { iof, ir: 0, taxableGain, ratio };
    const shortFund = rule === "fund" && settings.fundType === "short";
    const irDue = Math.max(0, (taxableGain - iof) * taxRate(age, shortFund, settings) - lot.taxesPaid * ratio);
    return { iof, ir: irDue, taxableGain, ratio };
  }

  function redemption(lots, requested, date, settings, spec, events) {
    let remaining = requested, paid = 0, taxes = 0, grossRedeemed = 0, iofTotal = 0, irTotal = 0;
    for (const lot of lots) {
      if (remaining <= 0.004 || lot.value <= 0) continue;
      if (spec.rule === "lci" && daysBetween(lot.date, date) < settings.lciLockDays) continue;
      const gross = Math.min(lot.value, remaining);
      const tax = calcIofTax(lot, gross, settings, spec.rule, date);
      const basisPart = lot.basis * tax.ratio;
      const taxesPaidPart = lot.taxesPaid * tax.ratio;
      lot.value -= gross;
      lot.basis -= basisPart;
      lot.taxesPaid -= taxesPaidPart;
      lot.gainSinceComeCotas *= (1 - tax.ratio);
      const allTax = tax.iof + tax.ir;
      remaining -= gross;
      grossRedeemed += gross;
      taxes += allTax;
      iofTotal += tax.iof;
      irTotal += tax.ir;
      paid += gross - allTax;
      events.push({ date, type: "Resgate", product: spec.key, detail: `${currency(gross)} bruto · ${currency(allTax)} em IOF/IR`, amount: gross - allTax });
    }
    lots.splice(0, lots.length, ...lots.filter((lot) => lot.value > 0.004));
    return { gross: grossRedeemed, net: paid, taxes, iof: iofTotal, ir: irTotal, unmet: Math.max(0, remaining) };
  }

  function applyComeCotas(lots, date, settings, spec, events) {
    if (spec.rule !== "fund") return 0;
    const rate = settings.comeCotasRates[settings.fundType];
    let total = 0;
    lots.forEach((lot) => {
      const taxable = Math.max(0, lot.gainSinceComeCotas);
      const withholding = taxable * rate;
      lot.value -= withholding;
      lot.taxesPaid += withholding;
      lot.gainSinceComeCotas = 0;
      total += withholding;
    });
    if (total > 0) events.push({ date, type: "Come-cotas", product: spec.key, detail: `${settings.fundType === "short" ? "Curto" : "Longo"}-prazo · ${currency(total)}`, amount: total });
    return total;
  }

  function simulateProduct(settings, spec, deposits, withdrawalDates, cdiSeries) {
    const rule = spec.rule, rate = spec.rate;
    const lots = settings.initial > 0 ? [makeLot(settings.initial, settings.start)] : [];
    const points = [{ date: new Date(settings.start), value: settings.initial }];
    const events = [];
    let totalTaxes = 0, totalFees = 0, grossWithdrawals = 0, netWithdrawals = 0, unmet = 0;
    let custodyAccrued = 0;
    for (let date = new Date(settings.start); date <= settings.end; date = addDays(date, 1)) {
      const dateKey = localIso(date);
      if (deposits.has(dateKey)) {
        lots.push(makeLot(deposits.get(dateKey), date));
      }
      if (isBusinessDay(date, settings.holidays)) {
        const annualRate = cdiSeries.has(dateKey) ? cdiSeries.get(dateKey) / 100 : settings.cdiFuture;
        const dailyCdi = Math.pow(1 + annualRate, 1 / 252) - 1;
        let dayRate = rate;
        if (spec.limit > 0) {
          const earning = lots.reduce((sum, lot) => sum + (date > lot.date ? lot.value : 0), 0);
          if (earning > spec.limit) dayRate = (spec.limit * rate + (earning - spec.limit) * spec.rateAbove) / earning;
        }
        lots.forEach((lot) => {
          if (date <= lot.date) return;
          const before = lot.value;
          lot.value *= 1 + dailyCdi * dayRate;
          if (rule === "fund") lot.gainSinceComeCotas += lot.value - before;
        });

        if (rule === "fund" && settings.comeCotasMonths.includes(date.getMonth() + 1) && date.getTime() === lastBusinessDay(date.getFullYear(), date.getMonth(), settings.holidays).getTime()) {
          totalTaxes += applyComeCotas(lots, date, settings, spec, events);
        }

        if (rule === "fund" && settings.fundFee > 0) {
          const cost = lots.reduce((sum, lot) => sum + lot.value, 0) * settings.fundFee / 252;
          distributeCost(lots, cost, true);
          totalFees += cost;
        }
        if (rule === "tesouro" && settings.custodyRate > 0) {
          const month = date.getMonth() + 1;
          const value = lots.reduce((sum, lot) => sum + lot.value, 0);
          custodyAccrued += Math.max(0, value - settings.custodyExempt) * settings.custodyRate / 252;
          const collectionDate = settings.custodyMonths.includes(month)
            && date.getTime() === firstBusinessDay(date.getFullYear(), date.getMonth(), settings.holidays).getTime();
          if (collectionDate && custodyAccrued > 0) {
            const cost = custodyAccrued;
            custodyAccrued = 0;
            distributeCost(lots, cost);
            totalFees += cost;
            events.push({ date, type: "Custódia B3", product: spec.key, detail: currency(cost), amount: cost });
          }
        }

        if (withdrawalDates.has(dateKey)) {
          const result = redemption(lots, settings.withdrawAmount, date, settings, spec, events);
          totalTaxes += result.taxes;
          grossWithdrawals += result.gross;
          netWithdrawals += result.net;
          unmet += result.unmet;
        }

      }
      if (date.getDate() === 1 && dateKey !== localIso(settings.start)) {
        points.push({ date: new Date(date), value: lots.reduce((sum, lot) => sum + lot.value, 0) });
      }
    }
    if (custodyAccrued > 0) {
      distributeCost(lots, custodyAccrued);
      totalFees += custodyAccrued;
      events.push({ date: settings.end, type: "Custódia B3 no resgate", product: spec.key, detail: currency(custodyAccrued), amount: custodyAccrued });
    }
    const grossFinalValue = lots.reduce((sum, lot) => sum + lot.value, 0);
    const exitLots = lots.map((lot) => ({ ...lot, date: new Date(lot.date) }));
    const exitEvents = [];
    const exit = redemption(exitLots, grossFinalValue, settings.end, settings, spec, exitEvents);
    const blockedAtEnd = exitLots.reduce((sum, lot) => sum + lot.value, 0);
    const finalValue = exit.net + blockedAtEnd;
    if (exit.taxes > 0 || blockedAtEnd > 0) {
      totalTaxes += exit.taxes;
      events.push({ date: settings.end, type: "Resgate final estimado", product: spec.key, detail: `${currency(exit.taxes)} em IOF/IR · lotes bloqueados: ${currency(blockedAtEnd)}`, amount: finalValue });
    }
    if (points[points.length - 1].date.getTime() === settings.end.getTime()) points[points.length - 1].value = finalValue;
    else points.push({ date: new Date(settings.end), value: finalValue });
    const invested = settings.initial + [...deposits.values()].reduce((sum, amount) => sum + amount, 0);
    const earnings = finalValue + netWithdrawals - invested;
    return { product: spec.key, name: spec.name, finalValue, grossFinalValue, blockedAtEnd, invested, earnings, totalTaxes, totalFees, grossWithdrawals, netWithdrawals, unmet, points, events, exitIof: exit.iof, exitIr: exit.ir };
  }

  // settings.depositStart (opcional): data do 1º aporte recorrente. Padrão: data inicial.
  function runSimulation(settings, specs, cdiSeries = new Map()) {
    const depositDates = scheduledDates(settings.depositStart || settings.start, settings.end, settings.depositFrequency);
    const deposits = new Map(depositDates.map((date) => nextBusinessDay(date, settings.holidays)).filter((date) => date <= settings.end).map((date) => [localIso(date), settings.depositAmount]));
    const withdrawalDates = new Set(scheduledDates(settings.start, settings.end, settings.withdrawFrequency).map((date) => nextBusinessDay(date, settings.holidays)).filter((date) => date <= settings.end).map(localIso));
    const products = specs.map((spec) => simulateProduct(settings, spec, deposits, withdrawalDates, cdiSeries));
    return { products, settings, deposits };
  }

  window.Motor = {
    localIso, parseDate, addDays, addMonths, roundMoney, currency, percentage, daysBetween,
    holidaySet, isBusinessDay, taxRate, runSimulation
  };
})();
