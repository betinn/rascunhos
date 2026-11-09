// A lista de apps do site. Para adicionar uma, acrescente um objeto aqui.
// Descreva só o que existe de verdade.
//
// id          identificador curto: vira a âncora (#id) e a classe .app-id no CSS
// nome        nome mostrado na página
// url         endereço da app (navegação completa, link normal)
// cena        desenho da tinta, em js/cenas.js. Sem desenho próprio, use 'rabisco'
// genero      o que a app é, em poucas palavras
// linha       uma frase para o cartão da abertura
// botaoCurto  texto do botão no cartão da abertura
// resumo      um parágrafo para a seção da app
// nota        opcional: um aviso curto, como requisitos
// botao       texto do botão na seção da app
// detalhe     opcional: uma segunda parada, com exemplos
//   rotulo    nome da parada no botão "próximo"
//   cena      desenho da tinta nessa parada
//   titulo    título da parada
//   exemplos  lista de { titulo, texto }
//   capturas  opcional: lista de { src, alt, largura, altura, tipo: 'tela' | 'celular' }
export const apps = [
  {
    id: 'reino',
    nome: 'Reino de Pedra',
    url: 'https://reino.rascunhos.app',
    cena: 'reino',
    genero: 'MMO de estratégia medieval',
    linha: 'Um mundo persistente, em tempo real, que continua andando com você offline.',
    botaoCurto: 'Ver ao vivo',
    resumo:
      'Sem turnos. Você dá a ordem e sai: as obras terminam, as tropas marcham e as defesas reagem com você offline. O diferencial é explorar de verdade um mapa grande, com riqueza escondida na névoa.',
    nota: 'Feito para computador, com mouse e teclado. O mapa ao vivo é aberto, sem login. Para fundar um reino, é preciso pedir convite.',
    botao: 'Ver o mundo ao vivo',
    detalhe: {
      rotulo: 'Como é o Reino',
      cena: 'reino-perto',
      titulo: 'Todo mundo aqui tem nome',
      exemplos: [
        {
          titulo: 'Pessoas, não números',
          texto: 'Cada pessoa tem nome, ofício e lugar. O relatório da batalha diz quem morreu.',
        },
        {
          titulo: 'A névoa esconde a riqueza',
          texto: 'Jazidas valiosas só aparecem para o prospector. Exploradores podem ser capturados.',
        },
        {
          titulo: 'Tudo viaja pelo mapa',
          texto: 'Recurso fica no local onde está. A carga anda à vista e pode ser roubada no caminho.',
        },
        {
          titulo: 'Uma relíquia por reino',
          texto: 'Escavadas em ruínas antigas, dão bônus a um local. E podem ser roubadas.',
        },
      ],
    },
  },
  {
    id: 'glowup',
    nome: 'GlowUp',
    url: 'https://glowup.rascunhos.app',
    cena: 'glowup',
    genero: 'Editor de retoque de fotos',
    linha: 'Roda inteiro no navegador. Nada sai do seu aparelho. Nem um pixel.',
    botaoCurto: 'Abrir',
    resumo:
      'Pincéis, ajustes, filtros e exportação em resolução total, tudo na GPU do seu aparelho. Sem backend, sem API, sem upload. A original fica intacta, e cada edição pode ser desfeita.',
    botao: 'Abrir o GlowUp',
    detalhe: {
      rotulo: 'O que o GlowUp faz',
      cena: 'glowup-luz',
      titulo: 'Uma luz na foto, sem sair do aparelho',
      exemplos: [
        {
          titulo: 'Pele',
          texto: 'No Automático, as manchas somem uma a uma. Também suaviza, tira olheira e acerta o tom.',
        },
        {
          titulo: 'Olhos, make e cabelo',
          texto: 'Batom que não pinta os dentes, cor dos olhos e cor só nos fios.',
        },
        {
          titulo: 'Filtros',
          texto: 'Separados por categoria, com intensidade, favoritos e uma sugestão pelo tom da foto.',
        },
        {
          titulo: 'IA que só aponta',
          texto: 'Um detector no navegador acha rosto, olhos, boca e fios. Nunca diz quem é a pessoa.',
        },
      ],
      capturas: [
        {
          src: 'assets/capturas/glowup-inicial.webp',
          alt: 'Tela inicial do GlowUp no computador: "Nada sai do seu aparelho. Nem um pixel.", com o botão para escolher a foto.',
          largura: 1280,
          altura: 720,
          tipo: 'tela',
        },
        {
          src: 'assets/capturas/glowup-celular-inicial.webp',
          alt: 'Tela inicial do GlowUp no celular, com os botões para escolher ou tirar uma foto.',
          largura: 520,
          altura: 1125,
          tipo: 'celular',
        },
      ],
    },
  },
];
