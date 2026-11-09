// Os desenhos da tinta. Cada cena diz onde cada partícula quer pousar.
//
// O layout manda: cada parada tem um elemento .cena-alvo no HTML, posicionado pelo CSS, e
// o desenho se ajusta à caixa dele. Assim a mesma cena serve para computador e celular.
// O motor em tinta.js cuida do resto: física, luz e transição.
// Coordenadas em pixels CSS da tela, com y para baixo.

const GIZ = [0.96, 0.95, 0.87];
const FLUO = [0.84, 1.0, 0.24];

// Tipos de partícula, lidos pelos shaders em tinta.js
export const TIPO = { FIXA: 0, PULSO: 1, BRASA: 2, BRUMA: 3, CORTINA: 4, LINHA_CORTINA: 5, IRIS: 6, PALPEBRA: 7, BRILHO: 8, ESCLERA: 9 };

/** Spline de Catmull-Rom. */
export function suavizar(pts, passos = 14) {
  const n = pts.length;
  const out = [];
  const p = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    for (let s = 0; s < passos; s++) {
      const t = s / passos;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push([...pts[n - 1]]);
  return out;
}

function comprimento(linha) {
  const c = [0];
  for (let i = 1; i < linha.length; i++) {
    c.push(c[i - 1] + Math.hypot(linha[i][0] - linha[i - 1][0], linha[i][1] - linha[i - 1][1]));
  }
  return c;
}

function gauss() {
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

/** Junta traços e, no fim, reparte N partículas entre eles conforme o peso. */
export class Desenho {
  constructor(meta = {}) {
    this.tracos = [];
    this.nuvens = [];
    this.fasePadrao = [0, 1];
    this.meta = { quente: FLUO, papel: [0.039, 0.043, 0.035], grade: 1, halo: 1, tremido: 0.8, cortina: null, olho: null, ...meta };
  }

  /**
   * linha: lista de pontos. Opções: peso (partículas por px), sigma (espessura em px),
   * cor, brilho, tipo, firme (borda definida, em vez de esfumada),
   * fase0 e fase1 (trecho da escrita em que o traço nasce, de 0 a 1).
   */
  traco(linha, o = {}) {
    if (linha.length < 2) return this;
    const c = comprimento(linha);
    this.tracos.push({
      linha,
      c,
      total: c[c.length - 1],
      peso: o.peso ?? 1,
      sigma: o.sigma ?? 1,
      cor: o.cor ?? GIZ,
      brilho: o.brilho ?? 1,
      tipo: o.tipo ?? TIPO.FIXA,
      firme: o.firme ?? false,
      fase0: o.fase0 ?? this.fasePadrao[0],
      fase1: o.fase1 ?? this.fasePadrao[1],
    });
    return this;
  }

  /** Poeira solta: gera() devolve [x, y]. */
  nuvem(gera, o = {}) {
    this.nuvens.push({
      gera,
      peso: o.peso ?? 100,
      cor: o.cor ?? GIZ,
      brilho: o.brilho ?? 0.5,
      tipo: o.tipo ?? TIPO.FIXA,
      alfa: o.alfa ?? 0.2,
    });
    return this;
  }

  /** Escreve N partículas em dois vetores de N*4 elementos. */
  escrever(N, pos, cor) {
    const pesoTracos = this.tracos.map((t) => t.total * t.peso);
    const pesoTotal = pesoTracos.reduce((a, b) => a + b, 0) + this.nuvens.reduce((a, n) => a + n.peso, 0);
    const k = N / pesoTotal;
    let i = 0;
    const poe = (x, y, fase, tipo, c, alfa) => {
      if (i >= N) return;
      pos[i * 4] = x;
      pos[i * 4 + 1] = y;
      pos[i * 4 + 2] = fase;
      pos[i * 4 + 3] = tipo;
      cor[i * 4] = c[0] * 255;
      cor[i * 4 + 1] = c[1] * 255;
      cor[i * 4 + 2] = c[2] * 255;
      cor[i * 4 + 3] = Math.max(1, Math.min(255, alfa * 255));
      i++;
    };

    this.tracos.forEach((t, it) => {
      const qtd = Math.max(2, Math.round(pesoTracos[it] * k));
      const porPx = qtd / t.total;
      const dens = porPx / (t.sigma * 2.5);
      const alfa = t.brilho / (dens * 2.2);
      let seg = 1;
      for (let q = 0; q < qtd; q++) {
        const u = (q + Math.random()) / qtd;
        const alvo = u * t.total;
        while (seg < t.c.length - 1 && t.c[seg] < alvo) seg++;
        const a = t.linha[seg - 1];
        const b = t.linha[seg];
        const f = (alvo - t.c[seg - 1]) / Math.max(1e-6, t.c[seg] - t.c[seg - 1]);
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const nor = Math.hypot(dx, dy) || 1;
        const d = t.firme ? (Math.random() - 0.5) * 2.6 * t.sigma : gauss() * t.sigma;
        poe(a[0] + dx * f - (dy / nor) * d, a[1] + dy * f + (dx / nor) * d, t.fase0 + (t.fase1 - t.fase0) * u, t.tipo, t.cor, alfa);
      }
    });

    for (const n of this.nuvens) {
      const qtd = Math.round(n.peso * k);
      for (let q = 0; q < qtd; q++) {
        const [x, y] = n.gera();
        poe(x, y, this.fasePadrao[0] + Math.random() * (this.fasePadrao[1] - this.fasePadrao[0]), n.tipo, n.cor, n.alfa * n.brilho);
      }
    }

    // Sobra de arredondamento: repete partículas já escritas.
    for (let j = 0; i < N; j++) {
      const o = j * 4;
      poe(pos[o], pos[o + 1], pos[o + 2], pos[o + 3], [cor[o] / 255, cor[o + 1] / 255, cor[o + 2] / 255], cor[o + 3] / 255);
    }

    // Embaralha para que usar só as primeiras K partículas (qualidade menor) preserve o desenho.
    for (let a = N - 1; a > 0; a--) {
      const b = Math.floor(Math.random() * (a + 1));
      for (let c = 0; c < 4; c++) {
        let t = pos[a * 4 + c];
        pos[a * 4 + c] = pos[b * 4 + c];
        pos[b * 4 + c] = t;
        t = cor[a * 4 + c];
        cor[a * 4 + c] = cor[b * 4 + c];
        cor[b * 4 + c] = t;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// A palavra, em letra de mão legível: cada letra é desenhada separada.
// Linha de base em y = 100, altura de x em y = 40.
// ---------------------------------------------------------------------------
const arco = (cx, cy, rx, ry, a0, a1, n = 40) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
const reta = (x0, y0, x1, y1, n = 14) =>
  Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);

const ARCO_N = [[0, 66], [8, 49], [23, 40], [38, 46], [44, 62], [44, 100]];
const LETRAS = {
  r: { av: 40, t: [reta(0, 40, 0, 100), suavizar([[0, 66], [7, 51], [18, 43], [33, 44]], 10)] },
  a: { av: 68, t: [arco(24, 70, 24, 30, -50, 310), suavizar([[48, 40], [48, 88], [53, 98], [60, 99]], 10)] },
  s: {
    av: 52,
    t: [suavizar([[39, 50], [30, 42], [18, 40], [6, 46], [4, 58], [16, 68], [32, 74], [40, 86], [34, 97], [20, 100], [6, 97], [0, 88]], 10)],
  },
  c: { av: 56, t: [arco(26, 70, 26, 30, -42, -318)] },
  u: { av: 66, t: [suavizar([[0, 40], [0, 78], [5, 93], [19, 100], [34, 95], [44, 80]], 10), suavizar([[44, 40], [44, 88], [49, 98], [56, 99]], 10)] },
  n: { av: 60, t: [reta(0, 40, 0, 100), suavizar(ARCO_N, 10)] },
  h: { av: 60, t: [reta(0, -16, 0, 100, 24), suavizar(ARCO_N, 10)] },
  o: { av: 64, t: [arco(26, 70, 26, 30, -90, 270)] },
};

// Pequenas diferenças de altura e de posição, como na letra de verdade.
const ESCRITA = [
  ['r', 0, 1],
  ['a', 1, 1.02],
  ['s', -1, 0.98],
  ['c', 1, 1],
  ['u', 0, 1.03],
  ['n', -1, 0.98],
  ['h', 0, 1],
  ['o', 1, 1.02],
  ['s', -1, 1],
];

function montarPalavra() {
  const tracos = [];
  let x = 0;
  for (const [nome, dy, ey] of ESCRITA) {
    const l = LETRAS[nome];
    for (const t of l.t) {
      tracos.push(
        t.map(([px, py]) => {
          const yy = 100 + (py - 100) * ey + dy;
          return [x + px + (100 - yy) * 0.12, yy];
        }),
      );
    }
    x += l.av;
  }
  return tracos;
}

export const TRACOS_PALAVRA = montarPalavra();
const GRIFO = suavizar([[4, 118], [120, 114], [250, 117], [370, 113], [500, 111]], 16);

export const CAIXA_PALAVRA = (() => {
  const pts = [...TRACOS_PALAVRA.flat(), ...GRIFO];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
})();

function ajustarCaixa(caixa, rect) {
  const lw = caixa.x1 - caixa.x0;
  const lh = caixa.y1 - caixa.y0;
  const e = Math.min(rect.width / lw, rect.height / lh);
  const ox = rect.left + (rect.width - lw * e) / 2 - caixa.x0 * e;
  const oy = rect.top + (rect.height - lh * e) / 2 - caixa.y0 * e;
  return { e, map: (p) => [p[0] * e + ox, p[1] * e + oy] };
}

function desenharPalavra(d, rect) {
  const { e, map } = ajustarCaixa(CAIXA_PALAVRA, rect);
  const sigma = Math.max(1.05, e * 1.45);
  const total = TRACOS_PALAVRA.reduce((s, t) => s + comprimento(t).at(-1), 0);
  let feito = 0;
  for (const t of TRACOS_PALAVRA) {
    const l = comprimento(t).at(-1);
    d.traco(t.map(map), { peso: 22, sigma, firme: true, cor: GIZ, brilho: 1.15, fase0: (feito / total) * 0.68, fase1: ((feito + l) / total) * 0.68 });
    feito += l;
  }
  // O grifo entra por último, fino, sem disputar com o nome.
  d.traco(GRIFO.map(map), { peso: 7, sigma: Math.max(0.7, e * 0.5), cor: FLUO, brilho: 0.55, tipo: TIPO.PULSO, fase0: 0.68, fase1: 0.78 });
}

// ---------------------------------------------------------------------------
// Reino de Pedra: um pedaço do mapa de hexágonos, com castelos, rio, marcha e névoa.
// ---------------------------------------------------------------------------
const TERRENO = {
  planicie: [0.62, 0.72, 0.32],
  floresta: [0.3, 0.62, 0.34],
  colina: [0.78, 0.65, 0.4],
  montanha: [0.72, 0.7, 0.68],
  pantano: [0.42, 0.56, 0.38],
};
const BRASA = [1.0, 0.5, 0.14];
const OURO = [0.96, 0.76, 0.34];
const AGUA = [0.34, 0.7, 1.0];
const NEVOA = [0.5, 0.56, 0.68];

function ruido(x, y) {
  const s = (a, b) => {
    const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return (
    (s(xi, yi) * (1 - ux) + s(xi + 1, yi) * ux) * (1 - uy) +
    (s(xi, yi + 1) * (1 - ux) + s(xi + 1, yi + 1) * ux) * uy
  );
}

function castelo(d, cx, base, e, { cor = GIZ, brilho = 1, fogo = false, detalhe = false, peso = 11 } = {}) {
  const tr = (pts) => pts.map(([x, y]) => [cx + x * e, base + y * e]);
  const ameias = (x0, x1, y, n) => {
    const p = [];
    const l = (x1 - x0) / (n * 2 - 1);
    for (let i = 0; i < n * 2; i++) {
      const x = x0 + i * l;
      const alto = i % 2 === 0;
      p.push([x, y - (alto ? 6 : 0)], [x + l, y - (alto ? 6 : 0)]);
    }
    return p;
  };
  const sigma = Math.max(0.7, e * 0.55);
  const opts = { peso, sigma, cor, brilho };
  d.traco(tr([[-30, 0], [-30, -20], ...ameias(-30, 30, -20, 5), [30, -20], [30, 0], [-30, 0]]), opts);
  for (const tx of [-30, 30]) {
    d.traco(tr([[tx - 8, 0], [tx - 8, -34], ...ameias(tx - 8, tx + 8, -34, 2), [tx + 8, -34], [tx + 8, 0]]), opts);
  }
  d.traco(tr([[-12, -20], [-12, -50], ...ameias(-12, 12, -50, 3), [12, -50], [12, -20]]), { ...opts, brilho: brilho * 1.15 });
  d.traco(tr(suavizar([[-7, 0], [-7, -9], [0, -14], [7, -9], [7, 0]], 6)), { ...opts, cor: OURO });
  d.traco(tr([[0, -56], [0, -76]]), opts);
  d.traco(tr(suavizar([[0, -76], [9, -73], [16, -75], [22, -71], [13, -67], [7, -69], [0, -66]], 6)), { ...opts, cor: fogo ? BRASA : cor, brilho: brilho * 1.25 });

  if (detalhe) {
    const pedra = { peso: peso * 0.5, sigma: sigma * 0.6, cor, brilho: brilho * 0.4 };
    // Fiadas de pedra, um pouco tortas
    for (let y = -4; y > -19; y -= 4) {
      const lin = [];
      for (let x = -22; x <= -9; x += 2) lin.push([x, y + Math.sin(x * 0.9 + y) * 0.35]);
      d.traco(tr(lin), pedra);
      d.traco(tr(lin.map(([x, yy]) => [-x, yy])), pedra);
    }
    // Janelas acesas
    for (const [x, y] of [[-30, -24], [30, -24], [-5, -36], [5, -36], [0, -28]]) {
      d.traco(tr(suavizar([[x - 1.6, y + 3], [x - 1.6, y - 1], [x, y - 3], [x + 1.6, y - 1], [x + 1.6, y + 3]], 4)), { peso: peso * 1.4, sigma: sigma * 0.8, cor: BRASA, brilho: 1.2 });
    }
  }
  if (fogo) {
    d.nuvem(() => [cx + gauss() * 26 * e, base - 16 * e], { peso: detalhe ? 1600 : 280, cor: BRASA, brilho: 1, alfa: 0.5, tipo: TIPO.BRASA });
  }
}

function desenharMapa(d, r, { mini = false } = {}) {
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  // No cartão, o mapa cabe na caixa. Na seção, ele pode vazar um pouco e se perder na névoa.
  const raioX = r.width * (mini ? 0.48 : 0.54);
  const raioY = mini ? Math.min(r.height * 0.47, raioX * 0.98) : r.height * 0.52;
  const s = Math.max(mini ? 7.5 : 12, Math.min(27, raioX / (mini ? 5 : 8.5)));
  const K = 0.62;
  const hw = Math.sqrt(3) * s;
  const hh = s * 1.5 * K;
  const marcas = s >= 10;

  const arestas = new Map();
  const col = Math.ceil(raioX / hw) + 1;
  const lin = Math.ceil(raioY / hh) + 1;

  for (let lr = -lin; lr <= lin; lr++) {
    for (let c = -col; c <= col; c++) {
      const x = cx + (c + (lr & 1 ? 0.5 : 0)) * hw;
      const y = cy + lr * hh;
      const dist = ((x - cx) / raioX) ** 2 + ((y - cy) / raioY) ** 2;
      if (dist > 1) continue;
      const ter = ruido((x - cx) * 0.012 + c * 0.1 + 3.1, (y - cy) * 0.014 + 1.7);
      const nome = ter < 0.3 ? 'floresta' : ter < 0.56 ? 'planicie' : ter < 0.72 ? 'colina' : ter < 0.85 ? 'montanha' : 'pantano';
      const corT = TERRENO[nome];
      const luz = Math.max(0.05, 1 - Math.pow(dist, 2.2)); // a borda se perde na névoa

      const vs = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        vs.push([x + Math.cos(a) * s, y + Math.sin(a) * s * K]);
      }
      for (let k = 0; k < 6; k++) {
        const a = vs[k];
        const b = vs[(k + 1) % 6];
        const chave = [a, b].map((p) => `${Math.round(p[0])},${Math.round(p[1])}`).sort().join('|');
        if (!arestas.has(chave)) arestas.set(chave, { a, b, corT, luz });
      }
      if (!marcas) continue;
      const m = { peso: 5, sigma: 0.6, cor: corT, brilho: 1.05 * luz };
      if (nome === 'floresta') {
        for (let t = 0; t < 2; t++) {
          const fx = x + (t ? 5 : -5) * (s / 22);
          const fy = y + (t ? 2 : -2);
          const a = s * 0.28;
          d.traco([[fx - a * 0.7, fy + a * 0.5], [fx, fy - a], [fx + a * 0.7, fy + a * 0.5]], m);
        }
      } else if (nome === 'montanha') {
        const a = s * 0.46;
        d.traco([[x - a, y + a * 0.5], [x - a * 0.1, y - a * 0.9], [x + a * 0.9, y + a * 0.5]], m);
        d.traco([[x - a * 0.4, y - a * 0.35], [x - a * 0.1, y - a * 0.9], [x + a * 0.25, y - a * 0.35]], { ...m, cor: GIZ, brilho: luz });
      } else if (nome === 'colina') {
        d.traco(suavizar([[x - s * 0.4, y + 2], [x, y - s * 0.28], [x + s * 0.4, y + 2]], 6), m);
      } else if (nome === 'pantano') {
        d.traco([[x - s * 0.35, y], [x - s * 0.1, y]], m);
        d.traco([[x + s * 0.02, y + 4], [x + s * 0.34, y + 4]], m);
      }
    }
  }
  for (const { a, b, corT, luz } of arestas.values()) {
    d.traco([a, b], { peso: mini ? 2.4 : 3.4, sigma: 0.5, cor: corT, brilho: 0.55 * luz });
  }

  const rio = suavizar(
    [[cx - raioX * 0.9, cy - raioY * 0.42], [cx - raioX * 0.45, cy - raioY * 0.2], [cx - raioX * 0.12, cy - raioY * 0.46], [cx + raioX * 0.25, cy - raioY * 0.12], [cx + raioX * 0.52, cy + raioY * 0.3], [cx + raioX * 0.92, cy + raioY * 0.2]],
    18,
  );
  d.traco(rio, { peso: mini ? 6 : 8, sigma: mini ? 0.9 : 1.4, cor: AGUA, brilho: 0.5, tipo: TIPO.PULSO });

  const e = Math.max(mini ? 0.42 : 0.62, s / 22);
  const c1 = [cx - raioX * 0.28, cy + raioY * 0.38];
  const c2 = [cx + raioX * 0.42, cy - raioY * 0.3];
  const marcha = suavizar([[c1[0] + 34 * e, c1[1] - 6], [cx - raioX * 0.02, cy + raioY * 0.24], [cx + raioX * 0.1, cy - raioY * 0.05], [c2[0] - 38 * e, c2[1] - 2]], 18);
  d.traco(marcha, { peso: 12, sigma: mini ? 0.8 : 1.1, cor: OURO, brilho: 0.75, tipo: TIPO.PULSO });
  castelo(d, c1[0], c1[1], e, { brilho: 1.2, fogo: true, peso: mini ? 9 : 11 });
  castelo(d, c2[0], c2[1], e * 0.8, { cor: [0.75, 0.74, 0.72], brilho: 0.8, peso: mini ? 7 : 11 });

  if (!mini) {
    d.nuvem(
      () => {
        const a = Math.random() * Math.PI * 2;
        const k = 0.92 + Math.abs(gauss()) * 0.13;
        return [cx + Math.cos(a) * raioX * k, cy + Math.sin(a) * raioY * k];
      },
      { peso: Math.min(r.width, r.height) * 9, cor: NEVOA, brilho: 0.5, alfa: 0.16, tipo: TIPO.BRUMA },
    );
  }
}

/** O castelo de perto, com a coluna de soldados chegando. */
function desenharCastelo(d, r) {
  const cx = r.left + r.width / 2;
  const base = r.top + r.height * 0.8;
  const e = Math.min(r.width / 92, r.height / 104);
  castelo(d, cx, base, e, { brilho: 1.05, fogo: true, detalhe: true, peso: 16 });

  // Chão: hexágonos em perspectiva
  const s = e * 8;
  const K = 0.42;
  for (let lr = 0; lr < 4; lr++) {
    for (let c = -7; c <= 7; c++) {
      const x = cx + (c + (lr & 1 ? 0.5 : 0)) * Math.sqrt(3) * s;
      const y = base + 7 * e + lr * s * 1.5 * K;
      const dist = Math.abs(x - cx) / (r.width * 0.52);
      if (dist > 1) continue;
      const vs = [];
      for (let k = 0; k <= 6; k++) {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        vs.push([x + Math.cos(a) * s, y + Math.sin(a) * s * K]);
      }
      d.traco(vs, { peso: 2.6, sigma: 0.55, cor: TERRENO.planicie, brilho: 0.5 * (1 - dist) * (1 - lr * 0.2) });
    }
  }

  // A coluna em marcha: cada traço é uma pessoa
  const n = 16;
  for (let i = 0; i < n; i++) {
    const x = cx + e * (36 + i * 4.4);
    const y = base + e * 3 + Math.sin(i) * e * 0.4;
    if (x > r.left + r.width) break;
    d.traco([[x, y], [x, y - e * 4.4]], { peso: 16, sigma: Math.max(0.6, e * 0.34), cor: OURO, brilho: 0.8, tipo: TIPO.PULSO, fase0: i / n, fase1: i / n });
    d.traco([[x + e, y - e * 7], [x + e, y - e * 2]], { peso: 8, sigma: 0.5, cor: GIZ, brilho: 0.5 });
  }
}

// ---------------------------------------------------------------------------
// GlowUp: um olho no banho de revelação, com a cortina de antes e depois.
// ---------------------------------------------------------------------------
const PAPEL_FOTO = [0.96, 0.94, 0.9];
const SEGURANCA = [1.0, 0.72, 0.46];

/**
 * Um olho de perto, como na ferramenta de olhos: íris que dilata e muda de cor, pálpebra
 * que pisca, olhar que segue o ponteiro, pontos do detector e a cortina de antes e depois.
 * As curvas das pálpebras usam a mesma fórmula do shader, que recorta a íris por elas.
 */
function desenharOlho(d, r, { mini = false } = {}) {
  const T = TIPO.CORTINA;
  const larguraOlho = Math.min(r.width * (mini ? 0.94 : 0.84), r.height * (mini ? 1.5 : 1.24));
  const W = larguraOlho;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const hw = W / 2;
  const yc = cy + W * (mini ? 0.02 : 0.04);
  const hT = W * 0.2;
  const hB = W * 0.135;
  const R = W * 0.205;
  const irisY = yc - W * 0.012;
  const e = W / 700; // escala em relação a um olho de 700 px

  const larg = Math.min(r.width, W * (mini ? 1.06 : 1.16));
  const alt = Math.min(r.height, W * (mini ? 0.86 : 0.94));
  d.meta.cortina = { cx, cy, larg, alt };
  d.meta.olho = { geo: [cx, irisY, R, hw], lid: [yc, hT, hB] };

  const curva = (u) => Math.max(0, 1 - u * u) * (1 + 0.2 * u);
  const incl = (u) => -0.07 * u * hw;
  const lidTopo = (u) => [cx + u * hw, yc + incl(u) - hT * curva(u)];
  const lidBase = (u) => [cx + u * hw, yc + incl(u) + hB * curva(u)];
  const amostra = (f, n = 64) => Array.from({ length: n + 1 }, (_, i) => f(-1 + (2 * i) / n));
  const sigma = (v) => Math.max(0.5, v * e);

  // Moldura em cantos, como a bandeja de soltar a foto
  const mx = larg / 2;
  const my = alt / 2;
  const canto = Math.min(larg, alt) * 0.09;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    d.traco(
      [[cx + sx * mx, cy + sy * (my - canto)], [cx + sx * mx, cy + sy * my], [cx + sx * (mx - canto), cy + sy * my]],
      { peso: 12, sigma: 0.8, cor: PAPEL_FOTO, brilho: 0.8 },
    );
  }

  // Íris: fibras do centro para fora. A cor vem do shader, para poder trocar ao vivo.
  const P0 = 0.34;
  const fibras = mini ? 70 : 210;
  const interna = [1.0, 1.0, 0.92];
  for (let i = 0; i < fibras; i++) {
    const a = (i / fibras) * Math.PI * 2 + Math.random() * 0.02;
    const curta = i % 3 === 0;
    const fim = curta ? 0.56 + Math.random() * 0.12 : 0.74 + Math.random() * 0.25;
    const pts = [];
    for (let k = 0; k <= 7; k++) {
      const t = P0 + ((fim - P0) * k) / 7;
      const q = a + Math.sin(t * 15 + i * 1.7) * 0.022 + Math.sin(i * 0.61) * (t - P0) * 0.1;
      pts.push([cx + Math.cos(q) * t * R, irisY + Math.sin(q) * t * R]);
    }
    d.traco(pts, {
      peso: curta ? 3.6 : 2.6,
      sigma: sigma(mini ? 0.9 : 0.75),
      cor: curta ? interna : [0.92, 0.92, 0.92],
      brilho: curta ? 0.72 : 0.5,
      tipo: TIPO.IRIS,
    });
  }
  // Colar em volta da pupila e anel de fora
  const circulo = (raio, n = 90) => Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * raio * R, irisY + Math.sin(a) * raio * R];
  });
  d.traco(circulo(P0 + 0.005), { peso: 12, sigma: sigma(1.1), cor: interna, brilho: 0.8, tipo: TIPO.IRIS });
  d.traco(circulo(1), { peso: 9, sigma: sigma(1.9), cor: [0.72, 0.72, 0.72], brilho: 0.55, tipo: TIPO.IRIS });

  // Brilho no olhar: a janela refletida e o cintilar em cruz
  const bx = cx - R * 0.34;
  const by = irisY - R * 0.36;
  const bw = R * 0.15;
  d.nuvem(() => [bx + (Math.random() - 0.5) * 2 * bw, by + (Math.random() - 0.5) * 2 * bw * 0.72], { peso: mini ? 240 : 900, cor: [1, 1, 1], brilho: 1, alfa: 0.34, tipo: TIPO.BRILHO });
  d.nuvem(() => [cx + R * 0.3 + gauss() * R * 0.035, irisY + R * 0.4 + gauss() * R * 0.035], { peso: mini ? 60 : 200, cor: [1, 1, 1], brilho: 1, alfa: 0.22, tipo: TIPO.BRILHO });
  if (!mini) {
    const raio = R * 0.5;
    d.traco([[bx - raio, by], [bx + raio, by]], { peso: 8, sigma: 0.6, cor: [1, 1, 1], brilho: 0.5, tipo: TIPO.BRILHO });
    d.traco([[bx, by - raio], [bx, by + raio]], { peso: 8, sigma: 0.6, cor: [1, 1, 1], brilho: 0.5, tipo: TIPO.BRILHO });
  }

  // Branco do olho, bem de leve
  d.nuvem(
    () => {
      const u = -1 + Math.random() * 2;
      const [x, yT] = lidTopo(u);
      const [, yB] = lidBase(u);
      return [x, yT + Math.random() * (yB - yT)];
    },
    { peso: W * (mini ? 2 : 5), cor: [0.82, 0.84, 0.92], brilho: 0.6, alfa: 0.05, tipo: TIPO.ESCLERA },
  );

  // Pálpebras: a de cima é a linha forte
  d.traco(amostra(lidTopo), { peso: 20, sigma: sigma(2.6), firme: true, cor: PAPEL_FOTO, brilho: 1.05, tipo: TIPO.PALPEBRA });
  d.traco(amostra(lidBase), { peso: 11, sigma: sigma(0.95), cor: [1.0, 0.8, 0.68], brilho: 0.62, tipo: T });
  // Canto de dentro e dobra acima do olho
  const dobra = (u) => {
    const [x, y] = lidTopo(u * 0.88);
    return [x, y - W * (0.052 + 0.02 * (1 - u * u))];
  };
  d.traco(amostra(dobra), { peso: 8, sigma: sigma(0.9), cor: [1.0, 0.8, 0.68], brilho: 0.4, tipo: T });

  // Cílios: saem da pálpebra, curvam para cima e para fora, maiores no canto externo.
  const cilios = mini ? 26 : 74;
  for (let i = 0; i < cilios; i++) {
    const u = -0.88 + (1.86 * i) / (cilios - 1) + (Math.random() - 0.5) * 0.012;
    const [x0, y0] = lidTopo(u);
    const tam = W * (0.052 + 0.082 * ((u + 1) / 2) ** 1.5) * (0.86 + Math.random() * 0.28);
    const abre = u * 0.75 + 0.14;
    const pts = suavizar([
      [x0, y0],
      [x0 + tam * abre * 0.36, y0 - tam * 0.5],
      [x0 + tam * abre * 0.9, y0 - tam * 0.88],
      [x0 + tam * abre * 1.45, y0 - tam * 1.02],
    ], 5);
    // Dois traços: a base grossa e a ponta fina
    d.traco(pts.slice(0, 9), { peso: 7, sigma: sigma(1.05), cor: PAPEL_FOTO, brilho: 0.85, tipo: TIPO.PALPEBRA });
    d.traco(pts.slice(8), { peso: 5, sigma: sigma(0.5), cor: PAPEL_FOTO, brilho: 0.7, tipo: TIPO.PALPEBRA });
  }
  const cilios2 = mini ? 12 : 42;
  for (let i = 0; i < cilios2; i++) {
    const u = -0.72 + (1.66 * i) / (cilios2 - 1);
    const [x0, y0] = lidBase(u);
    const tam = W * (0.018 + 0.026 * ((u + 1) / 2)) * (0.8 + Math.random() * 0.4);
    d.traco([[x0, y0], [x0 + tam * u * 0.45, y0 + tam]], { peso: 6, sigma: sigma(0.42), cor: PAPEL_FOTO, brilho: 0.42, tipo: T });
  }

  // Sobrancelha: fios curtos que seguem o arco
  const fiosBrow = mini ? 34 : 120;
  const arcoBrow = (t) => [cx + (-0.86 + 1.86 * t) * hw, yc - W * (0.335 + 0.055 * Math.sin(Math.PI * Math.min(1, t * 1.28))) - W * 0.03 * t];
  for (let i = 0; i < fiosBrow; i++) {
    const t = Math.random();
    const [x, y] = arcoBrow(t);
    const esp = W * 0.03 * Math.min(1, t * 5) * (1 - t * 0.72);
    const dy = (Math.random() - 0.5) * esp * 2;
    const ang = -1.1 + t * 1.25 + (Math.random() - 0.5) * 0.28;
    const tam = W * (0.034 + 0.024 * Math.random());
    d.traco(
      suavizar([[x, y + dy], [x + Math.cos(ang) * tam * 0.55, y + dy + Math.sin(ang) * tam * 0.55], [x + Math.cos(ang + 0.3) * tam, y + dy + Math.sin(ang + 0.3) * tam]], 3),
      { peso: 4, sigma: sigma(0.55), cor: [0.98, 0.78, 0.56], brilho: 0.6, tipo: T },
    );
  }

  // O que o detector acha: pontos nas pálpebras e na íris, em luz fria
  const FRIA = [0.58, 0.82, 1.0];
  const pontos = mini ? 0 : 18;
  for (let i = 0; i < pontos; i++) {
    const u = -1 + (2 * i) / (pontos - 1);
    for (const [p, tipo] of [[lidTopo(u), TIPO.PALPEBRA], [lidBase(u), T]]) {
      const raio = sigma(1.5);
      d.nuvem(() => [p[0] + gauss() * raio, p[1] + gauss() * raio - (tipo === T ? 0 : 0)], { peso: 26, cor: FRIA, brilho: 1, alfa: 0.4, tipo });
    }
  }
  if (!mini) {
    // O anel que aparece em volta do que foi achado
    const anel = Array.from({ length: 121 }, (_, i) => {
      const a = (i / 120) * Math.PI * 2 - 2.2;
      return [cx + Math.cos(a) * W * 0.54, yc - W * 0.09 + Math.sin(a) * W * 0.385];
    });
    d.traco(anel, { peso: 4, sigma: 0.6, cor: FRIA, brilho: 0.34, tipo: TIPO.PULSO });
  }

  // A cortina de antes e depois
  d.traco([[cx, cy - my * 0.98], [cx, cy + my * 0.98]], { peso: 9, sigma: 0.7, cor: [1, 1, 1], brilho: 1.3, tipo: TIPO.LINHA_CORTINA });

  // Grão de banho de revelação
  d.nuvem(() => [cx + (Math.random() - 0.5) * larg, cy + (Math.random() - 0.5) * alt], { peso: Math.min(r.width, r.height) * (mini ? 2 : 4), cor: SEGURANCA, brilho: 0.3, alfa: 0.07, tipo: T });
}

/** A luz em volta das capturas de tela: moldura, faíscas e o grão do banho. */
function desenharLuz(d, r) {
  const m = 2;
  const x0 = r.left + m;
  const y0 = r.top + m;
  const x1 = r.left + r.width - m;
  const y1 = r.top + r.height - m;
  const canto = Math.min(r.width, r.height) * 0.1;
  for (const [cxx, cyy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    d.traco([[cxx, cyy + sy * canto], [cxx, cyy], [cxx + sx * canto, cyy]], { peso: 14, sigma: 0.9, cor: PAPEL_FOTO, brilho: 1 });
  }
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  d.nuvem(() => [cx + gauss() * r.width * 0.42, cy + gauss() * r.height * 0.42], { peso: (r.width + r.height) * 7, cor: SEGURANCA, brilho: 0.4, alfa: 0.1, tipo: TIPO.BRUMA });
  // Poucas faíscas, soltas pela área toda.
  d.nuvem(() => [x0 + Math.random() * (x1 - x0), y0 + Math.random() * (y1 - y0) + 75], { peso: (r.width + r.height) * 0.6, cor: SEGURANCA, brilho: 1, alfa: 0.6, tipo: TIPO.BRASA });
}

// ---------------------------------------------------------------------------
// Rabisco: a cena de quem ainda não tem desenho próprio.
// ---------------------------------------------------------------------------
function desenharRabisco(d, r, { mini = false } = {}) {
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const raio = Math.min(r.width, r.height) * 0.46;
  const pts = [];
  for (let a = 0; a < 42; a++) {
    const t = a * 0.72;
    const k = raio * (0.45 + 0.55 * Math.sin(a * 0.31) ** 2);
    pts.push([cx + Math.cos(t) * k, cy + Math.sin(t * 1.06) * k * 0.72]);
  }
  d.traco(suavizar(pts, 10), { peso: mini ? 6 : 9, sigma: mini ? 0.7 : 1, cor: GIZ, brilho: 0.8, tipo: TIPO.PULSO });
}

const CENA = {
  reino: { meta: { quente: BRASA, papel: [0.05, 0.043, 0.036], grade: 0.12, halo: 0.85 }, desenhar: desenharMapa },
  'reino-perto': { meta: { quente: BRASA, papel: [0.052, 0.042, 0.034], grade: 0.08, halo: 0.8 }, desenhar: desenharCastelo },
  glowup: { meta: { quente: SEGURANCA, papel: [0.043, 0.043, 0.047], grade: 0, halo: 0.8 }, desenhar: desenharOlho },
  'glowup-luz': { meta: { quente: SEGURANCA, papel: [0.043, 0.043, 0.047], grade: 0, halo: 0.75 }, desenhar: desenharLuz },
  rabisco: { meta: { quente: FLUO, papel: [0.039, 0.043, 0.035], grade: 0.8, halo: 0.6 }, desenhar: desenharRabisco },
};

/**
 * Monta a cena de uma parada.
 * contexto: { marca, portas: [{ cena, caixa }] } na abertura, { caixa } nas outras.
 */
export function montarCena(nome, contexto) {
  if (nome === 'palavra') {
    // A palavra pede pouco efeito: halo baixo, quase sem tremido, para continuar legível.
    const d = new Desenho({ quente: FLUO, papel: [0.039, 0.043, 0.035], grade: 0.7, halo: 0.22, tremido: 0.32 });
    desenharPalavra(d, contexto.marca);
    d.fasePadrao = [0.6, 1];
    for (const { cena, caixa } of contexto.portas) {
      (CENA[cena] || CENA.rabisco).desenhar(d, caixa, { mini: true });
    }
    return d;
  }
  const c = CENA[nome] || CENA.rabisco;
  const d = new Desenho(c.meta);
  c.desenhar(d, contexto.caixa, { mini: false });
  return d;
}
