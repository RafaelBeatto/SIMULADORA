// Valores padrão usados pelo Modo Simples (o Modo Avançado tem os seus no formulário).
// Ao mudar a legislação ou o CDI, atualize aqui.
window.Config = {
  cdiPadrao: 14.15,              // % ao ano — projeção usada no Modo Simples e valor inicial do Modo Avançado
  cdiReferencia: "ago/2026",     // quando o valor acima foi conferido
  impostos: {
    irRates: [0.225, 0.20, 0.175, 0.15],   // até 180 / 360 / 720 / acima de 720 dias
    iof: true,                             // IOF regressivo nos primeiros 30 dias
    iofRates: [96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0],
    lciExempt: true,
    lciIof: false,
    lciLockDays: 90,
    fundType: "long",
    fundFee: 0.008,
    comeCotasRates: { short: 0.20, long: 0.15 },
    comeCotasMonths: [5, 11],
    custodyRate: 0.002,
    custodyExempt: 10000,
    custodyMonths: [1, 7]
  }
};
