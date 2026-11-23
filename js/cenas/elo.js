// ELO: um dia com a Lia, a assistente que mora dentro do ELO. Em três pedidos, ela bloqueia a
// sexta à tarde, marca o dia inteiro como realizado de uma vez e soma o mês. Antes de cada
// mudança, mostra um cartão, e só faz depois do toque em confirmar. Volta ao começo, sem fim.
//
// O personagem, as etapas (lendo, olhando a agenda, montando o cartão, fazendo, feito), a boca
// que muda de forma com a mola, a magia de partículas e as letras que acendem vêm do design
// system do ELO, no modo escuro. Os nomes e os números são inventados.

import { liaSvg, animarLia } from './lia.js';

const HORA_INICIAL = 9;
const HORAS = 10; // das 9h às 19h

// O dia de hoje: [início em horas, duração, serviço, cliente]. Os três da manhã entram no lote.
const DIA = [
  [9, 1, 'Escova', 'Marina'],
  [10, 1, 'Manicure', 'Júlia'],
  [11, 1, 'Coloração', 'Renata'],
];
const BLOQUEIO = [13, 6]; // 13:00 às 19:00

// Os pedidos, como a pessoa escreve.
const PEDIDOS = [
  'Sexta à tarde não vou atender. Bloqueia.',
  'Marca os de hoje como realizados.',
  'Quanto eu faturei em outubro?',
];

// Os números de outubro, que contam até o valor: [rótulo, valor, formato].
const NUMEROS = [
  ['atendimentos realizados', 138, 'n'],
  ['faturados', 18354, 'r'],
  ['de ticket médio', 133, 'r'],
  ['de taxa de realização', 94, '%'],
];

// O roteiro, em segundos. A volta inteira dura DURA.
const T = {
  veuAbre: [0, 0.4],
  toqueFab1: 0.9,
  abre1: [0.95, 1.45],
  digita1: [1.75, 3.3],
  envia1: 3.45,
  lendo1: 3.55,
  olha1: 4.15,
  monta1: 4.95,
  cartao1: 5.65,
  toqueConf1: 7.2,
  executa1: 7.25,
  feito1: 7.95,
  resposta1: 8.2,
  toqueMin: 9.45,
  fecha1: [9.5, 9.95],
  trilhaBloqueio: [9.95, 10.85],
  bloqueio: [10.5, 11.05],
  toqueFab2: 11.8,
  abre2: [11.85, 12.35],
  digita2: [12.55, 13.7],
  envia2: 13.85,
  lendo2: 13.95,
  olha2: 14.45,
  monta2: 15.1,
  cartao2: 15.7,
  toqueConf2: 16.85,
  executa2: 16.9,
  itens: [17.2, 17.65, 18.1],
  feito2: 18.45,
  resposta2: 18.7,
  digita3: [19.5, 20.55],
  envia3: 20.7,
  lendo3: 20.8,
  olha3: 21.2,
  soma3: 21.6,
  resposta3: 22.35,
  conta: [22.6, 23.7],
  toqueFecha: 24.55,
  fecha3: [24.6, 25.05],
  veuFecha: [25.15, 25.6],
};
const DURA = 25.6;
const TOQUES = [T.toqueFab1, T.toqueConf1, T.toqueMin, T.toqueFab2, T.toqueConf2, T.toqueFecha];

/** O que a Lia faz em cada instante: [desde, estado, frase sob o nome, área do selo]. */
const ETAPAS = [
  [0, 'oi', 'Peça do seu jeito'],
  [T.lendo1, 'lendo', 'Lendo…'],
  [T.olha1, 'consultando', 'Olhando a agenda de sexta', 'agenda'],
  [T.monta1, 'montando', 'Montando o cartão'],
  [T.cartao1, 'escrevendo', 'Peça do seu jeito'],
  [T.cartao1 + 0.6, 'repouso', 'Peça do seu jeito'],
  [T.executa1, 'executando', 'Bloqueando a tarde'],
  [T.feito1, 'feito', 'Feito'],
  [T.feito1 + 1.7, 'repouso', 'Peça do seu jeito'],
  [T.abre2[0], 'oi', 'Peça do seu jeito'],
  [T.abre2[1] + 0.3, 'repouso', 'Peça do seu jeito'],
  [T.lendo2, 'lendo', 'Lendo…'],
  [T.olha2, 'consultando', 'Olhando a agenda de hoje', 'agenda'],
  [T.monta2, 'montando', 'Montando o cartão'],
  [T.cartao2, 'escrevendo', 'Peça do seu jeito'],
  [T.cartao2 + 0.6, 'repouso', 'Peça do seu jeito'],
  [T.executa2, 'executando', 'Fazendo 1 de 3'],
  [T.itens[0] + 0.05, 'executando', 'Fazendo 2 de 3'],
  [T.itens[1] + 0.05, 'executando', 'Fazendo 3 de 3'],
  [T.feito2, 'feito', 'Feitas as 3'],
  [T.feito2 + 1.7, 'repouso', 'Peça do seu jeito'],
  [T.lendo3, 'lendo', 'Lendo…'],
  [T.olha3, 'consultando', 'Vendo o financeiro', 'dinheiro'],
  [T.soma3, 'calculando', 'Somando…'],
  [T.resposta3, 'escrevendo', 'Peça do seu jeito'],
  [T.resposta3 + 1.2, 'repouso', 'Peça do seu jeito'],
];

// As cores da magia: o verde-água da Lia, o mel da faísca e o vinho do ELO.
const MAGIA = ['#7fc6bc', '#e2ce80', '#b0ded7', '#d48995'];

const lim = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
const trecho = (t, [a, b]) => lim((t - a) / (b - a));
const suave = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const sai = (u) => 1 - (1 - u) ** 3;
const entre = (a, b, u) => a + (b - a) * u;
const pulso = (t, [a, b], borda = 0.08) => Math.min(lim((t - a) / borda), lim((b - t) / borda));
const hora = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
const letras = (texto) =>
  [...texto].map((c, k) => `<i style="--k:${k}">${c === ' ' ? '&nbsp;' : c}</i>`).join('');
const formato = {
  n: (v) => Math.round(v).toLocaleString('pt-BR'),
  r: (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`,
  '%': (v) => `${Math.round(v)}%`,
};

const ICONE = {
  visto: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  cadeado: '<svg viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  desfazer: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  enviar: '<svg viewBox="0 0 24 24"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
  baixo: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  fechar: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
};

export function cenaElo(tela) {
  tela.classList.add('cena-elo');
  tela.innerHTML = `
    <div class="elo" aria-hidden="true">
      <div class="elo-topo">
        <span class="elo-marca">ELO</span>
        <span class="elo-titulo">Hoje</span>
        <span class="elo-semana">Sex, 27 de nov</span>
      </div>
      <div class="elo-dia">
        <div class="elo-horas">${Array.from({ length: HORAS }, (_, k) => `<span>${HORA_INICIAL + k}h</span>`).join('')}</div>
        <div class="elo-trilha">
          ${DIA.map(
            ([ini, , servico, cliente]) =>
              `<div class="elo-ag"><b>${hora(ini)} ${servico}</b><span>${cliente}</span><em>${ICONE.visto}</em></div>`,
          ).join('')}
          <div class="elo-livre"><span>Livre</span></div>
          <div class="elo-bloqueio"><b>${ICONE.cadeado} Bloqueado</b><span>${hora(BLOQUEIO[0])} às ${hora(BLOQUEIO[0] + BLOQUEIO[1])}</span></div>
        </div>
      </div>
      <div class="elo-fab">${liaSvg('elo-fab-lia')}<span class="elo-ponto"></span></div>
      <div class="elo-chat">
        <div class="elo-aurora"><i></i><i></i></div>
        <div class="elo-chat-topo">
          ${liaSvg('elo-topo-lia')}
          <div class="elo-quem"><b>Lia</b><span class="elo-status">Peça do seu jeito</span></div>
          <span class="elo-acao elo-min">${ICONE.baixo}</span>
          <span class="elo-acao elo-x">${ICONE.fechar}</span>
        </div>
        <div class="elo-msgs">
          <div class="elo-msg elo-eu">${PEDIDOS[0]}</div>
          <div class="elo-msg elo-ela"><p>${letras('Olha como fica:')}</p></div>
          <div class="elo-msg elo-cartao elo-c1">
            <p class="elo-c-titulo">Bloquear agenda<span class="elo-selo">${ICONE.visto} Bloqueado</span></p>
            <dl>
              <div><dt>Dia</dt><dd>Sexta, 27 de novembro</dd></div>
              <div><dt>Horário</dt><dd>${hora(BLOQUEIO[0])} às ${hora(BLOQUEIO[0] + BLOQUEIO[1])}</dd></div>
              <div><dt>Agendamentos</dt><dd>Nenhum nesse horário</dd></div>
            </dl>
            <div class="elo-botoes"><span class="elo-sim">Confirmar bloqueio</span><span class="elo-nao">Cancelar</span></div>
          </div>
          <div class="elo-msg elo-ela"><p>${letras('Pronto, Bia. Sexta à tarde é sua.')}</p><span class="elo-desfazer">${ICONE.desfazer} Desfazer</span></div>
          <div class="elo-msg elo-eu">${PEDIDOS[1]}</div>
          <div class="elo-msg elo-cartao elo-c2">
            <p class="elo-c-titulo">Marcar como realizado (3)<span class="elo-selo">${ICONE.visto} Feitas as 3</span></p>
            <ul>${DIA.map(([ini, , servico, cliente]) => `<li><i>${ICONE.visto}</i>${cliente} · ${servico} · ${hora(ini)}</li>`).join('')}</ul>
            <div class="elo-botoes"><span class="elo-sim">Confirmar as 3</span><span class="elo-nao">Cancelar</span></div>
            <p class="elo-fazendo">Fazendo 1 de 3</p>
          </div>
          <div class="elo-msg elo-ela"><p>${letras('Pronto. Os 3 de hoje estão como realizados.')}</p><span class="elo-desfazer">${ICONE.desfazer} Desfazer</span></div>
          <div class="elo-msg elo-eu">${PEDIDOS[2]}</div>
          <div class="elo-msg elo-ela elo-numeros">
            <p>${letras('Em outubro, você teve:')}</p>
            <ul>${NUMEROS.map(([rotulo]) => `<li><b>0</b> ${rotulo}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="elo-campo-lia">
          <span class="elo-escrito"></span>
          <span class="elo-dica">Peça ou pergunte do seu jeito</span>
          <span class="elo-enviar">${ICONE.enviar}</span>
        </div>
      </div>
      <canvas class="elo-magia"></canvas>
      <div class="elo-dedo"><i></i></div>
      <div class="elo-fim"></div>
    </div>`;

  const raiz = tela.firstElementChild;
  const $ = (s) => raiz.querySelector(s);
  const $$ = (s) => [...raiz.querySelectorAll(s)];
  const el = {
    trilha: $('.elo-trilha'),
    ags: $$('.elo-ag'),
    livre: $('.elo-livre'),
    bloqueio: $('.elo-bloqueio'),
    fab: $('.elo-fab'),
    ponto: $('.elo-ponto'),
    chat: $('.elo-chat'),
    status: $('.elo-status'),
    min: $('.elo-min'),
    x: $('.elo-x'),
    msgs: $$('.elo-msg'),
    c1: $('.elo-c1'),
    c2: $('.elo-c2'),
    sim1: $('.elo-c1 .elo-sim'),
    sim2: $('.elo-c2 .elo-sim'),
    itens: $$('.elo-c2 li'),
    fazendo: $('.elo-fazendo'),
    numeros: $$('.elo-numeros b'),
    campo: $('.elo-campo-lia'),
    escrito: $('.elo-escrito'),
    dica: $('.elo-dica'),
    enviar: $('.elo-enviar'),
    canvas: $('.elo-magia'),
    dedo: $('.elo-dedo'),
    fim: $('.elo-fim'),
  };
  const ctx = el.canvas.getContext('2d');
  const liaTopo = $('.elo-topo-lia');
  const liaFab = $('.elo-fab-lia');
  const personagens = [animarLia(liaTopo), animarLia(liaFab)];

  // Quando cada mensagem aparece, na ordem do HTML.
  const QUANDO = [T.envia1, T.cartao1, T.cartao1, T.resposta1, T.envia2, T.cartao2, T.resposta2, T.envia3, T.resposta3];
  const mensagens = el.msgs.map((e, k) => ({ e, t: QUANDO[k] }));

  let m = null; // as medidas da tela
  let tempo = 0;
  let parado = false;
  let olhar = null; // para onde a Lia olha quando o ponteiro está na cena
  const guardado = {}; // o último lugar conhecido de cada alvo do dedo

  function medir() {
    const w = raiz.clientWidth;
    const h = raiz.clientHeight;
    if (!w || !h) return;
    raiz.style.fontSize = `${Math.max(10.5, Math.min(15, w / 36)).toFixed(2)}px`;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const lin = el.trilha.clientHeight / HORAS;
    el.trilha.style.setProperty('--lin', `${lin}px`);
    const bloco = (e, ini, dur) =>
      Object.assign(e.style, { top: `${(ini - HORA_INICIAL) * lin + 2}px`, height: `${dur * lin - 4}px` });
    DIA.forEach(([ini, dur], k) => bloco(el.ags[k], ini, dur));
    bloco(el.livre, ...BLOQUEIO);
    bloco(el.bloqueio, ...BLOQUEIO);

    // A conversa começa logo abaixo da manhã: o lote acontece à vista, por cima dela.
    const base = raiz.getBoundingClientRect();
    const manha = el.ags[2].getBoundingClientRect();
    const topo = Math.min(h * 0.5, Math.max(h * 0.36, manha.bottom - base.top + 8));
    el.chat.style.top = `${topo}px`;

    m = { w, h, base, desce: h - topo + 30 };
    pintar(tempo);
  }

  const centroDe = (nome, e) => {
    const r = e.getBoundingClientRect();
    if (r.width) {
      const b = raiz.getBoundingClientRect();
      guardado[nome] = [r.left - b.left + r.width / 2, r.top - b.top + r.height / 2];
    }
    return guardado[nome] || [m.w * 0.5, m.h * 0.5];
  };
  const caixaDe = (e) => {
    const r = e.getBoundingClientRect();
    const b = raiz.getBoundingClientRect();
    return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
  };

  /** O caminho do dedo: uma lista de [tempo, ponto], com deslizes suaves entre eles. */
  function dedo(t) {
    const R = () => [m.w * 0.84, m.h * 0.2];
    const FAB = () => centroDe('fab', el.fab);
    const C1 = () => centroDe('sim1', el.sim1);
    const C2 = () => centroDe('sim2', el.sim2);
    const MIN = () => centroDe('min', el.min);
    const X = () => centroDe('x', el.x);
    const pontos = [
      [0, R], [0.2, R], [0.85, FAB], [1.3, FAB], [2.0, R],
      [6.5, R], [7.1, C1], [7.7, C1], [8.4, R], [8.9, R], [9.4, MIN], [9.55, MIN], [10.3, R],
      [11.2, R], [11.75, FAB], [12.1, FAB], [12.8, R],
      [16.2, R], [16.8, C2], [17.3, C2], [18.0, R],
      [24.0, R], [24.5, X], [24.65, X], [25.4, R], [DURA, R],
    ];
    for (let k = 1; k < pontos.length; k++) {
      const [tb, b] = pontos[k];
      if (t > tb) continue;
      const [ta, a] = pontos[k - 1];
      const u = suave(lim((t - ta) / Math.max(0.001, tb - ta)));
      const pa = a();
      const pb = b();
      return [entre(pa[0], pb[0], u), entre(pa[1], pb[1], u), a === R && b === R];
    }
    return [...R(), true];
  }

  function toque(t) {
    for (const q of TOQUES) {
      const u = (t - q + 0.06) / 0.5;
      if (u >= 0 && u <= 1) return u;
    }
    return -1;
  }

  function etapa(t) {
    let atual = ETAPAS[0];
    for (const e of ETAPAS) if (t >= e[0]) atual = e;
    return atual;
  }

  function aberta(t) {
    if (t < T.fecha1[0]) return suave(trecho(t, T.abre1));
    if (t < T.abre2[0]) return 1 - suave(trecho(t, T.fecha1));
    if (t < T.fecha3[0]) return suave(trecho(t, T.abre2));
    return 1 - suave(trecho(t, T.fecha3));
  }

  function escrever(t) {
    const fases = [
      [T.digita1, PEDIDOS[0], T.envia1],
      [T.digita2, PEDIDOS[1], T.envia2],
      [T.digita3, PEDIDOS[2], T.envia3],
    ];
    for (const [faixa, texto, envio] of fases) {
      if (t >= faixa[0] && t < envio) return [texto.slice(0, Math.round(texto.length * trecho(t, faixa))), true];
    }
    return ['', false];
  }

  // ---- A magia: partículas que seguem a ordem da Lia ---------------------------------
  function trilha(t, [t0, t1], de, para, curva = 0.25) {
    if (t < t0 || t > t1) return;
    const dur = t1 - t0;
    const cabeca = sai(lim((t - t0) / (dur * 0.7)));
    const apaga = 1 - lim((t - t0 - dur * 0.65) / (dur * 0.35));
    const dx = para[0] - de[0];
    const dy = para[1] - de[1];
    const c1 = [de[0] + dx * 0.25 - dy * curva, de[1] + dy * 0.25 + dx * curva];
    const c2 = [de[0] + dx * 0.75 - dy * curva * 0.6, de[1] + dy * 0.75 + dx * curva * 0.6];
    const N = 26;
    for (let i = 0; i < N; i++) {
      const s = lim(cabeca - i * 0.018);
      if (s <= 0) continue;
      const u = 1 - s;
      const x = u ** 3 * de[0] + 3 * u * u * s * c1[0] + 3 * u * s * s * c2[0] + s ** 3 * para[0];
      const y = u ** 3 * de[1] + 3 * u * u * s * c1[1] + 3 * u * s * s * c2[1] + s ** 3 * para[1];
      const onda = Math.sin(s * 14 + i * 1.7) * 3 * (1 - s);
      ponto(x + onda, y - onda, (2.4 - i * 0.06) * (0.6 + 0.4 * (1 - s)), MAGIA[i % 3], apaga * (1 - i / N));
    }
  }

  function explosao(t, t0, [cx, cy]) {
    const u = lim((t - t0) / 1.1);
    if (u <= 0 || u >= 1) return;
    const N = 18;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2 + Math.sin(i * 7.3) * 0.3;
      const v = 26 + ((i * 37) % 11) * 2.4;
      const d = sai(u) * v;
      ponto(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d + u * u * 14, 2.2 * (1 - u * 0.6), MAGIA[i % 4], 1 - u);
    }
  }

  function contorno(t, t0, alvo) {
    const u = lim((t - t0) / 1.0);
    if (u <= 0 || u >= 1 || !alvo.offsetParent) return;
    const r = caixaDe(alvo);
    const per = 2 * (r.w + r.h);
    const naBorda = (s) => {
      let d = (((s % 1) + 1) % 1) * per;
      if (d < r.w) return [r.x + d, r.y];
      d -= r.w;
      if (d < r.h) return [r.x + r.w, r.y + d];
      d -= r.h;
      if (d < r.w) return [r.x + r.w - d, r.y + r.h];
      return [r.x, r.y + r.h - (d - r.w)];
    };
    const cabeca = suave(u) * 1.02;
    const apaga = 1 - lim((u - 0.8) / 0.2);
    for (let i = 0; i < 18; i++) {
      const s = cabeca - i * 0.008;
      if (s < 0) continue;
      const [x, y] = naBorda(s);
      ponto(x, y, 2.3 - i * 0.1, MAGIA[i % 2], apaga * (1 - i / 18));
    }
  }

  function ponto(x, y, r, cor, a) {
    if (a <= 0 || r <= 0) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = cor;
    ctx.shadowColor = cor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function magia(t) {
    ctx.clearRect(0, 0, m.w, m.h);
    if (parado) return;
    ctx.globalCompositeOperation = 'lighter';
    contorno(t, T.cartao1, el.c1);
    contorno(t, T.cartao2, el.c2);
    if (t > T.feito1 - 0.1 && t < T.feito1 + 1.2) explosao(t, T.feito1, centroDe('lia', liaTopo));
    if (t > T.feito2 - 0.1 && t < T.feito2 + 1.2) explosao(t, T.feito2, centroDe('lia', liaTopo));
    if (t > T.trilhaBloqueio[0] && t < T.trilhaBloqueio[1]) {
      const b = caixaDe(el.bloqueio);
      trilha(t, T.trilhaBloqueio, centroDe('fab', el.fab), [b.x + b.w * 0.5, b.y + 4], 0.35);
    }
    T.itens.forEach((ti, k) => {
      if (t < ti - 0.05 || t > ti + 0.75) return;
      const ag = caixaDe(el.ags[k]);
      trilha(t, [ti - 0.05, ti + 0.75], centroDe(`item${k}`, el.itens[k]), [ag.x + ag.w - 12, ag.y + ag.h * 0.5], -0.2);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---- O quadro ------------------------------------------------------------------------
  function pintar(t) {
    if (!m) return;

    // As mensagens aparecem na hora delas; a conversa empurra as antigas para cima.
    for (const { e, t: desde } of mensagens) {
      const viva = t >= desde;
      if (e.classList.contains('vivo') !== viva) e.classList.toggle('vivo', viva);
    }

    // A Lia: etapa, frase sob o nome e área do selo.
    const [, estado, frase, dominio] = etapa(t);
    personagens[0].estado(estado, dominio, parado);
    if (el.status.textContent !== frase) {
      el.status.textContent = frase;
      if (!parado) el.status.animate?.([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
    const fabFeliz = t >= T.trilhaBloqueio[0] && t < T.trilhaBloqueio[0] + 1.6;
    personagens[1].estado(fabFeliz ? 'feito' : 'repouso', undefined, parado);
    for (const p of personagens) p.olhar(olhar);

    // A janela da Lia sobe do canto e desce quando minimiza.
    const a = aberta(t);
    el.chat.style.transform = `translateY(${((1 - a) * m.desce).toFixed(1)}px)`;
    el.chat.style.visibility = a > 0.001 ? 'visible' : 'hidden';
    el.fab.style.opacity = (1 - lim(a * 1.6)).toFixed(3);
    el.fab.style.transform = `scale(${(1 - 0.06 * pulso(t, [T.toqueFab1 - 0.05, T.toqueFab1 + 0.12])) * (1 - 0.06 * pulso(t, [T.toqueFab2 - 0.05, T.toqueFab2 + 0.12]))})`;
    el.ponto.classList.toggle('vivo', t > T.fecha1[1] && t < T.abre2[0]);

    // O campo: o pedido se escreve, e o botão de enviar afunda.
    const [texto, focado] = escrever(t);
    if (el.escrito.textContent !== texto) el.escrito.textContent = texto;
    el.campo.classList.toggle('em-foco', focado);
    el.dica.style.opacity = texto ? 0 : 1;
    const envio = Math.max(...[T.envia1, T.envia2, T.envia3].map((q) => pulso(t, [q - 0.08, q + 0.1], 0.06)));
    el.enviar.classList.toggle('pronto', focado && texto.length > 0);
    el.enviar.style.transform = `scale(${1 - 0.12 * envio})`;

    // O cartão do bloqueio.
    el.c1.classList.toggle('feito', t >= T.feito1);
    el.sim1.style.transform = `scale(${1 - 0.05 * pulso(t, [T.toqueConf1 - 0.06, T.toqueConf1 + 0.12])})`;
    el.sim1.classList.toggle('fazendo', t >= T.executa1);

    // O cartão do lote: cada linha ganha o visto, e o bloco da agenda acende junto.
    el.c2.classList.toggle('fazendo', t >= T.executa2 && t < T.feito2);
    el.c2.classList.toggle('feito', t >= T.feito2);
    el.sim2.style.transform = `scale(${1 - 0.05 * pulso(t, [T.toqueConf2 - 0.06, T.toqueConf2 + 0.12])})`;
    el.fazendo.textContent = `Fazendo ${Math.min(3, T.itens.filter((ti) => t >= ti).length + 1)} de 3`;
    T.itens.forEach((ti, k) => {
      el.itens[k].classList.toggle('ok', t >= ti);
      el.ags[k].classList.toggle('realizado', t >= ti + 0.55);
    });

    // O bloqueio cai na agenda: a tarde livre vira listras.
    const b = suave(trecho(t, T.bloqueio));
    el.bloqueio.style.clipPath = `inset(0 0 ${((1 - b) * 100).toFixed(1)}% 0 round 8px)`;
    el.bloqueio.style.opacity = b > 0 ? 1 : 0;
    el.livre.style.opacity = (1 - b).toFixed(3);

    // Os números contam até o valor.
    NUMEROS.forEach(([, valor, f], k) => {
      const u = sai(trecho(t, [T.conta[0] + k * 0.12, T.conta[1] + k * 0.12]));
      const s = formato[f](valor * u);
      if (el.numeros[k].textContent !== s) el.numeros[k].textContent = s;
    });

    // O véu que fecha e abre a volta.
    const fim = Math.max(1 - trecho(t, T.veuAbre), trecho(t, T.veuFecha));
    el.fim.style.opacity = parado ? 0 : fim.toFixed(3);

    // O dedo e o anel do toque.
    el.dedo.style.visibility = parado ? 'hidden' : 'visible';
    if (!parado) {
      const [x, y, descansa] = dedo(t);
      const q = toque(t);
      el.dedo.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${q >= 0 ? 1 - 0.18 * Math.sin(Math.PI * Math.min(1, q * 2.5)) : 1})`;
      el.dedo.style.setProperty('--anel', q >= 0 ? q.toFixed(3) : '0');
      el.dedo.style.setProperty('--anel-op', q >= 0 ? (1 - q).toFixed(3) : '0');
      el.dedo.style.opacity = descansa ? '0.4' : '0.95';
    }

    magia(t);
  }

  return {
    medir,
    quadro(dt) {
      if (!m || raiz.clientWidth !== m.w || raiz.clientHeight !== m.h) medir();
      parado = false;
      tempo = (tempo + dt) % DURA;
      for (const p of personagens) p.quadro(dt);
      pintar(tempo);
    },
    ponteiro(x, y, dentro) {
      olhar = dentro ? [x, y] : null;
    },
    parado() {
      // O quadro parado: a Lia acabou de somar outubro, com o dia já fechado.
      parado = true;
      tempo = T.conta[1] + 0.6;
      if (!m) medir();
      else pintar(tempo);
    },
  };
}

