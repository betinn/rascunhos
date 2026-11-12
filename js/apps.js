// A lista de apps do site. Para adicionar uma, acrescente um objeto aqui.
// Descreva só o que existe de verdade.
//
// id          identificador curto: vira a âncora (#id) e a classe .app-id no CSS
// nome        nome mostrado na página
// url         para onde o botão leva: a própria app ou a página dela na loja
// plataforma  onde ela roda, mostrado no índice: 'web' ou 'android'
// loja        opcional: nome da loja quando o url leva a ela, como 'Google Play'.
//             O link abre em outra aba e ganha o aviso para leitor de tela.
// cena        cena viva na janela de prévia, em js/cenas/. Sem cena própria, use 'rabisco'
// cor         cor da app: o nome no índice, o botão e a luz em volta da janela
// corTinta    cor do texto sobre a cor da app
// legenda     opcional: uma frase sob a janela, dizendo o que a cena mostra
// genero      o que a app é, em poucas palavras
// linha       uma frase, mostrada sob a janela
// resumo      um parágrafo, mostrado quando a linha da app abre
// nota        opcional: um aviso curto, como requisitos
// botao       texto do botão
// detalhe     opcional: os exemplos, mostrados quando a linha abre
//   titulo    título dos exemplos
//   exemplos  lista de { titulo, texto }
//   comparacao  opcional, usada pela cena 'glowup': antes e depois com uma barra
//     legenda   uma frase sobre a origem das fotos
//     largura, altura  tamanho das imagens (todas iguais)
//     pessoas   lista de { nome, original: { src, alt }, versoes: [{ nome, src, alt }] }.
//               Com mais de uma pessoa, aparecem botões para trocar.
export const apps = [
  {
    id: 'glowup',
    nome: 'GlowUp',
    url: 'https://glowup.rascunhos.app',
    plataforma: 'web',
    cena: 'glowup',
    cor: '#ffb877',
    corTinta: '#1a0f05',
    genero: 'Editor de retoque de fotos',
    linha: 'Roda inteiro no navegador. Nada sai do seu aparelho. Nem um pixel.',
    resumo:
      'Pincéis, ajustes, filtros e exportação em resolução total, tudo na GPU do seu aparelho. Sem backend, sem API, sem upload. A original fica intacta, e cada edição pode ser desfeita.',
    botao: 'Abrir o GlowUp',
    detalhe: {
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
      comparacao: {
        legenda: 'Rosto gerado por IA. Retoque e filtros feitos no GlowUp.',
        largura: 800,
        altura: 1000,
        pessoas: [
          {
            nome: 'Ela',
            original: {
              src: 'assets/capturas/glowup-ela-original.webp',
              alt: 'Retrato original de uma mulher de cabelo escuro, com pontinhos vermelhos no queixo.',
            },
            versoes: [
              {
                nome: 'Retoque',
                src: 'assets/capturas/glowup-ela-retoque.webp',
                alt: 'A mesma foto com retoque: os pontinhos do queixo somem e a pele fica uniforme.',
              },
              {
                nome: 'Noite de festa',
                src: 'assets/capturas/glowup-ela-noite-de-festa.webp',
                alt: 'A mesma foto com o filtro Noite de festa: fundo escuro, contraste alto e tom quente.',
              },
              {
                nome: 'Neon',
                src: 'assets/capturas/glowup-ela-neon.webp',
                alt: 'A mesma foto com o filtro Neon: luz em azul-petróleo e lilás.',
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'reino',
    nome: 'Reino de Pedra',
    url: 'https://reino.rascunhos.app',
    plataforma: 'web',
    cena: 'reino',
    cor: '#ee9149',
    corTinta: '#1b0e04',
    legenda: 'Ilustração do mapa: a luz afasta a névoa.',
    genero: 'MMO de estratégia medieval',
    linha: 'Um mundo persistente, em tempo real, que continua andando com você offline.',
    resumo:
      'Sem turnos. Você dá a ordem e sai: as obras terminam, as tropas marcham e as defesas reagem com você offline. O diferencial é explorar de verdade um mapa grande, com riqueza escondida na névoa.',
    nota: 'Feito para computador, com mouse e teclado. O mapa ao vivo é aberto, sem login. Para fundar um reino, é preciso pedir convite.',
    botao: 'Ver o mundo ao vivo',
    detalhe: {
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
    id: 'snakevs',
    nome: 'Snake VS',
    url: 'https://snakevs.rascunhos.app',
    plataforma: 'web',
    cena: 'snakevs',
    cor: '#6cf08a',
    corTinta: '#0b2615',
    legenda: 'Ilustração: duas cobras disputam as maçãs.',
    genero: 'Jogo da cobrinha',
    linha: 'A cobrinha de sempre, com muros, poderes e um duelo contra a CPU.',
    resumo:
      'Deslize para virar, coma maçãs para crescer e não bata em nada. Simples de aprender, com visual retrô e movimento suave. No modo VS CPU, uma cobra rival disputa as mesmas maçãs.',
    nota: 'Roda no navegador, no celular ou no computador, com toque, teclado ou controle. Na web, dá para salvar a pontuação num ranking, só com um apelido.',
    botao: 'Jogar no navegador',
    detalhe: {
      titulo: 'Coma, cresça e não bata em nada',
      exemplos: [
        {
          titulo: 'Clássico',
          texto: 'A tela é aberta e a partida não tem fim. A cobra cresce sem parar, e o jogo acelera.',
        },
        {
          titulo: 'Níveis',
          texto: 'Cada nível novo traz muros e mais velocidade. Os primeiros são desenhados à mão.',
        },
        {
          titulo: 'VS CPU',
          texto: 'Uma cobra do computador disputa as maçãs com você e foge de becos sem saída.',
        },
        {
          titulo: 'Poderes',
          texto: 'Fantasma atravessa tudo, Escudo salva de uma batida e Tesoura corta a cauda. A maçã dourada some rápido.',
        },
      ],
    },
  },
  {
    id: 'gdsb',
    nome: 'GDSB',
    url: 'https://play.google.com/store/apps/details?id=gdsb.app',
    plataforma: 'android',
    loja: 'Google Play',
    cena: 'gdsb',
    cor: '#f27beb',
    corTinta: '#060b24',
    legenda: 'Ilustração: o cofre abre com a digital e tranca sozinho.',
    genero: 'Gerenciador de senhas offline',
    linha: 'Suas senhas num cofre cifrado, num arquivo que é seu. Sem conta e sem servidor.',
    resumo:
      'O cofre é um arquivo .GDSBX que você escolhe onde guardar, cifrado no próprio aparelho com AES-256-GCM e uma senha mestra. O app não pede internet: não há conta, servidor, anúncio nem rastreamento.',
    nota: 'Para Android, na Google Play.',
    botao: 'Ver na Google Play',
    detalhe: {
      titulo: 'A chave fica com você',
      exemplos: [
        {
          titulo: 'Um arquivo que é seu',
          texto: 'Guarde o cofre onde quiser, até numa pasta sincronizada do Drive ou do OneDrive. Ele só abre com a sua senha.',
        },
        {
          titulo: 'Backup a cada gravação',
          texto: 'Antes de salvar, a versão anterior vai para uma área privada do app. Dá para restaurar num arquivo novo.',
        },
        {
          titulo: 'Digital ou senha mestra',
          texto: 'A biometria abre o último cofre, se você quiser. A senha mestra sempre funciona.',
        },
        {
          titulo: 'Tranca sozinho',
          texto: 'Se você quiser, o cofre se fecha quando fica parado, e a senha copiada some da área de transferência.',
        },
      ],
    },
  },
];
