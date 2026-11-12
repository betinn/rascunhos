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
   campo. A linha no índice, o conteúdo da linha aberta e a janela saem daí. Descreva só o que
   existe de verdade, sem números que mudam com o tempo.
   - App na web: `url` é o endereço dela e `plataforma: 'web'`. O endereço aparece sob a janela.
   - App de loja: `url` é a página dela na loja, `plataforma: 'android'` e `loja: 'Google Play'`.
     O link abre em outra aba. Use um botão de texto próprio, como "Ver na Google Play", e não
     imite o selo da loja.
2. Opcional: escreva a cena viva dela em [`js/cenas/`](js/cenas/) e registre no objeto `CENAS` de
   [`js/main.js`](js/main.js). Sem cena própria, use `cena: 'rabisco'`.
3. Opcional: no `<noscript>` do [`index.html`](index.html), acrescente o link da app.

Uma cena é uma função que recebe a tela dela e devolve `medir()` e `quadro(dt, t)`. Ela pode
devolver também `ponteiro(x, y, dentro)`, para reagir ao mouse, e `parado()`, para o quadro de quem
pediu movimento reduzido.

As apps não têm fonte nem botão próprios: o índice usa uma letra só, e a cor de cada app aparece
apenas num ponto ao lado da plataforma e na luz em volta da janela.

### O índice com muitas apps

Cada app é uma linha, e a última, só com o contorno das letras, é o próximo rascunho. O tamanho dos
nomes segue a largura do índice. Com mais linhas do que cabem na tela, a página rola e a janela
acompanha.

## Como funciona

| Arquivo | O que faz |
| --- | --- |
| `js/apps.js` | a lista de apps |
| `js/main.js` | monta o índice, cuida do destaque e de abrir as linhas, e roda o laço de animação |
| `js/cenas/` | a cena viva de cada app |
| `css/site.css` | o índice, a janela e a luz |

A página é preta, com o índice das apps em letras grandes e apagadas.

- **Luz:** o ponteiro é uma luz branca, e os nomes acendem por onde ela passa. Com o mouse parado,
  ou sem mouse, a luz passeia sozinha pelo índice.
- **Destaque:** passar o mouse por uma linha acende o nome inteiro, e a janela ao lado troca para a
  cena viva daquela app, com uma faixa de luz. Dá para mexer na cena.
- **Abrir:** clicar na linha abre o resumo, o botão para a app e os exemplos. A linha aberta fica
  no endereço (`#glowup`), então dá para mandar o link dela. `Esc` fecha.
- **Cor:** só em dois lugares, o ponto ao lado da plataforma e a luz em volta da janela.
- **Tela estreita:** sobra só o índice, e a cena aparece dentro da linha aberta.
- **Movimento reduzido:** com `prefers-reduced-motion`, a luz não passeia e cada cena mostra um
  quadro parado.
- **Sem JavaScript:** sobram os links para as apps.

## Anúncios

Ainda não há anúncios. O lugar reservado para eles é depois do índice, marcado com um comentário no
`index.html`, para nunca ficarem por cima das apps.

## Licenças

Fontes Instrument Sans, Instrument Serif e Silkscreen sob SIL Open Font License, com as licenças em
[`assets/fonts/`](assets/fonts/). As fotos do GlowUp mostram um rosto gerado por IA, editado no
próprio GlowUp.
