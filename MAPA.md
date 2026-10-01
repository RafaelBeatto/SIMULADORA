# MAPA DO PROJETO — SIMULADORA

> Atualize este arquivo sempre que a arquitetura mudar.
> Última atualização: 2026-10-01 (estado inicial, antes dos modos Simples/Avançado).

## 1. Visão geral

- Simulador de renda fixa atrelada ao CDI, 100% front-end (HTML + CSS + JavaScript puro).
- Sem build, sem framework, sem `package.json`, sem back-end.
- Roda abrindo `index.html` no navegador.
- Compara 4 alternativas ao mesmo tempo: CDB/RDB, LCI/LCA, Tesouro Selic, Fundo DI.

## 2. Estrutura

```text
SIMULADORA/
├── README.md     → só o título do projeto
├── index.html    → TODA a aplicação (737 linhas): CSS + HTML + JS
└── MAPA.md       → este arquivo
```

## 3. Dentro do `index.html`

| Parte | Linhas (aprox.) | Conteúdo |
|---|---|---|
| CSS | 8–165 | Variáveis de cor em `:root`, layout em grid, responsivo (980/760/380 px) |
| Cabeçalho e intro | 168–180 | Marca "rendimento", título "Quanto pode render?" |
| Formulário (interface) | 183–259 | `<form id="simulation-form">` com todos os campos |
| Área de resultados | 262–272 | `#results-content` (preenchido via JS), aviso legal |
| Script | 276–735 | Tudo em uma IIFE `(() => { ... })()` |

### 3.1 Campos do formulário (IDs)

- Período/valor: `start-date`, `end-date`, `initial-amount`
- CDI: `cdi-rate` (padrão 10% a.a.), `holiday-extra`, botão `fetch-cdi`, upload `csv-file`, status `rate-status`
- Aportes: `deposit-frequency` (none/weekly/monthly/quarterly/yearly), `deposit-amount`
- Resgates: `withdraw-frequency`, `withdraw-amount`
- % do CDI por produto: `cdb-percent`, `lci-percent`, `tesouro-percent`, `fund-percent`
- Avançado (`<details>`): `lci-lock-days`, `lci-tax-exempt`, `fund-type`, `fund-fee`, `custody-rate`, `custody-exempt`, `custody-months`, `iof-enabled`, `lci-iof`, `ir-day-180/360/720`, `ir-over-720`, `come-short`, `come-long`, `come-months`, `iof-table`
- Erros: `#error-message`

### 3.2 Funções do script

| Grupo | Funções | Papel |
|---|---|---|
| Constantes | `colors`, `names`, `cdiSeries` (Map data→taxa) | Produtos fixos no código; série de CDI carregada |
| Utilitários de data/moeda | `localIso`, `parseDate`, `addDays`, `roundMoney`, `currency`, `percentage`, `daysBetween` | Formatação pt-BR |
| Calendário | `easterSunday`, `holidaySet`, `isBusinessDay`, `first/last/nextBusinessDay`, `clampDate`, `scheduledDates` | Dias úteis (feriados nacionais + extras), agenda de aportes/resgates |
| Leitura da tela | `readSettings` | Converte o formulário em objeto `settings` (único ponto que lê o DOM para o cálculo) |
| **Cálculos (motor)** | `taxRate`, `iofRate`, `makeLot`, `distributeCost`, `calcIofTax`, `redemption`, `applyComeCotas`, `simulateProduct`, `runSimulation` | Simulação diária por lotes (FIFO), base 252, IR regressivo, IOF, come-cotas, taxa adm., custódia B3, carência |
| Validação | `validate` | Mensagens de erro |
| Saída | `renderResults`, `renderChart` (canvas 2D próprio), `escapeHtml` | Cards, gráfico, tabela, eventos |
| Eventos | submit do form, `fetch-cdi` (API SGS/BCB série 12), `csv-file`, `resize` | Interação |

### 3.3 Como o cálculo funciona (resumo)

1. Cada aporte vira um **lote** (`makeLot`) com data própria (IR/IOF por idade do lote).
2. Loop **dia a dia** de `start` a `end`; em dia útil aplica `(1+CDI)^(1/252)-1 × %CDI`.
3. Regras específicas por produto estão **dentro de `simulateProduct`/`calcIofTax`** via `if (product === "fund" | "tesouro" | "lci")`.
4. No fim, faz um resgate hipotético total para calcular o valor líquido.
5. Retorna: `finalValue`, `invested`, `earnings`, `totalTaxes`, `totalFees`, `points` (gráfico mensal), `events`.

## 4. Onde fica cada coisa

| Assunto | Local |
|---|---|
| Interface | `index.html` HTML (linhas 168–272) |
| Lógica da simulação | `runSimulation` / `simulateProduct` |
| Cálculos de imposto/taxa | `taxRate`, `iofRate`, `calcIofTax`, `applyComeCotas`, bloco custódia em `simulateProduct` |
| Textos | Espalhados no HTML e em strings do JS (não há arquivo de textos) |
| Configurações/padrões | Atributos `value=` dos inputs no HTML |
| Produtos | `names`/`colors` no topo do script + `if (product === ...)` no motor |

## 5. Dependências

- Nenhuma biblioteca externa.
- Rede opcional: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados` (CDI diário) — só ao clicar em "CDI online".

## 6. Pontos de atenção para futuras alterações

- **Produtos estão "chumbados"** no motor (`names` + `if product ===`). Para adicionar bancos/produtos sem reescrever, separar *regras fiscais* (tipo de produto) de *ofertas* (banco + % do CDI).
- `readSettings` lê o DOM diretamente: o motor não é reutilizável por outra tela sem passar um objeto `settings`.
- Aporte recorrente começa **na data inicial** (soma-se ao aporte inicial no dia 0). Ex.: R$ 1.000 + R$ 200/mês por 12 meses = 13 aportes de R$ 200.
- CDI padrão (10% a.a.) está desatualizado frente ao CDI de 2026 (~14,15% a.a.).
- Tabelas de IR/IOF são editáveis; vigentes em 2026 (MP 1.303/2025 caducou; tabela regressiva e isenção de LCI/LCA mantidas).
- Gráfico é canvas próprio; redesenha no `resize` usando `lastResults`.
- Arquivo único com ~740 linhas: alterações devem ser pontuais para não quebrar o modo atual.
