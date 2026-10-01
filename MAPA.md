# MAPA DO PROJETO — SIMULADORA

> Atualize este arquivo sempre que a arquitetura mudar.
> Última atualização: 2026-10-01 — logo oficial RB no header e favicon.

## 1. Visão geral

- Simulador de investimentos de renda fixa, 100% front-end (HTML + CSS + JavaScript puro).
- Sem build, sem framework, sem `package.json`, sem back-end. Única dependência externa: fontes do Google Fonts (opcional).
- **Como abrir:** dar dois cliques em `index.html` (funciona direto do disco, sem servidor).
- Dois modos (botão no topo; a escolha fica salva no navegador):
  - **Simples** (padrão): 4 perguntas, um produto de um banco, resultado em linguagem simples.
  - **Avançado**: tela original, compara CDB/RDB, LCI/LCA, Tesouro Selic e Fundo DI com todos os parâmetros.

## 2. Estrutura

```text
SIMULADORA/
├── index.html            → estrutura das telas (Simples, Avançado, modal de ajuda) e carga dos scripts
├── css/estilos.css       → todo o visual: tokens RB (escuro/claro) + componentes
├── img/                  → logo RB (rb-logo.png) e ícones (rb-favicon.png, rb-apple-touch.png)
├── js/config.js          → valores padrão: CDI projetado, IR, IOF, come-cotas, custódia
├── js/produtos.js        → catálogo de bancos/produtos do Modo Simples
├── js/textos.js          → textos do Modo Simples: campos, botões, ajudas, resultados, avisos, erros
├── js/motor.js           → cálculos (não acessa a tela)
├── js/grafico.js         → gráfico de linhas em canvas (usado pelos dois modos)
├── js/modo-avancado.js   → tela Avançada (lê o formulário original e mostra a comparação)
├── js/modo-simples.js    → tela Simples (lê as 4 perguntas, monta a simulação e mostra o resultado)
├── js/app.js             → aplica os textos (data-texto) e troca de modo
├── MAPA.md               → este arquivo
└── README.md
```

**Ordem dos scripts importa** (em `index.html`): config → produtos → textos → motor → grafico → modo-avancado → modo-simples → app.
Os scripts são comuns (não são módulos ES) para funcionar ao abrir o arquivo direto, sem servidor. Cada um expõe um objeto global: `Config`, `Catalogo`, `Textos`, `Motor`, `Grafico`.

## 3. Identidade visual RB

- Todos os valores visuais são **tokens** no topo de `css/estilos.css` (`--rb-*`). Componentes só usam tokens.
- Tema escuro é o padrão (`:root`); tema claro em `:root[data-theme="light"]`. Botão no header (`#theme-toggle`); escolha salva em `localStorage` (`rb-tema`); o `<head>` aplica antes de desenhar.
- Fontes: Inter (interface) e JetBrains Mono (valores, datas, rótulos técnicos), via Google Fonts, com fontes do sistema como reserva.
- Azul (`--rb-blue`) só para destaque: estado ativo, foco, valor ganho, valor final, indicadores.
- Gráfico: cores vêm dos tokens `--rb-series-1..4`, `--rb-grid`, `--rb-muted` (o canvas lê o tema atual; troca de tema dispara redesenho).
- Ícones: SVG inline no estilo Lucide (linhas, 1.75 de espessura), classe `.icon`.
- **Logo:** `img/rb-logo.png` (monograma oficial, branco, fundo transparente; no tema claro o CSS inverte para preto). Favicon `img/rb-favicon.png` (64px) e `img/rb-apple-touch.png` (180px): monograma sobre quadrado preto arredondado, como no guia da marca. Se receber o SVG oficial, troque esses arquivos mantendo os nomes.

## 4. Onde fica cada coisa

| Assunto | Local |
|---|---|
| Interface Simples | `index.html` → `#modo-simples` (IDs com prefixo `s-`) |
| Interface Avançada | `index.html` → `#modo-avancado` (IDs originais, sem prefixo) |
| Modal de ajuda | `index.html` → `<dialog id="ajuda-modal">`; botões `?` usam `data-ajuda="chave"` |
| Lógica da simulação | `js/motor.js` → `runSimulation(settings, produtos, serieCdi)` |
| Cálculos de IR/IOF/come-cotas/custódia | `js/motor.js` → `taxRate`, `iofRate`, `calcIofTax`, `applyComeCotas`, `simulateProduct` |
| Textos do Modo Simples | `js/textos.js` (no HTML, via atributo `data-texto="grupo.chave"`) |
| Textos do Modo Avançado | continuam no HTML e em `js/modo-avancado.js` (como no original) |
| Padrões do Modo Simples | `js/config.js` |
| Padrões do Modo Avançado | atributos `value=` dos inputs no HTML (o CDI vem de `Config.cdiPadrao`) |
| Bancos e produtos | `js/produtos.js` |

## 5. Motor de cálculo (`js/motor.js`)

- `runSimulation(settings, produtos, serieCdi)` → `{ products, settings, deposits }`.
- `produtos`: lista de `{ key, name, rule, rate, limit?, rateAbove? }`.
  - `limit`/`rateAbove` (opcional): só os primeiros `limit` reais do **saldo** rendem `rate`; o excedente rende `rateAbove` (usado na Caixinha Turbo). A taxa do dia é a média ponderada aplicada a todos os lotes.
  - `rule` = regra de cálculo: `"cdb"` (CDB/RDB/Caixinha: IR regressivo + IOF), `"lci"` (isento de IR + carência), `"tesouro"` (IR + custódia B3), `"fund"` (IR + come-cotas + taxa de administração).
  - `rate` = fração do CDI (1 = 100%).
- `settings`: datas, valores, frequências, tabelas de impostos. `settings.depositStart` (opcional) define o 1º aporte recorrente; o Modo Simples usa "1 mês depois do início", o Avançado usa a data inicial (como no original).
- Simulação **dia a dia**, base 252 dias úteis, cada aporte vira um lote (IR e IOF pela idade de cada lote), resgate FIFO, resgate total hipotético no fim para obter o valor líquido.
- Resultado por produto: `finalValue` (líquido), `grossFinalValue` (bruto), `invested`, `earnings`, `totalTaxes`, `totalFees`, `points` (mensal; o último ponto é líquido), `events`.

## 6. Como adicionar um produto ou banco

1. Abra `js/produtos.js`.
2. Adicione um objeto em `produtos` do banco (ou um banco novo em `bancos`) com `id`, `nome`, `regra`, `percentualCdi`, `liquidez`, `fgc`, `resumo`.
3. Se o produto tiver regra própria (prazo de carência, taxa de administração etc.), use `parametros` para sobrescrever `Config.impostos`. Ex.: `parametros: { lciLockDays: 90 }`.
4. Com mais de um produto no banco, o campo "Qual investimento?" aparece sozinho.
5. Produto com taxa que varia (a pessoa informa): `taxaEditavel: true`; `percentualCdi` vira o valor sugerido no campo "Quanto o app oferece?" (`#s-taxa`).
6. Produto com limite de valor: use `limiteValor` + `percentualAcimaDoLimite` (e `condicao` para explicar o requisito).
7. Só é preciso mexer no motor se surgir uma regra de cálculo nova (ex.: taxa prefixada, IPCA+).

## 7. Produtos Nubank (pesquisa de out/2026)

| Produto | Regra | Rendimento | Situação |
|---|---|---|---|
| Caixinha (RDB resgate imediato) | `cdb` | 100% do CDI, FGC, resgate na hora | **Ativo** |
| Caixinha Turbo 120% / 115% | `cdb` + `limiteValor` | 120% até R$ 10 mil (Nubank+/Ultravioleta) ou 115% até R$ 5 mil (quem movimenta R$ 900/mês); vale 31 dias, renovável; excedente 100% | **Ativo** (considera a condição mantida todo mês) |
| RDB Planejado | `cdb` + `taxaEditavel` | ~102,5% a 104% do CDI conforme a data (sem tabela pública); padrão 102,5%, a pessoa informa a taxa do app; sem resgate antes do prazo (o prazo da simulação = vencimento) | **Ativo** |
| LCI/LCA | `lci` | % do CDI conforme a oferta | Futuro |
| Tesouro Direto | `tesouro` | Selic | Futuro |
| Nu Reserva (fundos) | `fund` | Variável, sem garantia | Futuro |

Impostos em 2026: tabela regressiva (22,5% / 20% / 17,5% / 15%) e isenção de LCI/LCA continuam valendo (a MP 1.303/2025 perdeu a validade).

## 8. Pontos de atenção

- **CDI padrão** (`Config.cdiPadrao` = 14,15% a.a., ago/2026): revisar periodicamente.
- Botão "CDI online" (Modo Avançado): a série 12 do BCB vem em **% ao dia** e é convertida para % ao ano (base 252) ao carregar. O CSV importado espera % ao ano.
- O Modo Avançado repete no HTML os padrões de impostos que estão em `Config.impostos`. Ao mudar a lei, atualize os dois.
- `hidden` só funciona por causa da regra `[hidden] { display: none !important; }` em `estilos.css` (as classes `.layout` e `.field` usam `display: grid`).
- Gráfico: o Modo Simples desenha o saldo **bruto** (o imposto só é cobrado no resgate) e uma linha tracejada com o total depositado.
- Datas de feriado: só os nacionais (cálculo da Páscoa incluso); locais apenas no Modo Avançado (campo "Feriados extras").
