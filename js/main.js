import { apps } from './apps.js';
import { montarCena, montarAbertura, TRACOS_PALAVRA, CAIXA_PALAVRA } from './cenas.js';
import { criarTinta } from './tinta.js';

const raiz = document.documentElement;
const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
const DURACAO_TROCA = 1350; // ms: quanto a tinta leva para virar outra cena

// ---- Conteúdo vindo da lista de apps ------------------------------------------------
const seta = '<svg viewBox="0 0 24 12" width="22" height="11" fill="none" aria-hidden="true"><path d="M1 6c7-1 14 1 21 0M17 1l5 5-5 5"/></svg>';

const PLATAFORMA = { web: 'Web', android: 'Android' };

/** Link para a app. Quando ele leva a uma loja, abre em outra aba e avisa o leitor de tela. */
function linkApp(a, texto, classe = 'app-botao') {
  const fora = a.loja ? ` target="_blank" rel="noopener"` : '';
  const aviso = a.loja ? `<span class="so-leitor"> (abre a ${a.loja} em outra aba)</span>` : '';
  return `<a class="${classe}" href="${a.url}"${fora}>${texto}${aviso} ${seta}</a>`;
}

const menu = document.getElementById('menu');
menu.innerHTML = [
  '<a class="menu-inicio" href="#abertura" data-app="abertura">Início</a>',
  ...apps.map((a) => `<a class="app-${a.id}" href="#${a.id}" data-app="${a.id}" title="${a.nome}"><i></i><span class="menu-nome">${a.nome}</span></a>`),
].join('');
// Com muitas apps, o menu do computador mostra só o ponto de cada uma e o nome da atual.
menu.classList.toggle('menu-compacto', apps.length > 4);

// Abertura: um índice compacto e uma ficha da app em destaque, que a tinta desenha no palco.
const indice = document.getElementById('indice');
indice.style.setProperty('--n', apps.length);
indice.classList.toggle('indice-longo', apps.length > 4);
indice.innerHTML = `<ul>${apps
  .map(
    (a, k) => `
    <li><a class="indice-app app-${a.id}" href="#${a.id}" data-foco="${k}">
      <i></i><span class="indice-nome">${a.nome}</span>
      <span class="indice-plataforma">${PLATAFORMA[a.plataforma] || a.plataforma}</span>
    </a></li>`,
  )
  .join('')}</ul>`;

document.getElementById('fichas').innerHTML = apps
  .map(
    (a, k) => `
    <article class="ficha app-${a.id}" data-ficha="${k}" aria-labelledby="ficha-${a.id}">
      <p class="app-genero">${a.genero} · ${PLATAFORMA[a.plataforma] || a.plataforma}</p>
      <h2 class="app-nome" id="ficha-${a.id}">${a.nome}</h2>
      <p class="ficha-linha">${a.linha}</p>
      <div class="ficha-acoes">
        ${linkApp(a, a.botaoCurto)}
        <a class="ficha-mais" href="#${a.id}">Saiba mais<span class="so-leitor"> sobre ${a.nome}</span></a>
      </div>
    </article>`,
  )
  .join('');

function htmlDetalhe(a) {
  const d = a.detalhe;
  const capturas = (d.capturas || [])
    .map((c) => `<img class="captura captura-${c.tipo}" data-src="${c.src}" alt="${c.alt}" width="${c.largura}" height="${c.altura}">`)
    .join('');
  return `
    <section id="${a.id}-exemplos" class="parada parada-detalhe app-${a.id}" data-cena="${d.cena}" data-app="${a.id}" data-rotulo="${d.rotulo}">
      <div class="painel" tabindex="-1">
        <div class="cena-alvo item ${capturas ? 'com-capturas' : ''}">${capturas}</div>
        <div class="detalhe-corpo">
          <p class="app-genero item">${a.nome}</p>
          <h2 class="detalhe-titulo item">${d.titulo}</h2>
          <ul class="exemplos">
            ${d.exemplos.map((e) => `<li class="item"><h3>${e.titulo}</h3><p>${e.texto}</p></li>`).join('')}
          </ul>
          ${linkApp(a, a.botao, 'app-botao item')}
        </div>
      </div>
    </section>`;
}

document.getElementById('paradas-apps').innerHTML = apps
  .map(
    (a) => `
    <section id="${a.id}" class="parada parada-app app-${a.id}" data-cena="${a.cena}" data-app="${a.id}" data-rotulo="${a.nome}">
      <div class="painel" tabindex="-1">
        <div class="cena-alvo item"></div>
        <div class="app-corpo">
          <p class="app-genero item">${a.genero}</p>
          <h2 class="app-nome item">${a.nome}</h2>
          <p class="app-resumo item">${a.resumo}</p>
          ${a.nota ? `<p class="app-nota item">${a.nota}</p>` : ''}
          ${linkApp(a, a.botao, 'app-botao item')}
        </div>
      </div>
    </section>
    ${a.detalhe ? htmlDetalhe(a) : ''}`,
  )
  .join('');

// Sem WebGL, a palavra fica num SVG com o mesmo desenho.
{
  const d = TRACOS_PALAVRA.map((t) => `M${t.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L')}`).join('');
  const { x0, y0, x1, y1 } = CAIXA_PALAVRA;
  document
    .getElementById('marca')
    .insertAdjacentHTML('beforeend', `<svg class="marca-svg" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" aria-hidden="true"><path d="${d}"/></svg>`);
}

// Atraso de entrada de cada item do painel
document.querySelectorAll('.painel').forEach((p) => {
  p.querySelectorAll('.item').forEach((el, i) => el.style.setProperty('--i', i));
});

// ---- As paradas: uma tela por vez, trocada por gesto ---------------------------------
const paradas = [...document.querySelectorAll('.parada')];
const indicePorId = new Map(paradas.map((p, i) => [p.id, i]));
const seguinte = document.getElementById('seguinte');
const seguinteTexto = document.getElementById('seguinte-texto');
const linksMenu = [...document.querySelectorAll('#menu a')];

let ativa = 0;
let ultimoGesto = -1e9;
const tinta = { troca: null, destaque: null };

// ---- A app em destaque na abertura -------------------------------------------------
// Sozinha, a abertura passa de uma app para a outra. Quando a pessoa escolhe uma no índice,
// ela para de girar. Com o ponteiro no palco ou na ficha, ela espera.
const GIRO_MS = 6500;
const palco = document.getElementById('palco');
const linksIndice = [...indice.querySelectorAll('[data-foco]')];
const fichas = [...document.querySelectorAll('[data-ficha]')];
let foco = -1;
let giro = 0;
let giroLivre = true;
let giroEspera = false;

function destacar(k, { pessoa = false } = {}) {
  k = (k + apps.length) % apps.length;
  if (pessoa) pararGiro();
  if (k !== foco) {
    foco = k;
    linksIndice.forEach((l, j) => l.classList.toggle('em-foco', j === k));
    fichas.forEach((f, j) => f.classList.toggle('ativa', j === k));
    palco.className = `palco cena-alvo item app-${apps[k].id}`;
    // No celular, o índice é uma fileira que rola: a app escolhida vem para o meio.
    const l = linksIndice[k];
    if (indice.scrollWidth > indice.clientWidth + 2) {
      indice.scrollTo({ left: l.offsetLeft - (indice.clientWidth - l.offsetWidth) / 2, behavior: reduzido.matches ? 'auto' : 'smooth' });
    }
    tinta.destaque?.(k);
  }
  agendarGiro();
}

function agendarGiro() {
  clearTimeout(giro);
  indice.classList.remove('girando');
  if (!giroLivre || giroEspera || reduzido.matches || ativa !== 0 || document.hidden) return;
  void indice.offsetWidth; // recomeça a barrinha do tempo
  indice.classList.add('girando');
  giro = setTimeout(() => ativa === 0 && destacar(foco + 1), GIRO_MS);
}

function pararGiro() {
  giroLivre = false;
  clearTimeout(giro);
  indice.classList.remove('girando');
}

indice.style.setProperty('--giro', `${GIRO_MS}ms`);
destacar(0);

// Mouse: passar por cima destaca. Toque: o primeiro toque destaca, o segundo entra.
indice.addEventListener('pointerover', (e) => {
  const l = e.target.closest('[data-foco]');
  if (l && e.pointerType === 'mouse') destacar(+l.dataset.foco, { pessoa: true });
});
indice.addEventListener('focusin', (e) => {
  const l = e.target.closest('[data-foco]');
  if (l?.matches(':focus-visible')) destacar(+l.dataset.foco, { pessoa: true });
});
indice.addEventListener('click', (e) => {
  const l = e.target.closest('[data-foco]');
  if (!l || +l.dataset.foco === foco) return;
  e.preventDefault();
  e.stopPropagation();
  destacar(+l.dataset.foco, { pessoa: true });
});
for (const el of [palco, document.getElementById('fichas')]) {
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    giroEspera = true;
    agendarGiro();
  });
  el.addEventListener('pointerleave', () => {
    giroEspera = false;
    agendarGiro();
  });
}
reduzido.addEventListener('change', agendarGiro);
document.addEventListener('visibilitychange', agendarGiro);

function carregarCapturas(i) {
  paradas[i]?.querySelectorAll('img[data-src]').forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
}

function atualizarAoRedor() {
  const parada = paradas[ativa];
  const app = parada.dataset.app || 'abertura';
  raiz.dataset.parada = app;
  raiz.classList.toggle('em-abertura', ativa === 0);
  for (const l of linksMenu) {
    if (l.dataset.app === app) l.setAttribute('aria-current', 'true');
    else l.removeAttribute('aria-current');
  }
  // No celular, o menu de baixo rola para o lado quando há muitas apps: a atual fica à vista.
  const atual = menu.querySelector('[aria-current]');
  if (atual && menu.scrollWidth > menu.clientWidth + 2) {
    menu.scrollTo({ left: atual.offsetLeft - (menu.clientWidth - atual.offsetWidth) / 2, behavior: 'auto' });
  }
  const ultima = ativa === paradas.length - 1;
  const destino = ultima ? paradas[0] : paradas[ativa + 1];
  seguinte.href = `#${destino.id}`;
  seguinte.classList.toggle('para-cima', ultima);
  seguinteTexto.textContent = ultima ? 'Voltar ao início' : destino.dataset.rotulo;
  carregarCapturas(ativa);
  carregarCapturas(ativa + 1);
}

function irPara(i, { focar = false } = {}) {
  i = Math.max(0, Math.min(paradas.length - 1, i));
  if (i === ativa) return;
  raiz.classList.remove('primeira-vez');
  raiz.style.setProperty('--dir', i > ativa ? 1 : -1);
  const saindo = paradas[ativa];
  saindo.classList.remove('ativa');
  saindo.classList.add('saindo');
  setTimeout(() => saindo.classList.remove('saindo'), reduzido.matches ? 0 : 420);
  ativa = i;
  paradas[i].classList.remove('saindo');
  paradas[i].classList.add('ativa');
  paradas[i].querySelector('.painel').scrollTop = 0;
  atualizarAoRedor();
  const hash = i === 0 ? location.pathname + location.search : `#${paradas[i].id}`;
  history.replaceState(null, '', hash);
  if (focar) paradas[i].querySelector('.painel').focus({ preventScroll: true });
  tinta.troca?.(i);
  agendarGiro();
}

/** O painel ainda tem o que rolar nessa direção? Tela baixa ou zoom alto chegam aqui. */
function painelRola(dir) {
  const p = paradas[ativa].querySelector('.painel');
  if (p.scrollHeight <= p.clientHeight + 2) return false;
  return dir > 0 ? p.scrollTop + p.clientHeight < p.scrollHeight - 2 : p.scrollTop > 2;
}

function passo(dir) {
  const agora = performance.now();
  if (agora - ultimoGesto < 700) return;
  const destino = ativa + dir;
  if (destino < 0 || destino >= paradas.length) return;
  ultimoGesto = agora;
  irPara(destino);
}

// Roda do mouse e trackpad: um gesto, uma parada. A inércia do trackpad não conta.
let somaRoda = 0;
let ultimaRoda = 0;
let rodaGasta = false;
addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) return;
    const agora = performance.now();
    const dir = Math.sign(e.deltaY);
    if (!dir || painelRola(dir)) return;
    if (agora - ultimaRoda > 140) {
      somaRoda = 0;
      rodaGasta = false; // só volta a contar depois de uma pausa
    }
    ultimaRoda = agora;
    somaRoda += e.deltaY;
    if (Math.abs(somaRoda) > 36 && !rodaGasta) {
      rodaGasta = true;
      passo(dir);
    }
  },
  { passive: true },
);

// Toque: deslizar na vertical troca de parada.
let toque = null;
addEventListener(
  'touchstart',
  (e) => {
    const t = e.touches[0];
    toque = {
      x: t.clientX,
      y: t.clientY,
      topo: paradas[ativa].querySelector('.painel').scrollTop,
      dedos: e.touches.length,
      noIndice: indice.contains(e.target),
    };
  },
  { passive: true },
);
addEventListener(
  'touchend',
  (e) => {
    if (!toque || toque.dedos > 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - toque.x;
    const dy = t.clientY - toque.y;
    const rolou = paradas[ativa].querySelector('.painel').scrollTop !== toque.topo;
    const noIndice = toque.noIndice;
    toque = null;
    // Na abertura, deslizar para o lado troca a app em destaque. O índice rola sozinho.
    if (ativa === 0 && !noIndice && Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      destacar(foco + (dx < 0 ? 1 : -1), { pessoa: true });
      return;
    }
    if (rolou || Math.abs(dy) < 44 || Math.abs(dy) < Math.abs(dx) * 1.3) return;
    const dir = dy < 0 ? 1 : -1;
    if (!painelRola(dir)) passo(dir);
  },
  { passive: true },
);

// Teclado
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const para = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key];
  if (para) {
    if (painelRola(para)) return;
    e.preventDefault();
    if (!e.repeat) passo(para);
  } else if (ativa === 0 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    destacar(foco + (e.key === 'ArrowRight' ? 1 : -1), { pessoa: true });
  } else if (e.key === 'Home') {
    irPara(0, { focar: true });
  } else if (e.key === 'End') {
    irPara(paradas.length - 1, { focar: true });
  }
});

// Links internos trocam de parada, sem pular a página.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const i = indicePorId.get(a.getAttribute('href').slice(1));
  if (i === undefined) return;
  e.preventDefault();
  irPara(i, { focar: true });
});

addEventListener('hashchange', () => {
  const i = indicePorId.get(location.hash.slice(1));
  irPara(i ?? 0);
});

// Abre na parada do endereço, se houver.
{
  const i = indicePorId.get(location.hash.slice(1));
  if (i) {
    paradas[0].classList.remove('ativa');
    paradas[i].classList.add('ativa');
    ativa = i;
    raiz.classList.remove('primeira-vez');
  }
  atualizarAoRedor();
}

// ---- A tinta ----------------------------------------------------------------------
const canvas = document.getElementById('tinta');
const pequeno = Math.min(innerWidth, innerHeight) < 620 || matchMedia('(hover: none)').matches;
const fraco = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const motor = criarTinta(canvas, {
  particulas: Math.round((pequeno ? 24000 : 60000) * (fraco ? 0.6 : 1)),
  dprMax: pequeno ? 1.5 : 1.5,
});

// As cores que a íris passeia: âmbar, jade, azul-gelo e violeta.
const PALETA_IRIS = [
  [1.0, 0.64, 0.3],
  [0.34, 0.92, 0.6],
  [0.42, 0.76, 1.0],
  [0.84, 0.52, 1.0],
];
function corDaIris(t) {
  const f = t / 4.5;
  const n = PALETA_IRIS.length;
  const i = ((Math.floor(f) % n) + n) % n;
  const de = PALETA_IRIS[i];
  const para = PALETA_IRIS[(i + 1) % n];
  const k = Math.max(0, ((f - Math.floor(f)) - 0.72) / 0.28);
  const u = k * k * (3 - 2 * k);
  return de.map((v, c) => v + (para[c] - v) * u);
}

// Só agora: com movimento reduzido, iniciarTinta já desenha um quadro e precisa da paleta acima.
if (!motor) raiz.classList.add('sem-webgl');
else iniciarTinta();

function iniciarTinta() {
  let vh = 1;
  let vw = 1;
  let metas = [];

  const caixa = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  let medidaAnterior = '';
  function construir() {
    // Redesenhar sorteia de novo o lugar de cada partícula e espalha a tinta. Só vale a pena
    // quando o layout mudou mesmo.
    const medida = JSON.stringify([
      canvas.clientWidth,
      canvas.clientHeight,
      devicePixelRatio,
      ...[...document.querySelectorAll('#marca, .cena-alvo')].map(caixa),
    ]);
    if (medida === medidaAnterior) return;
    medidaAnterior = medida;
    vw = canvas.clientWidth;
    vh = canvas.clientHeight;
    motor.redimensionar(vw, vh, devicePixelRatio || 1);
    // Camadas: uma por app na abertura (a palavra e a app no palco), depois uma por parada.
    const desenhos = [
      ...montarAbertura(caixa(document.getElementById('marca')), caixa(palco), apps.map((a) => a.cena)),
      ...paradas.slice(1).map((p) => montarCena(p.dataset.cena, caixa(p.querySelector('.cena-alvo')))),
    ];
    metas = desenhos.map((d) => d.meta);
    motor.definirCenas(desenhos, { abertura: apps.length });
  }
  construir();

  // Ponteiro. No toque, ele só existe enquanto o dedo está na tela.
  const rato = { x: -9999, y: -9999, sx: -9999, sy: -9999, vx: 0, vy: 0, ultimo: -1e9 };
  const mover = (x, y) => {
    if (rato.sx < -9000) {
      rato.sx = x;
      rato.sy = y;
    }
    rato.x = x;
    rato.y = y;
    rato.ultimo = performance.now();
  };
  addEventListener('pointermove', (e) => mover(e.clientX, e.clientY), { passive: true });
  addEventListener('pointerdown', (e) => mover(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', (e) => mover(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  let forca = 0;
  let t = 0;
  let escrita = ativa === 0 ? 0 : 2;
  let anterior = performance.now();
  let rodando = false;
  let lentos = 0;
  let amostras = 0;
  let cortinaX = null;
  const olhar = [0, 0];
  let olharLivre = [0, 0];
  let olharAte = 0;

  // A troca de cena corre no relógio, não na rolagem: tinta e textos andam juntos.
  // cenaDe e cenaPara são camadas do motor; paradaPara é a parada, que move o papel.
  const camada = (i) => (i === 0 ? foco : apps.length - 1 + i);
  let cenaDe = camada(ativa);
  let cenaPara = cenaDe;
  let paradaPara = ativa;
  let inicioTroca = -1e9;
  let duracao = DURACAO_TROCA;
  let sentido = 1;
  let papelY = ativa * 260;
  let papelDe = papelY;

  function trocar(c, parada, sent, ms) {
    sentido = sent;
    cenaDe = cenaPara;
    cenaPara = c;
    paradaPara = parada;
    duracao = ms;
    inicioTroca = performance.now();
    papelDe = papelY;
    if (reduzido.matches) desenhoParado();
  }
  tinta.troca = (i) => trocar(camada(i), i, i > paradaPara ? 1 : -1, DURACAO_TROCA);
  // Trocar a app do palco não desliza nada: só o desenho do palco se refaz.
  tinta.destaque = (k) => {
    if (paradaPara === 0) trocar(k, 0, 0, 950);
  };

  const suave = (x) => x * x * (3 - 2 * x);

  function montarQuadro(dt, snap) {
    const agora = performance.now();
    const u = snap ? 1 : Math.min(1, (agora - inicioTroca) / duracao);
    if (u >= 1) cenaDe = cenaPara;
    const mix = cenaDe === cenaPara ? 0 : suave(u);
    // Uma cena sai para um lado e a outra chega do outro, como páginas no mesmo papel.
    const anda = vh * 0.16;
    const offA = [0, -sentido * anda * mix];
    const offB = [0, sentido * anda * (1 - mix)];
    papelY = papelDe + (paradaPara * 260 - papelDe) * suave(u);

    // A cortina do antes e depois segue o ponteiro; sem ele, passeia sozinha.
    const c = metas[cenaPara].cortina;
    let cortina = 0;
    if (c) {
      const sobre = forca > 0.3 && Math.abs(rato.sx - c.cx) < c.larg * 0.6 && Math.abs(rato.sy - c.cy) < c.alt * 0.6;
      const alvo = sobre ? rato.sx : c.cx + Math.sin(t * 0.85) * 0.34 * c.larg;
      cortinaX = cortinaX === null || snap ? alvo : cortinaX + (alvo - cortinaX) * Math.min(1, dt * 5);
      cortina = cortinaX;
    }

    // O olho do GlowUp: dilata, pisca, troca de cor e segue o ponteiro.
    const ol = metas[cenaPara].olho;
    let pupila = 0.38;
    let piscar = 0;
    let faixa = -9999;
    let iris = PALETA_IRIS[0];
    if (!snap) {
      iris = corDaIris(t);
      if (ol) {
        const [ox, oy, , hw] = ol.geo;
        const perto = forca > 0.2 && Math.hypot(rato.sx - ox, rato.sy - oy) < hw * 1.3;
        pupila = 0.37 + 0.03 * Math.sin(t * 0.63) + (perto ? 0.09 : 0);
        const fase = t % 6.7;
        piscar = fase < 0.3 ? Math.sin((Math.PI * fase) / 0.3) ** 0.8 : 0;
        const u2 = (t % 10) / 1.5;
        if (u2 < 1) faixa = ox + c.larg * (u2 * 1.7 - 0.85);
        let ax;
        let ay;
        if (forca > 0.2) {
          ax = (rato.sx - ox) / (hw * 1.5);
          ay = (rato.sy - oy) / (hw * 1.5);
          const l = Math.hypot(ax, ay);
          if (l > 1) {
            ax /= l;
            ay /= l;
          }
          ax *= 0.42;
          ay *= 0.2;
        } else {
          // Sem ponteiro, o olhar passeia em saltos curtos, como um olho de verdade.
          if (t > olharAte) {
            olharAte = t + 1.8 + Math.random() * 2.6;
            olharLivre = [(Math.random() - 0.5) * 0.46, (Math.random() - 0.5) * 0.16];
          }
          [ax, ay] = olharLivre;
        }
        const pega = Math.min(1, dt * (forca > 0.2 ? 8 : 16));
        olhar[0] += (ax - olhar[0]) * pega;
        olhar[1] += (ay - olhar[1]) * pega;
      }
    }

    return {
      dt,
      t,
      olhar: snap ? [0, 0] : olhar,
      pupila,
      piscar,
      iris,
      faixa,
      cenaA: cenaDe,
      cenaB: cenaPara,
      mix,
      offA: snap ? [0, 0] : offA,
      offB: snap ? [0, 0] : offB,
      escrita: snap ? 2 : escrita,
      rato: [rato.sx, rato.sy],
      ratoV: [rato.vx, rato.vy],
      ratoF: snap ? 0 : forca,
      papelY: snap ? paradaPara * 260 : papelY,
      cortina,
      snap,
    };
  }

  function laco(agora) {
    if (!rodando) return;
    requestAnimationFrame(laco);
    const real = (agora - anterior) / 1000;
    anterior = agora;
    if (real > 0.5) return; // voltou de outra aba
    // O primeiro quadro pode vir com horário anterior ao do início: sem tempo negativo.
    const dt = Math.max(0, Math.min(real, 1 / 30));
    t += dt;
    escrita = Math.min(2, escrita + dt / 2.2);

    const alvoForca = agora - rato.ultimo < 1400 ? 1 : 0;
    forca += (alvoForca - forca) * Math.min(1, dt * 5);

    const a = Math.min(1, dt * 14);
    const nx = rato.sx + (rato.x - rato.sx) * a;
    const ny = rato.sy + (rato.y - rato.sy) * a;
    rato.vx = (nx - rato.sx) / Math.max(dt, 1e-3);
    rato.vy = (ny - rato.sy) / Math.max(dt, 1e-3);
    rato.sx = nx;
    rato.sy = ny;

    motor.quadro(montarQuadro(dt, false));

    // Se o aparelho não dá conta, troca partículas por fluidez.
    amostras++;
    if (real > 0.024) lentos++;
    if (amostras >= 60) {
      if (lentos / amostras > 0.4 && motor.visiveis > 5000) motor.reduzir();
      amostras = 0;
      lentos = 0;
    }
  }

  function comecar() {
    if (rodando) return;
    rodando = true;
    anterior = performance.now();
    requestAnimationFrame(laco);
  }
  function parar() {
    rodando = false;
  }

  // Movimento reduzido: um desenho parado por parada, sem física nem rastro.
  function desenhoParado() {
    motor.quadro(montarQuadro(0.016, true));
  }

  function aplicarPreferencia() {
    if (reduzido.matches) {
      parar();
      raiz.classList.add('parado');
      desenhoParado();
    } else {
      raiz.classList.remove('parado');
      comecar();
    }
  }
  reduzido.addEventListener('change', aplicarPreferencia);
  aplicarPreferencia();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) parar();
    else if (!reduzido.matches) comecar();
  });

  let espera = 0;
  addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      construir();
      if (reduzido.matches) desenhoParado();
    }, 180);
  });

  // Fontes mudam o tamanho dos blocos, e a tinta segue o layout.
  document.fonts?.ready.then(() => {
    construir();
    if (reduzido.matches) desenhoParado();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    parar();
    raiz.classList.add('sem-webgl');
  });
}
