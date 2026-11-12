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
   campo. A linha no índice da abertura, a ficha, o menu e as paradas saem daí. Descreva só o que
   existe de verdade, sem números que mudam com o tempo.
   - App na web: `url` é o endereço dela e `plataforma: 'web'`.
   - App de loja: `url` é a página dela na loja, `plataforma: 'android'` e `loja: 'Google Play'`.
     O link abre em outra aba. Use um botão de texto próprio, como "Ver na Google Play", e não
     imite o selo da loja.
2. Dê uma identidade à app em [`css/site.css`](css/site.css), copiando o bloco `.app-gdsb`: cor,
   fonte do nome e formato do botão. Se o nome tiver um jeito próprio no índice (caixa alta,
   itálico), acrescente uma regra `.app-<id> .indice-nome`. Sem nada disso, ela usa as cores do
   site.
3. Opcional: desenhe a cena dela em [`js/cenas.js`](js/cenas.js) e registre no objeto `CENA`. Sem
   desenho próprio, use `cena: 'rabisco'`. A mesma cena aparece no palco da abertura e na parada da
   app.
4. Opcional: no `<noscript>` do [`index.html`](index.html), acrescente o link da app.

Cada desenho recebe a caixa do elemento `.cena-alvo`, então ele já se ajusta ao computador e ao
celular.

### A abertura com muitas apps

A abertura não cresce com a lista. Ela tem a palavra, a ficha da app em destaque, o índice e o
palco, onde a tinta desenha a app em destaque.

- **Computador:** uma linha por app no índice. Passar o mouse destaca a app, e clicar abre a parada
  dela. Com mais de quatro apps, o índice vira duas colunas, e o menu do topo mostra só o ponto de
  cada app e o nome da atual.
- **Celular:** o índice vira uma fileira que rola para o lado, no lugar do menu de baixo. O primeiro
  toque destaca a app e o segundo abre a parada. Deslizar o palco para o lado também troca.
- **Sozinha,** a abertura passa de uma app para a outra até a pessoa escolher uma. Com o ponteiro
  no palco ou na ficha, ela espera. Com movimento reduzido, ela não gira.

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

Na abertura, a tinta tem uma camada por app: a palavra e a cena da app no palco. A palavra usa as
mesmas partículas, nos mesmos lugares, em todas as camadas. Por isso, quando a app em destaque
troca, só o palco se refaz.

- **Movimento reduzido:** com `prefers-reduced-motion`, cada parada mostra um desenho parado.
- **Sem WebGL2:** a palavra vira um SVG, o palco mostra a cor da app em destaque, e o resto da
  página continua igual.
- **Sem JavaScript:** sobram os links para as apps.
- **Aparelho fraco:** o motor reduz o número de partículas sozinho quando os quadros atrasam.

## Anúncios

Ainda não há anúncios. O lugar reservado para eles é a parada final, marcada com um comentário no
`index.html`, para nunca ficarem por cima das apps.

## Licenças

Fontes Instrument Sans, Instrument Serif, Cinzel e Silkscreen sob SIL Open Font License, com as
licenças em [`assets/fonts/`](assets/fonts/). As fotos do GlowUp mostram um rosto gerado por IA, editado
no próprio GlowUp.
