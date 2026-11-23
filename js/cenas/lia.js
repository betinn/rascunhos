// A Lia, a assistente do ELO, em SVG: o núcleo de luz verde-água com rosto, a faísca de mel que
// orbita, o anel e, por etapa, a peça que conta o que ela está fazendo (a bolha do "lendo", o
// selo da área do "consultando", o cartão que se monta, os dígitos que rolam, as barras do
// "executando" e o confete do "feito"). Trocar de etapa é trocar `data-estado`; o CSS anima.
// Só a boca tem script: ela passa de uma forma para outra com uma mola leve.

// A boca: quatro pontos (canto esquerdo, controle de cima, canto direito, controle de baixo).
const BOCAS = {
  sorriso: [28, 38.8, 32, 40.4, 36, 38.8, 32, 42.8],
  'sorriso-peq': [29, 39.4, 32, 40.6, 35, 39.4, 32, 41.6],
  aberto: [26.6, 37.8, 32, 38.8, 37.4, 37.8, 32, 45.6],
  ah: [30, 39.8, 32, 36.6, 34, 39.8, 32, 43.2],
  firme: [29, 39.8, 32, 39.5, 35, 39.8, 32, 40.4],
  bico: [30.8, 39.8, 32.1, 38.4, 33.6, 39.6, 32.2, 41.2],
  fala: [28.6, 38.6, 32, 39.2, 35.4, 38.6, 32, 43.4],
};

// A boca em cada etapa: a forma de entrada e, nas que mudam, [espera em s, forma].
const SEQUENCIA = {
  repouso: ['sorriso'],
  oi: ['aberto', 0.9, 'sorriso'],
  lendo: ['sorriso-peq'],
  consultando: ['sorriso-peq'],
  montando: ['sorriso-peq'],
  calculando: ['bico'],
  escrevendo: ['fala'],
  executando: ['firme'],
  feito: ['ah', 0.2, 'aberto'],
};
const DURACAO_DA_BOCA = 0.26;

const caminho = (p) => {
  const n = (v) => Math.round(v * 100) / 100;
  return `M${n(p[0])} ${n(p[1])}Q${n(p[2])} ${n(p[3])} ${n(p[4])} ${n(p[5])}Q${n(p[6])} ${n(p[7])} ${n(p[0])} ${n(p[1])}Z`;
};
/** A mola: passa um pouco do alvo e volta. */
const mola = (k) => 1 + 2.25 * (k - 1) ** 3 + 1.25 * (k - 1) ** 2;

// Os ícones das áreas, os mesmos do menu do ELO (lucide, só traço).
const AREAS = {
  agenda:
    '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  dinheiro: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
};

const ESTRELA = 'M32 30.6l.9 1.5 1.5.9-1.5.9-.9 1.5-.9-1.5-1.5-.9 1.5-.9z';
const CONFETE = [
  [-22, -14, 'es'], [20, -18, 'bo'], [25, 4, 'es'], [-24, 8, 'ro'],
  [-10, -25, 'bo'], [12, -26, 'ro'], [-16, 20, 'es'], [18, 19, 'bo'],
];
const DIGITOS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
let contador = 0;

/** O SVG da Lia, decorativo. `classe` vai no invólucro. */
export function liaSvg(classe = '') {
  const id = `lia-r${++contador}`;
  const colunas = [46, 52, 58]
    .map((x, k) => `<g class="lia-col${k + 1}">${DIGITOS.map((d, i) => `<text class="lia-digito" x="${x}" y="${53.6 + i * 9}">${d}</text>`).join('')}</g>`)
    .join('');
  const confete = CONFETE.map(([dx, dy, cor], i) =>
    i % 2
      ? `<circle class="lia-${cor}" cx="32" cy="33" r="1.5" style="--dx:${dx}px;--dy:${dy}px"/>`
      : `<path class="lia-${cor}" d="${ESTRELA}" style="--dx:${dx}px;--dy:${dy}px"/>`,
  ).join('');
  const areas = Object.entries(AREAS)
    .map(([nome, d]) => `<svg class="lia-ico lia-ico-${nome}" x="46.4" y="44.4" width="13.2" height="13.2" viewBox="0 0 24 24">${d}</svg>`)
    .join('');
  return `
    <span class="lia ${classe}" data-lia data-estado="repouso" data-dominio="agenda" style="--lia-atraso:-${(contador * 2.3) % 5}s">
      <svg class="lia-svg" viewBox="0 0 64 64">
        <defs>
          <radialGradient id="${id}n" cx="36%" cy="28%" r="80%">
            <stop offset="0" stop-color="#b0ded7"/><stop offset=".5" stop-color="#7fc6bc"/><stop offset="1" stop-color="#2f8c84"/>
          </radialGradient>
          <radialGradient id="${id}h">
            <stop offset=".45" stop-color="#7fc6bc" stop-opacity=".5"/><stop offset="1" stop-color="#7fc6bc" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#7fc6bc" stop-opacity=".65"/><stop offset="1" stop-color="#7fc6bc" stop-opacity=".05"/>
          </linearGradient>
          <clipPath id="${id}c"><rect x="41.5" y="45.6" width="20" height="10.6" rx="1.4"/></clipPath>
          <clipPath id="${id}b"><circle cx="32" cy="33" r="17"/></clipPath>
        </defs>
        <circle class="lia-halo" cx="32" cy="33" r="31" fill="url(#${id}h)"/>
        <circle class="lia-anel" cx="32" cy="33" r="24" pathLength="100"/>
        <g class="lia-corpo">
          <circle cx="32" cy="33" r="17" fill="url(#${id}n)"/>
          <ellipse class="lia-brilho" cx="25.4" cy="23.6" rx="5.4" ry="2.8" transform="rotate(-30 25.4 23.6)"/>
          <ellipse class="lia-bochecha" cx="21.4" cy="37.6" rx="2.7" ry="1.6"/>
          <ellipse class="lia-bochecha" cx="42.6" cy="37.6" rx="2.7" ry="1.6"/>
          <g class="lia-olhos">
            <g class="lia-olho lia-e"><rect class="lia-pupila" x="24" y="27.4" width="4.3" height="7" rx="2.15"/><circle class="lia-reflexo" cx="27.1" cy="29.2" r="1"/></g>
            <g class="lia-olho lia-d"><rect class="lia-pupila" x="35.7" y="27.4" width="4.3" height="7" rx="2.15"/><circle class="lia-reflexo" cx="38.8" cy="29.2" r="1"/></g>
            <path class="lia-fechado lia-feliz" d="M23.7 32q2.45-3.4 4.9 0M35.4 32q2.45-3.4 4.9 0"/>
            <path class="lia-fechado lia-piscadela" d="M35.4 32q2.45-3.4 4.9 0"/>
          </g>
          <path class="lia-sobrancelha lia-e" d="M23.2 24.4q3-1.7 6 0"/>
          <path class="lia-sobrancelha lia-d" d="M34.8 24.4q3-1.7 6 0"/>
          <g clip-path="url(#${id}b)">
            <path class="lia-boca" d="${caminho(BOCAS.sorriso)}"/>
            <ellipse class="lia-lingua" cx="32" cy="43.4" rx="2.4" ry="1.3"/>
          </g>
        </g>
        <path class="lia-p lia-feixe" d="M37 32.5 L45.6 51.4 L50.4 44.4 Z" fill="url(#${id}f)"/>
        <g class="lia-p lia-bolha">
          <path class="lia-corpo-b" d="M5 2h13.4a3.4 3.4 0 0 1 3.4 3.4v5.4a3.4 3.4 0 0 1-3.4 3.4h-2.2l1.6 4.2-5.2-4.2H5a3.4 3.4 0 0 1-3.4-3.4V5.4A3.4 3.4 0 0 1 5 2z"/>
          <rect class="lia-realce" x="4.2" y="5.4" width="5.6" height="2.6" rx="1.3"/>
          <path class="lia-linhas" d="M5 6.7h11.4M5 9.9h7.6"/>
        </g>
        <g class="lia-p lia-selo">
          <circle class="lia-onda" cx="53" cy="51" r="9"/>
          <circle class="lia-cartao" cx="53" cy="51" r="9"/>
          ${areas}
        </g>
        <g class="lia-p lia-digitos">
          <rect class="lia-cartao" x="40.6" y="44.6" width="22" height="12.6" rx="2.6"/>
          <g clip-path="url(#${id}c)">${colunas}</g>
        </g>
        <g class="lia-p lia-monta">
          <rect class="lia-m-borda" x="43" y="37" width="19.4" height="21.4" rx="2.4" pathLength="100"/>
          <rect class="lia-m-l lia-m-l1" x="45.6" y="40.6" width="14" height="2.2" rx="1.1"/>
          <rect class="lia-m-l lia-m-l2" x="45.6" y="44.8" width="10.4" height="2.2" rx="1.1"/>
          <rect class="lia-m-l lia-m-l3" x="45.6" y="49" width="12.4" height="2.2" rx="1.1"/>
          <rect class="lia-m-b" x="45.6" y="53.4" width="7.4" height="2.8" rx="1.2"/>
        </g>
        <g class="lia-p lia-barras">
          <rect class="lia-cartao" x="42" y="40" width="20" height="18.6" rx="2.6"/>
          <rect class="lia-trilho" x="45" y="44" width="14" height="2.4" rx="1.2"/>
          <rect class="lia-trilho" x="45" y="48.6" width="14" height="2.4" rx="1.2"/>
          <rect class="lia-trilho" x="45" y="53.2" width="14" height="2.4" rx="1.2"/>
          <rect class="lia-enche lia-e1" x="45" y="44" width="14" height="2.4" rx="1.2"/>
          <rect class="lia-enche lia-e2" x="45" y="48.6" width="14" height="2.4" rx="1.2"/>
          <rect class="lia-enche lia-e3" x="45" y="53.2" width="14" height="2.4" rx="1.2"/>
        </g>
        <g class="lia-p lia-estrelas">
          <path d="M45 39.4l.8 1.4 1.4.8-1.4.8-.8 1.4-.8-1.4-1.4-.8 1.4-.8z" style="--dx:15px;--dy:-12px"/>
          <path d="M45 39.4l.8 1.4 1.4.8-1.4.8-.8 1.4-.8-1.4-1.4-.8 1.4-.8z" style="--dx:18px;--dy:1px"/>
          <path d="M45 39.4l.8 1.4 1.4.8-1.4.8-.8 1.4-.8-1.4-1.4-.8 1.4-.8z" style="--dx:13px;--dy:12px"/>
        </g>
        <g class="lia-p lia-confete">${confete}</g>
        <g class="lia-orbita"><path class="lia-faisca" d="M32 .6l1.35 3 3 1.35-3 1.35L32 9.3l-1.35-3-3-1.35 3-1.35z"/></g>
      </svg>
    </span>`;
}

/**
 * Liga a Lia já no DOM. `estado(e, area, parado)` troca a etapa (e a boca, com a mola);
 * `olhar([x, y])` faz os olhos seguirem o ponteiro no repouso; `quadro(dt)` anda a boca.
 */
export function animarLia(raiz) {
  const boca = raiz.querySelector('.lia-boca');
  const olhos = raiz.querySelector('.lia-olhos');
  let atual = 'repouso';
  let desde = 0; // segundos desde a troca de etapa
  let pontos = BOCAS.sorriso;
  let de = pontos;
  let forma = 'sorriso';
  let mudou = 0;
  let semMola = false;

  function formaAgora() {
    const seq = SEQUENCIA[atual] || SEQUENCIA.repouso;
    let f = seq[0];
    let acumulado = 0;
    for (let i = 1; i + 1 < seq.length; i += 2) {
      acumulado += seq[i];
      if (desde >= acumulado || semMola) f = seq[i + 1];
    }
    return f;
  }

  function pintarBoca() {
    const alvo = formaAgora();
    if (alvo !== forma) {
      de = pontos;
      forma = alvo;
      mudou = 0;
    }
    const k = semMola ? 1 : Math.min(1, mudou / DURACAO_DA_BOCA);
    const e = mola(k);
    pontos = de.map((v, i) => v + (BOCAS[forma][i] - v) * e);
    boca.setAttribute('d', caminho(pontos));
  }

  return {
    estado(e, area = 'agenda', parado = false) {
      semMola = parado;
      if (raiz.dataset.dominio !== area) raiz.dataset.dominio = area;
      if (e !== atual) {
        atual = e;
        desde = 0;
        raiz.dataset.estado = e;
      }
      pintarBoca();
    },
    olhar(p) {
      if (!p || atual !== 'repouso') {
        if (olhos.style.transform) {
          olhos.style.transform = '';
          raiz.classList.remove('olha');
        }
        return;
      }
      const r = raiz.getBoundingClientRect();
      const b = raiz.closest('.elo').getBoundingClientRect();
      const dx = p[0] - (r.left - b.left + r.width / 2);
      const dy = p[1] - (r.top - b.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const forca = Math.min(1, d / 120) * 2.2;
      raiz.classList.add('olha');
      olhos.style.transform = `translate(${((dx / d) * forca).toFixed(2)}px, ${((dy / d) * forca).toFixed(2)}px)`;
    },
    quadro(dt) {
      desde += dt;
      mudou += dt;
    },
  };
}
