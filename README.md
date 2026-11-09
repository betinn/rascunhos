# rascunhos

Site central de [rascunhos.app](https://rascunhos.app): a vitrine dos meus projetos e a porta de
entrada para as apps. Tudo aqui está em obra, e isso faz parte do charme.

São arquivos estáticos, sem backend, sem build e sem dependências.

## Como rodar

Sirva a pasta com qualquer servidor estático. Abrir o `index.html` direto não funciona, porque o
navegador bloqueia módulos JavaScript fora de um servidor.

```bash
python -m http.server 8732
```

Depois abra `http://localhost:8732`.

## Como adicionar uma app

1. Acrescente um objeto em [`js/apps.js`](js/apps.js). O comentário no topo do arquivo explica cada
   campo. O cartão na abertura, o menu e as seções saem daí. Descreva só o que existe de verdade.
2. Dê uma identidade à app em [`css/site.css`](css/site.css), copiando o bloco `.app-glowup`: cor,
   fonte e formato do botão. Sem isso, ela usa as cores do site.
3. Opcional: desenhe a cena dela em [`js/cenas.js`](js/cenas.js) e registre no objeto `CENA`. Sem
   desenho próprio, use `cena: 'rabisco'`.
4. Opcional: no `<noscript>` do [`index.html`](index.html), acrescente o link da app.

Cada desenho recebe a caixa do elemento `.cena-alvo`, então ele já se ajusta ao computador e ao
celular.

## Como funciona

| Arquivo | O que faz |
| --- | --- |
| `js/apps.js` | a lista de apps |
| `js/main.js` | monta a página e troca de parada |
| `js/cenas.js` | os desenhos: onde cada partícula quer pousar |
| `js/tinta.js` | o motor em WebGL2: física das partículas, rastro, brilho e papel |
| `css/site.css` | layout e identidade de cada app |

A página não rola. Ela é uma sequência de paradas, e um gesto (roda, deslizar ou teclado) leva à
parada seguinte. A troca corre no relógio, não na rolagem, para a tinta e os textos andarem juntos.
Um painel só rola por dentro quando o conteúdo não cabe na tela.

- **Movimento reduzido:** com `prefers-reduced-motion`, cada parada mostra um desenho parado.
- **Sem WebGL2:** a palavra vira um SVG, e o resto da página continua igual.
- **Sem JavaScript:** sobram os links para as apps.
- **Aparelho fraco:** o motor reduz o número de partículas sozinho quando os quadros atrasam.

## Anúncios

Ainda não há anúncios. O lugar reservado para eles é a parada final, marcada com um comentário no
`index.html`, para nunca ficarem por cima das apps.

## Licenças

Fontes Instrument Sans, Instrument Serif e Cinzel sob SIL Open Font License, com as licenças em
[`assets/fonts/`](assets/fonts/). Capturas de tela do GlowUp vêm do repositório dele, sob MIT.
