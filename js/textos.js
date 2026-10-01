// Textos do Modo Simples e do seletor de modo. Linguagem para quem nunca investiu.
window.Textos = {
  modos: {
    simples: "Simples",
    avancado: "Avançado",
    introSimples: "Responda 4 perguntas e veja quanto seu dinheiro pode render.",
    introAvancado: "Compare o efeito de CDI, prazo, aportes, resgates e custos sobre quatro alternativas de renda fixa."
  },

  campos: {
    banco: "Onde você investe?",
    produto: "Qual investimento?",
    valorInicial: "Quanto você vai investir agora?",
    prazo: "Por quanto tempo?",
    mensal: "Vai colocar dinheiro todo mês?",
    meses: "meses",
    anos: "anos",
    mensalDica: "Deixe 0 se não for colocar."
  },

  botoes: {
    calcular: "Calcular",
    fecharAjuda: "Entendi",
    ajuda: "O que é isso?"
  },

  // Ajuda de cada campo: o que é, para que serve, o que colocar, exemplo.
  ajuda: {
    banco: {
      titulo: "Onde você investe?",
      oQue: "É o banco ou app onde o seu dinheiro vai ficar guardado.",
      paraQue: "Cada banco paga um valor diferente pelo seu dinheiro.",
      colocar: "Escolha o banco que você usa ou pretende usar.",
      exemplo: "Se você guarda dinheiro na Caixinha do app roxo, escolha Nubank."
    },
    produto: {
      titulo: "Qual investimento?",
      oQue: "É o tipo de aplicação dentro do banco.",
      paraQue: "Cada tipo rende diferente, tem regras de imposto diferentes e prazos diferentes para tirar o dinheiro.",
      colocar: "Escolha o que você usa no app. Na dúvida, use a Caixinha.",
      exemplo: "Caixinha do Nubank: você pode tirar o dinheiro quando quiser."
    },
    valorInicial: {
      titulo: "Quanto você vai investir agora?",
      oQue: "É o dinheiro que você vai colocar no investimento logo no começo.",
      paraQue: "É a partir dele que o rendimento começa a ser calculado.",
      colocar: "O valor em reais. Pode ser 0 se você só for colocar todo mês.",
      exemplo: "R$ 1.000"
    },
    prazo: {
      titulo: "Por quanto tempo?",
      oQue: "É quanto tempo o dinheiro vai ficar investido, sem você tirar.",
      paraQue: "Quanto mais tempo, mais rende e menos imposto você paga.",
      colocar: "Um número e escolha se é em meses ou anos.",
      exemplo: "1 ano ou 18 meses."
    },
    mensal: {
      titulo: "Vai colocar dinheiro todo mês?",
      oQue: "É um valor extra que você guarda uma vez por mês, todo mês.",
      paraQue: "Mostra quanto você junta se criar o hábito de guardar sempre.",
      colocar: "O valor por mês. Se não for colocar nada, deixe 0. O primeiro depósito é daqui a 1 mês.",
      exemplo: "R$ 200 por mês."
    }
  },
  rotulosAjuda: { oQue: "O que é", paraQue: "Para que serve", colocar: "O que colocar", exemplo: "Exemplo" },

  resultado: {
    vazioTitulo: "Seu resultado aparece aqui",
    vazioTexto: "Preencha as perguntas ao lado e toque em Calcular.",
    investiu: "Você investiu",
    ganhou: "Você ganhou",
    final: "Valor final",
    investiuMeta: "dinheiro que saiu do seu bolso",
    ganhouMeta: "já sem impostos e taxas",
    finalMeta: "o que você teria para tirar",
    rendimentoBruto: "Rendimento antes dos descontos",
    impostos: "Impostos",
    taxas: "Taxas",
    rendimentoLiquido: "Rendimento líquido (o que fica para você)",
    semTaxas: "Este investimento não cobra taxa.",
    graficoTitulo: "Seu dinheiro ao longo do tempo",
    graficoColocou: "Você colocou",
    graficoSaldo: "Seu saldo",
    graficoNota: "antes do imposto, cobrado só quando você tira",
    verDetalhes: "Ver detalhes",
    // inicial e mensal chegam como números; os demais já formatados.
    explicacao: ({ prazo, inicial, mensal, final, impostos }) => {
      const brl = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
      const partes = [inicial > 0 ? `${brl(inicial)} agora` : "", mensal > 0 ? `${brl(mensal)} por mês` : ""].filter(Boolean).join(" e ");
      return `Colocando ${partes}, em ${prazo} você deve ter cerca de ${final}. Já descontamos ${impostos} de impostos.`;
    },
    detalhes: {
      produto: "Investimento",
      rende: "Quanto rende",
      cdi: "CDI usado na conta",
      cdiExplica: "CDI é a taxa que os bancos usam como base para pagar quem investe. Ela muda com o tempo; usamos uma estimativa.",
      periodo: "Período",
      liquidez: "Quando pode tirar",
      impostos: "Regra de impostos",
      aliquota: "Imposto de Renda no final",
      aliquotaExplica: "porcentagem cobrada sobre o que rendeu",
      fgc: "Garantia",
      fgcSim: "Protegido pelo FGC até R$ 250 mil por banco.",
      fgcNao: "Sem garantia do FGC.",
      avancado: "Quer mudar o CDI, impostos ou comparar outros investimentos? Use o modo Avançado."
    }
  },

  avisos: {
    estimativa: "É uma estimativa, não uma promessa. O rendimento muda se o CDI mudar. Confira as condições no app do seu banco antes de investir."
  },

  erros: {
    valorVazio: "Coloque um valor para investir agora ou por mês.",
    valorNegativo: "Os valores não podem ser negativos.",
    prazo: "Escolha um prazo entre 1 mês e 50 anos.",
    produto: "Escolha onde você investe."
  }
};
