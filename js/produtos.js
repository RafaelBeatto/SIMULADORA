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
//   limiteValor   (opcional) só até este saldo rende `percentualCdi`...
//   percentualAcimaDoLimite  ...o que passar do limite rende este % do CDI
//   taxaEditavel  (opcional) true → a pessoa informa a % do CDI (percentualCdi vira o valor sugerido)
//   condicao      (opcional) o que a pessoa precisa fazer para ter o produto
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
        },
        {
          id: "nubank-turbo-120",
          nome: "Caixinha Turbo 120%",
          regra: "cdb",
          percentualCdi: 120,
          limiteValor: 10000,
          percentualAcimaDoLimite: 100,
          liquidez: "Na hora, quando quiser",
          fgc: true,
          condicao: "Ser cliente Nubank+ ou Ultravioleta. A simulação considera que você continua no plano durante todo o período.",
          resumo: "Para clientes Nubank+ ou Ultravioleta. Rende 120% do CDI até R$ 10 mil; o que passar disso rende 100% do CDI."
        },
        {
          id: "nubank-turbo-115",
          nome: "Caixinha Turbo 115%",
          regra: "cdb",
          percentualCdi: 115,
          limiteValor: 5000,
          percentualAcimaDoLimite: 100,
          liquidez: "Na hora, quando quiser",
          fgc: true,
          condicao: "Receber ou depositar pelo menos R$ 900 por mês na conta Nubank. A taxa vale por 31 dias e se renova a cada mês; a simulação considera que você cumpre isso todo mês.",
          resumo: "Para quem movimenta R$ 900 por mês na conta. Rende 115% do CDI até R$ 5 mil; o que passar disso rende 100% do CDI."
        },
        {
          id: "nubank-rdb-planejado",
          nome: "RDB Planejado",
          regra: "cdb",
          percentualCdi: 102.5,
          taxaEditavel: true,
          liquidez: "Só na data escolhida (fim do prazo). Não dá para tirar antes.",
          fgc: true,
          condicao: "É usado dentro de uma Caixinha que já tenha dinheiro no RDB comum. A taxa muda conforme a data escolhida (cerca de 102,5% a 104% do CDI); confira no app.",
          resumo: "Rende um pouco mais que a Caixinha, mas o dinheiro fica preso até a data que você escolher."
        }
        // Próximos (ainda não ativos):
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
