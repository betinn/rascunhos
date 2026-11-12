// Reino de Pedra: um pedaço do mapa de hexágonos, à noite. A névoa cobre tudo, menos o que
// uma luz alcança: os castelos, as cargas na estrada e o explorador, que segue o ponteiro.

import { telaCanvas } from './tela.js';

const R3 = Math.sqrt(3);
const TERRENO = {
  agua: '#1d3c60',
  planicie: '#36462b',
  floresta: '#24402b',
  colina: '#4b412c',
  montanha: '#47474f',
};
const DONOS = ['#5ea6ea', '#e0503f', '#a77ad9'];

// Ruído de valor, estável entre recargas: o mapa é sempre o mesmo.
const acaso = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function ruido(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = acaso(xi, yi) + (acaso(xi + 1, yi) - acaso(xi, yi)) * sx;
  const b = acaso(xi, yi + 1) + (acaso(xi + 1, yi + 1) - acaso(xi, yi + 1)) * sx;
  return a + (b - a) * sy;
}

export function cenaReino(tela) {
  const { canvas, ctx, medir: medirTela } = telaCanvas(tela);
  const chao = document.createElement('canvas');
  const nevoa = document.createElement('canvas');
  const cctx = chao.getContext('2d');
  const nctx = nevoa.getContext('2d');
  let W = 1;
  let H = 1;
  let R = 20;
  let castelos = [];
  let jazidas = [];
  const explorador = { x: 0, y: 0, pronto: false };
  const rato = { x: 0, y: 0, dentro: false };

  function hexagono(c, x, y, r) {
    c.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath();
  }

  function castelo(c, x, y, s, cor) {
    c.fillStyle = '#7a746b';
    c.fillRect(x - s * 0.5, y - s * 0.25, s, s * 0.62);
    for (let k = 0; k < 3; k++) c.fillRect(x - s * 0.5 + k * s * 0.38, y - s * 0.45, s * 0.24, s * 0.22);
    c.fillStyle = '#15120f';
    c.fillRect(x - s * 0.11, y + s * 0.08, s * 0.22, s * 0.29);
    c.strokeStyle = '#b9b2a6';
    c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath();
    c.moveTo(x + s * 0.36, y - s * 0.45);
    c.lineTo(x + s * 0.36, y - s * 0.95);
    c.stroke();
    c.fillStyle = cor;
    c.beginPath();
    c.moveTo(x + s * 0.38, y - s * 0.95);
    c.lineTo(x + s * 0.78, y - s * 0.82);
    c.lineTo(x + s * 0.38, y - s * 0.68);
    c.fill();
  }

  function medir() {
    const m = medirTela();
    W = m.w;
    H = m.h;
    for (const c of [chao, nevoa]) {
      c.width = canvas.width;
      c.height = canvas.height;
    }
    cctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
    nctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);

    const colunas = W > 520 ? 13 : 9;
    R = W / (R3 * (colunas - 1));
    const linhas = Math.ceil(H / (1.5 * R)) + 1;
    const centro = (c, l) => [R3 * R * (c + (l % 2) * 0.5), 1.5 * R * l];

    cctx.fillStyle = '#0d1014';
    cctx.fillRect(0, 0, W, H);
    for (let l = 0; l < linhas; l++) {
      for (let c = 0; c < colunas; c++) {
        const [x, y] = centro(c, l);
        const rio = Math.abs(c + (l % 2) * 0.5 - (colunas * 0.5 + 2.1 * Math.sin(l * 0.75))) < 0.62;
        const n = ruido(c * 0.42 + 3, l * 0.42 + 7);
        const tipo = rio ? 'agua' : n < 0.36 ? 'floresta' : n < 0.6 ? 'planicie' : n < 0.76 ? 'colina' : 'montanha';
        hexagono(cctx, x, y, R * 0.97);
        cctx.fillStyle = TERRENO[tipo];
        cctx.fill();
        cctx.fillStyle = `rgb(255 255 255 / ${(acaso(c, l) * 0.05).toFixed(3)})`;
        cctx.fill();
        cctx.strokeStyle = 'rgb(0 0 0 / 0.4)';
        cctx.lineWidth = 1;
        cctx.stroke();
        // Um sinal do terreno: árvores na floresta, um pico na montanha.
        if (tipo === 'floresta') {
          cctx.fillStyle = '#3a6141';
          for (const [dx, dy] of [[-0.3, 0.12], [0.08, -0.14], [0.34, 0.2]]) {
            cctx.beginPath();
            cctx.moveTo(x + dx * R, y + (dy - 0.3) * R);
            cctx.lineTo(x + (dx - 0.17) * R, y + (dy + 0.1) * R);
            cctx.lineTo(x + (dx + 0.17) * R, y + (dy + 0.1) * R);
            cctx.fill();
          }
        } else if (tipo === 'montanha') {
          cctx.strokeStyle = '#6a6a74';
          cctx.lineWidth = Math.max(1, R * 0.07);
          cctx.beginPath();
          cctx.moveTo(x - R * 0.4, y + R * 0.22);
          cctx.lineTo(x - R * 0.05, y - R * 0.3);
          cctx.lineTo(x + R * 0.14, y - R * 0.04);
          cctx.lineTo(x + R * 0.28, y - R * 0.2);
          cctx.lineTo(x + R * 0.48, y + R * 0.22);
          cctx.stroke();
        }
      }
    }

    // Castelos e jazidas ficam no hexágono mais perto de um lugar fixo da cena.
    const perto = (fx, fy) => {
      const l = Math.round((fy * H) / (1.5 * R));
      const c = Math.round((fx * W) / (R3 * R) - (l % 2) * 0.5);
      return centro(c, l);
    };
    castelos = [[0.2, 0.66], [0.8, 0.28], [0.66, 0.8]].map(([fx, fy], k) => {
      const [x, y] = perto(fx, fy);
      hexagono(cctx, x, y, R * 0.97);
      cctx.fillStyle = '#3a3a33';
      cctx.fill();
      castelo(cctx, x, y + R * 0.1, R * 0.95, DONOS[k]);
      return { x, y, cor: DONOS[k] };
    });
    jazidas = [[0.42, 0.2], [0.08, 0.24], [0.5, 0.56], [0.9, 0.62], [0.34, 0.86]].map(([fx, fy]) => perto(fx, fy));

    // Estradas: um pontilhado entre os castelos.
    cctx.setLineDash([R * 0.18, R * 0.3]);
    cctx.strokeStyle = 'rgb(240 225 190 / 0.3)';
    cctx.lineWidth = Math.max(1, R * 0.06);
    for (const [a, b] of [[0, 2], [1, 0]]) {
      cctx.beginPath();
      cctx.moveTo(castelos[a].x, castelos[a].y);
      cctx.lineTo(castelos[b].x, castelos[b].y);
      cctx.stroke();
    }
    cctx.setLineDash([]);
    explorador.pronto = false;
  }

  function clarao(c, x, y, r, alfa) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgb(0 0 0 / ${alfa})`);
    g.addColorStop(0.55, `rgb(0 0 0 / ${alfa * 0.7})`);
    g.addColorStop(1, 'rgb(0 0 0 / 0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function brasa(x, y, r, cor, alfa) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgb(${cor} / ${alfa})`);
    g.addColorStop(1, `rgb(${cor} / 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function quadro(dt, t) {
    // O explorador segue o ponteiro; sem ele, anda sozinho pelo mapa.
    const ax = rato.dentro ? rato.x : W * (0.5 + 0.36 * Math.sin(t * 0.27));
    const ay = rato.dentro ? rato.y : H * (0.5 + 0.32 * Math.sin(t * 0.37 + 1.2));
    if (!explorador.pronto) {
      explorador.x = ax;
      explorador.y = ay;
      explorador.pronto = true;
    }
    const pega = Math.min(1, dt * (rato.dentro ? 7 : 2));
    explorador.x += (ax - explorador.x) * pega;
    explorador.y += (ay - explorador.y) * pega;

    // Cargas: uma caravana e uma tropa em marcha.
    const idaEVolta = (u) => 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
    const entre = (a, b, u) => [castelos[a].x + (castelos[b].x - castelos[a].x) * u, castelos[a].y + (castelos[b].y - castelos[a].y) * u];
    const caravana = entre(0, 2, idaEVolta(t / 19));
    const tropa = [0, 0.035, 0.07].map((d) => entre(1, 0, Math.min(1, Math.max(0, ((t / 26) % 1) * 1.2 - d))));

    ctx.drawImage(chao, 0, 0, W, H);

    // Jazidas: brilham no chão, mas só aparecem onde a névoa abre.
    for (let k = 0; k < jazidas.length; k++) {
      const [x, y] = jazidas[k];
      const s = R * (0.2 + 0.07 * Math.sin(t * 2.3 + k * 1.7));
      ctx.fillStyle = '#ffd77a';
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.quadraticCurveTo(x, y, x + s, y);
      ctx.quadraticCurveTo(x, y, x, y + s);
      ctx.quadraticCurveTo(x, y, x - s, y);
      ctx.quadraticCurveTo(x, y, x, y - s);
      ctx.fill();
    }

    ctx.fillStyle = '#ffe2a8';
    ctx.beginPath();
    ctx.arc(caravana[0], caravana[1], R * 0.13, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = castelos[1].cor;
    for (const [x, y] of tropa) {
      ctx.beginPath();
      ctx.arc(x, y, R * 0.11, 0, 6.2832);
      ctx.fill();
    }

    // A névoa, com um buraco em volta de cada luz.
    nctx.globalCompositeOperation = 'source-over';
    nctx.clearRect(0, 0, W, H);
    nctx.fillStyle = 'rgb(8 10 15 / 0.9)';
    nctx.fillRect(0, 0, W, H);
    nctx.globalCompositeOperation = 'destination-out';
    castelos.forEach((c, k) => clarao(nctx, c.x, c.y, R * (2.5 + 0.12 * Math.sin(t * 7.3 + k * 2) + 0.08 * Math.sin(t * 13.1 + k)), 1));
    clarao(nctx, caravana[0], caravana[1], R * 1.5, 0.95);
    clarao(nctx, tropa[0][0], tropa[0][1], R * 1.3, 0.9);
    clarao(nctx, explorador.x, explorador.y, R * 3.1, 1);
    ctx.drawImage(nevoa, 0, 0, W, H);

    // O calor das luzes por cima de tudo.
    ctx.globalCompositeOperation = 'lighter';
    castelos.forEach((c, k) => brasa(c.x, c.y, R * 2.2, '255 150 70', 0.2 + 0.05 * Math.sin(t * 9 + k * 3)));
    brasa(caravana[0], caravana[1], R * 0.9, '255 200 120', 0.3);
    brasa(explorador.x, explorador.y, R * 2.6, '255 190 110', 0.2);
    brasa(explorador.x, explorador.y, R * 0.34, '255 240 210', 0.95);
    ctx.globalCompositeOperation = 'source-over';
  }

  return {
    medir,
    quadro,
    ponteiro(x, y, dentro) {
      rato.x = x;
      rato.y = y;
      rato.dentro = dentro;
    },
  };
}
