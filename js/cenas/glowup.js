// GlowUp: antes e depois com fotos de verdade. A original fica à esquerda da barra de luz e a
// versão escolhida à direita. Até a pessoa pegar a barra, ela passeia sozinha.

export function cenaGlowup(tela, app) {
  const c = app.detalhe?.comparacao;
  if (!c) return null;
  tela.classList.add('cena-glowup');
  tela.style.setProperty('--proporcao', `${c.largura} / ${c.altura}`);

  const img = (f, classe) => `<img class="${classe}" src="${f.src}" alt="${f.alt}" width="${c.largura}" height="${c.altura}" loading="lazy" decoding="async">`;
  const botoesVersao = (k) => c.pessoas[k].versoes.map((v, j) => `<button type="button" data-versao="${j}" aria-pressed="${j === 0}">${v.nome}</button>`).join('');

  tela.innerHTML = `
    <div class="comparador" style="--corte: 50%">
      ${c.pessoas
        .map(
          (p, k) => `
        <div class="comp-pessoa${k === 0 ? ' ativa' : ''}">
          ${p.versoes.map((v, j) => img(v, `comp-depois${j === 0 ? ' ativa' : ''}`)).join('')}
          ${img(p.original, 'comp-antes')}
        </div>`,
        )
        .join('')}
      <span class="comp-rotulo comp-rotulo-antes" aria-hidden="true">Original</span>
      <span class="comp-rotulo comp-rotulo-depois" aria-hidden="true">${c.pessoas[0].versoes[0].nome}</span>
      <span class="comp-linha" aria-hidden="true"></span>
      <input class="comp-controle" type="range" min="0" max="100" value="50" aria-label="Arraste para comparar a original com a editada">
    </div>
    <div class="comp-barra">
      ${
        c.pessoas.length > 1
          ? `<div class="comp-escolha comp-pessoas" role="group" aria-label="Exemplo">${c.pessoas
              .map((p, k) => `<button type="button" data-pessoa="${k}" aria-pressed="${k === 0}">${p.nome}</button>`)
              .join('')}</div>`
          : ''
      }
      <div class="comp-escolha comp-versoes" role="group" aria-label="Versão editada">${botoesVersao(0)}</div>
    </div>`;

  const comparador = tela.querySelector('.comparador');
  const controle = tela.querySelector('.comp-controle');
  const rotulo = tela.querySelector('.comp-rotulo-depois');
  const pessoas = [...tela.querySelectorAll('.comp-pessoa')];
  const versoes = tela.querySelector('.comp-versoes');
  let pessoa = 0;
  let mexeu = false;

  const pegar = () => (mexeu = true);
  controle.addEventListener('input', () => {
    pegar();
    comparador.style.setProperty('--corte', `${controle.value}%`);
  });
  controle.addEventListener('pointerdown', pegar);

  function versao(j) {
    pessoas[pessoa].querySelectorAll('.comp-depois').forEach((el, i) => el.classList.toggle('ativa', i === j));
    versoes.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.versao === j));
    rotulo.textContent = c.pessoas[pessoa].versoes[j].nome;
  }
  versoes.addEventListener('click', (e) => {
    const b = e.target.closest('[data-versao]');
    if (b) versao(+b.dataset.versao);
  });
  tela.querySelector('.comp-pessoas')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pessoa]');
    if (!b) return;
    pessoa = +b.dataset.pessoa;
    pessoas.forEach((p, k) => p.classList.toggle('ativa', k === pessoa));
    tela.querySelectorAll('.comp-pessoas button').forEach((x) => x.setAttribute('aria-pressed', +x.dataset.pessoa === pessoa));
    versoes.innerHTML = botoesVersao(pessoa);
    versao(0);
  });

  let fase = 0;
  return {
    medir() {},
    quadro(dt) {
      if (mexeu) return;
      fase += dt;
      const corte = 50 + 30 * Math.sin(fase * 0.9);
      comparador.style.setProperty('--corte', `${corte.toFixed(2)}%`);
      controle.value = Math.round(corte);
    },
  };
}
