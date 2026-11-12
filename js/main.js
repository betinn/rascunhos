import { apps } from './apps.js';
import { cenaReino } from './cenas/reino.js';
import { cenaGlowup } from './cenas/glowup.js';
import { cenaGdsb } from './cenas/gdsb.js';
import { cenaSnake } from './cenas/snakevs.js';
import { cenaRabisco } from './cenas/rabisco.js';

// As cenas vivas, pelo nome usado em apps.js. Sem cena própria, a app usa o rabisco.
const CENAS = { reino: cenaReino, glowup: cenaGlowup, gdsb: cenaGdsb, snakevs: cenaSnake, rabisco: cenaRabisco };

const raiz = document.documentElement;
const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
const largo = matchMedia('(min-width: 900px)'); // duas colunas: o índice e a janela
const LUZ_NEUTRA = '#ffffff';
const PLATAFORMA = { web: 'Web', android: 'Android' };
const PROXIMO = { nome: 'Próximo rascunho', linha: 'Ainda sem nome. Quando sair do papel, aparece aqui.' };

// ---- Conteúdo vindo da lista de apps ------------------------------------------------
const seta = '<svg viewBox="0 0 24 12" width="22" height="11" fill="none" aria-hidden="true"><path d="M1 6h21M17 1l5 5-5 5"/></svg>';
const tipo = (a) => PLATAFORMA[a.plataforma] || a.plataforma;

function htmlLinha(a, i) {
  if (!a) {
    return `
      <li class="linha linha-proximo" data-i="${i}" style="--i:${i}">
        <div class="linha-cabeca">
          <span class="linha-nome"><span>${PROXIMO.nome}</span></span>
          <span class="linha-meta">${PROXIMO.linha}</span>
        </div>
      </li>`;
  }
  const d = a.detalhe;
  const fora = a.loja ? ' target="_blank" rel="noopener"' : '';
  const aviso = a.loja ? `<span class="so-leitor"> (abre a ${a.loja} em outra aba)</span>` : '';
  return `
    <li class="linha" id="${a.id}" data-i="${i}" style="--i:${i};--cor-app:${a.cor}">
      <h2 class="linha-titulo">
        <button type="button" class="linha-cabeca" id="botao-${a.id}" aria-expanded="false" aria-controls="painel-${a.id}">
          <span class="linha-nome"><span>${a.nome}</span></span>
          <span class="linha-meta">${a.genero}<span class="linha-tipo"><i></i>${tipo(a)}</span></span>
          <span class="linha-sinal" aria-hidden="true"></span>
        </button>
      </h2>
      <div class="painel" id="painel-${a.id}" role="region" aria-labelledby="botao-${a.id}" inert>
        <div class="painel-dentro">
          <div class="painel-cena"></div>
          <p class="painel-resumo">${a.resumo}</p>
          <a class="botao" href="${a.url}"${fora}><span>${a.botao}${aviso}</span> ${seta}</a>
          ${a.nota ? `<p class="painel-nota">${a.nota}</p>` : ''}
          ${
            d
              ? `<h3 class="painel-titulo">${d.titulo}</h3>
                 <ul class="exemplos">${d.exemplos.map((e) => `<li><h4>${e.titulo}</h4><p>${e.texto}</p></li>`).join('')}</ul>`
              : ''
          }
        </div>
      </div>
    </li>`;
}

const itens = [...apps, null]; // a última linha é o próximo rascunho
const indice = document.getElementById('indice');
const palco = document.getElementById('palco');
const varredura = document.getElementById('varredura');
const janela = {
  link: document.getElementById('janela-link'),
  tipo: document.getElementById('janela-tipo'),
  linha: document.getElementById('janela-linha'),
  legenda: document.getElementById('janela-legenda'),
};

indice.innerHTML = itens.map(htmlLinha).join('');

// ---- As linhas e as cenas -----------------------------------------------------------
const linhas = [...indice.children].map((el, i) => {
  const app = itens[i];
  const tela = document.createElement('div');
  tela.className = 'tela';
  if (app) tela.style.cssText = `--cor-app:${app.cor};--cor-app-tinta:${app.corTinta}`;
  palco.append(tela);
  const cena = (CENAS[app?.cena] || cenaRabisco)(tela, app || { cor: '#ffffff' }) || cenaRabisco(tela, app);
  cena.medir();
  return {
    el,
    app,
    tela,
    cena,
    alvoCena: tela.querySelector('canvas') || tela,
    nome: el.querySelector('.linha-nome > span'),
    botao: el.querySelector('button.linha-cabeca'),
    painel: el.querySelector('.painel'),
    vaga: el.querySelector('.painel-cena'), // onde a cena fica na tela estreita
  };
});

const parada = (l) => (l.cena.parado ? l.cena.parado() : l.cena.quadro(0.016, 0));
for (const l of linhas) {
  // A cena se refaz quando a tela dela muda de tamanho.
  new ResizeObserver(() => {
    l.cena.medir();
    if (reduzido.matches) parada(l);
  }).observe(l.tela);
}

let foco = -1;
let aberta = null;

/** Tela larga: todas as cenas moram na janela. Tela estreita: cada uma dentro da sua linha. */
function arrumar() {
  for (const l of linhas) (largo.matches || !l.vaga ? palco : l.vaga).append(l.tela);
}
largo.addEventListener('change', arrumar);
arrumar();

/** A app em destaque: a linha acende e a janela mostra a cena dela. */
function focar(i) {
  if (i === foco) return;
  foco = i;
  const a = itens[i];
  linhas.forEach((l, k) => {
    l.el.classList.toggle('em-foco', k === i);
    l.tela.classList.toggle('ativa', k === i);
  });
  raiz.style.setProperty('--luz', a ? a.cor : LUZ_NEUTRA);
  if (a) {
    janela.link.textContent = a.loja || new URL(a.url).host;
    janela.link.href = a.url;
    if (a.loja) janela.link.target = '_blank';
    else janela.link.removeAttribute('target');
    janela.link.rel = a.loja ? 'noopener' : '';
  } else {
    janela.link.textContent = '';
    janela.link.removeAttribute('href');
  }
  janela.tipo.textContent = a ? tipo(a) : '';
  janela.linha.textContent = (a || PROXIMO).linha;
  janela.legenda.textContent = a ? a.legenda || a.detalhe?.comparacao?.legenda || '' : '';
  // Uma faixa de luz atravessa a janela a cada troca.
  varredura.classList.remove('varrendo');
  void varredura.offsetWidth;
  varredura.classList.add('varrendo');
}

function abrir(i, { rolar = true } = {}) {
  const l = linhas[i];
  if (!l?.app) return;
  if (aberta === i) return fecharLinha();
  aberta = i;
  linhas.forEach((x, k) => {
    x.el.classList.toggle('aberta', k === i);
    x.botao?.setAttribute('aria-expanded', k === i);
    if (x.painel) x.painel.inert = k !== i;
  });
  raiz.classList.add('com-aberta');
  focar(i);
  history.replaceState(null, '', `#${l.app.id}`);
  // Espera a outra linha fechar para saber onde esta foi parar.
  if (rolar) setTimeout(() => l.el.scrollIntoView({ block: 'start', behavior: reduzido.matches ? 'auto' : 'smooth' }), 380);
}

function fecharLinha() {
  if (aberta === null) return;
  const l = linhas[aberta];
  aberta = null;
  l.el.classList.remove('aberta');
  l.botao.setAttribute('aria-expanded', 'false');
  l.painel.inert = true;
  raiz.classList.remove('com-aberta');
  history.replaceState(null, '', location.pathname + location.search);
}

indice.addEventListener('click', (e) => {
  const b = e.target.closest('button.linha-cabeca');
  if (b) abrir(+b.closest('.linha').dataset.i);
});
// Com uma linha aberta, a janela fica com ela: passar por outra linha não troca a cena.
const destacar = (e) => {
  const l = e.target.closest('.linha');
  if (l && aberta === null) focar(+l.dataset.i);
};
indice.addEventListener('pointerover', (e) => e.pointerType === 'mouse' && destacar(e));
indice.addEventListener('focusin', destacar);
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && aberta !== null) {
    const b = linhas[aberta].botao;
    fecharLinha();
    b.focus();
  }
});
addEventListener('hashchange', () => {
  const i = apps.findIndex((a) => a.id === location.hash.slice(1));
  if (i >= 0 && i !== aberta) abrir(i);
});

// ---- A luz: o ponteiro acende os nomes por onde passa -------------------------------
const rato = { x: 0, y: 0, ultimo: -1e9 };
const luz = { x: -999, y: -999, pronta: false };
addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType !== 'mouse') return;
    rato.x = e.clientX;
    rato.y = e.clientY;
    rato.ultimo = performance.now();
  },
  { passive: true },
);

let anterior = performance.now();
let t = 0;
let rodando = false;

function quadro(agora) {
  if (!rodando) return;
  requestAnimationFrame(quadro);
  const real = (agora - anterior) / 1000;
  anterior = agora;
  if (real > 0.5 || real <= 0) return; // voltou de outra aba
  const dt = Math.min(real, 1 / 30);
  t += dt;

  // Com o mouse parado, ou sem mouse, a luz passeia sozinha pelo índice.
  const comMouse = agora - rato.ultimo < 3000;
  let ax = rato.x;
  let ay = rato.y;
  if (!comMouse) {
    const r = indice.getBoundingClientRect();
    ax = r.left + r.width * (0.32 + 0.24 * Math.sin(t * 0.5));
    ay = r.top + r.height * (0.5 + 0.5 * Math.sin(t * 0.33));
  }
  if (!luz.pronta) {
    luz.x = ax;
    luz.y = ay;
    luz.pronta = true;
  }
  const pega = Math.min(1, dt * (comMouse ? 14 : 2.2));
  luz.x += (ax - luz.x) * pega;
  luz.y += (ay - luz.y) * pega;
  raiz.style.setProperty('--px', `${luz.x.toFixed(1)}px`);
  raiz.style.setProperty('--py', `${luz.y.toFixed(1)}px`);
  for (const l of linhas) {
    const r = l.nome.getBoundingClientRect();
    l.nome.style.setProperty('--lx', `${(luz.x - r.left).toFixed(1)}px`);
    l.nome.style.setProperty('--ly', `${(luz.y - r.top).toFixed(1)}px`);
  }

  // Só roda a cena que está à vista: a da janela, ou a da linha aberta na tela estreita.
  const viva = linhas[largo.matches ? foco : aberta];
  if (!viva) return;
  if (viva.cena.ponteiro) {
    const r = viva.alvoCena.getBoundingClientRect();
    const dentro = comMouse && rato.x >= r.left && rato.x <= r.right && rato.y >= r.top && rato.y <= r.bottom;
    viva.cena.ponteiro(rato.x - r.left, rato.y - r.top, dentro);
  }
  viva.cena.quadro(dt, t);
}

function comecar() {
  if (rodando || reduzido.matches || document.hidden) return;
  rodando = true;
  anterior = performance.now();
  requestAnimationFrame(quadro);
}

// Movimento reduzido: a luz não passeia e cada cena mostra um quadro parado.
function aplicarPreferencia() {
  raiz.classList.toggle('parado', reduzido.matches);
  if (reduzido.matches) {
    rodando = false;
    linhas.forEach(parada);
  } else comecar();
}
reduzido.addEventListener('change', aplicarPreferencia);
document.addEventListener('visibilitychange', () => (document.hidden ? (rodando = false) : comecar()));

{
  // Abre na linha do endereço, se houver.
  const i = apps.findIndex((a) => a.id === location.hash.slice(1));
  if (i >= 0) abrir(i, { rolar: !largo.matches });
  else focar(0);
}
aplicarPreferencia();
