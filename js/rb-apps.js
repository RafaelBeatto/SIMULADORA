// Central RB — lista de aplicativos do launcher (único lugar para editar).
// Este arquivo é igual em todos os sistemas RB: ao mudar aqui, copie para os outros projetos.
//
// Campos:
//   id          identificador único (sem espaços)
//   name        nome curto mostrado no menu
//   description frase curta (aparece ao passar o mouse)
//   icon        nome de um ícone embutido (calculator, building, notebook, chart, file, settings, wheel, app)
//               ou caminho/URL de imagem (ex.: "img/meu-icone.png")
//   url         endereço do aplicativo. Enquanto começar com "URL_", o item aparece como "link pendente".
//   order       posição no menu (menor primeiro)
//   enabled     false esconde o aplicativo do menu
window.RB_APPS = [
  {
    id: "calculadora",
    name: "Calculadora",
    description: "Calculadora e ferramentas",
    icon: "calculator",
    url: "URL_DA_CALCULADORA",
    order: 1,
    enabled: true
  },
  {
    id: "central-secretaria",
    name: "Central da Secretaria",
    description: "Gestão da secretaria",
    icon: "building",
    url: "URL_DA_CENTRAL",
    order: 2,
    enabled: true
  },
  {
    id: "diario",
    name: "Diário",
    description: "Diário pessoal",
    icon: "notebook",
    url: "URL_DO_DIARIO",
    order: 3,
    enabled: true
  },
  {
    id: "investimentos",
    name: "Investimentos",
    description: "Simulador de investimentos",
    icon: "chart",
    url: "https://rafaelbeatto.github.io/SIMULADORA/",
    order: 4,
    enabled: true
  },
  {
    id: "gira-conhecimento",
    name: "Gira Conhecimento",
    description: "SAERO — A Roleta do Saber (jogo)",
    icon: "wheel",
    url: "https://rafaelbeatto.github.io/Gira--Conhecimento-SAERO-A-Roleta-do-Saber-Digitaal./",
    order: 5,
    enabled: true
  }
  // Exemplo para o futuro:
  // { id: "rb-docs", name: "RB Docs", description: "Editor de documentos", icon: "file", url: "URL_DO_RB_DOCS", order: 6, enabled: true }
];
