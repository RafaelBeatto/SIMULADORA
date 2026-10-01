// Catálogo de bancos e produtos do Modo Simples.
// Para adicionar um produto: inclua um item em `produtos` do banco.
// Para adicionar um banco: inclua um item em `bancos`.
//
// Campos de cada produto:
//   id            identificador único
//   nome          nome mostrado na tela
//   regra         regra de cálculo do motor: "cdb" | "lci" | "tesouro" | "fund"
//   percentualCdi quanto rende em % do CDI (ex.: 100)
//   liquidez      quando a pessoa pode tirar o dinheiro (texto curto)
//   fgc           true se tem garantia do FGC
//   resumo        frase curta em linguagem simples
//   parametros    (opcional) sobrescreve valores de Config.impostos só para este produto
//                 ex.: { lciLockDays: 90 } ou { fundFee: 0.005 }
window.Catalogo = {
  regras: {
    cdb: "Imposto de Renda de 22,5% a 15% sobre o que rendeu (quanto mais tempo, menos imposto). IOF só se tirar antes de 30 dias.",
    lci: "Sem Imposto de Renda para pessoa física. Pode ter prazo mínimo para resgatar.",
    tesouro: "Imposto de Renda de 22,5% a 15% e taxa de custódia da B3 acima de R$ 10 mil.",
    fund: "Imposto de Renda, come-cotas (imposto cobrado em maio e novembro) e taxa de administração."
  },
  bancos: [
    {
      id: "nubank",
      nome: "Nubank",
      produtos: [
        {
          id: "nubank-caixinha",
          nome: "Caixinha (resgate imediato)",
          regra: "cdb",
          percentualCdi: 100,
          liquidez: "Na hora, quando quiser",
          fgc: true,
          resumo: "Rende 100% do CDI. É um RDB do Nubank: você pode tirar o dinheiro quando quiser."
        }
        // Próximos (ainda não ativos):
        // Caixinha Turbo — 115%/120% do CDI com limite de valor e condições do cliente.
        // RDB Planejado — % do CDI maior conforme o prazo; dinheiro preso até a data.
        // LCI/LCA, Tesouro Direto, Nu Reserva (fundos).
      ]
    }
  ],

  banco(id) {
    return this.bancos.find((banco) => banco.id === id);
  },
  produto(id) {
    for (const banco of this.bancos) {
      const produto = banco.produtos.find((item) => item.id === id);
      if (produto) return { banco, produto };
    }
    return null;
  }
};
