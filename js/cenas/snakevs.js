// Snake VS: uma partida do modo VS CPU jogando sozinha. A cobra verde procura a maçã e,
// com o ponteiro sobre o tabuleiro, vai atrás dele.

import { telaCanvas } from './tela.js';

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const PASSO = 0.115; // s por casa
const META = 9;
const CORES = {
  voce: { rabo: [22, 140, 74], cabeca: [108, 240, 138] },
  cpu: { rabo: [150, 30, 78], cabeca: [255, 108, 150] },
};

export function cenaSnake(tela) {
  tela.classList.add('cena-snake');
  tela.innerHTML = `
    <div class="snake-placar" aria-hidden="true">
      <span class="snake-voce">Você <b>0</b></span>
      <span class="snake-meta">Meta ${META}</span>
      <span class="snake-cpu">CPU <b>0</b></span>
    </div>`;
  const placar = [tela.querySelector('.snake-voce b'), tela.querySelector('.snake-cpu b')];
  const { canvas, ctx, medir: medirTela } = telaCanvas(tela);
  const fundo = document.createElement('canvas');
  const fctx = fundo.getContext('2d');

  let W = 1;
  let H = 1;
  let cols = 16;
  let rows = 10;
  let casa = 20;
  let ox = 0;
  let oy = 0;
  let muros = new Set();
  let cobras = [];
  let maca = null;
  let textos = [];
  let acumulado = 0;
  const rato = { x: 0, y: 0, dentro: false };

  const chave = (x, y) => y * cols + x;
  const fora = (x, y) => x < 0 || y < 0 || x >= cols || y >= rows;

  function novaCobra(jogador) {
    const y = jogador ? rows - 2 : 1;
    const x = jogador ? 3 : cols - 4;
    const dir = jogador ? 0 : 2;
    const corpo = [0, 1, 2].map((k) => ({ x: x - DIRS[dir][0] * k, y }));
    return { jogador, corpo, antes: corpo.map((p) => ({ ...p })), dir, cresce: 0, morta: 0 };
  }

  function bloqueio() {
    const b = new Uint8Array(cols * rows);
    for (const m of muros) b[m] = 1;
    for (const c of cobras) for (const p of c.corpo) b[chave(p.x, p.y)] = 1;
    return b;
  }

  function novaMaca() {
    const b = bloqueio();
    for (let k = 0; k < 200; k++) {
      const x = 1 + Math.floor(Math.random() * (cols - 2));
      const y = 1 + Math.floor(Math.random() * (rows - 2));
      if (!b[chave(x, y)]) return { x, y, dourada: Math.random() < 0.16 };
    }
    return { x: 1, y: 1, dourada: false };
  }

  function recomecar() {
    cobras = [novaCobra(true), novaCobra(false)];
    cobras.forEach((c) => (c.pontos = 0));
    maca = novaMaca();
    textos = [];
    placar.forEach((p) => (p.textContent = '0'));
  }

  function medir() {
    const m = medirTela();
    W = m.w;
    H = m.h;
    cols = W >= 480 ? 26 : 16;
    casa = W / cols;
    rows = Math.max(6, Math.floor(H / casa));
    ox = 0;
    oy = (H - rows * casa) / 2;

    muros = new Set();
    const linhas = rows >= 12 ? [Math.round(rows * 0.34), Math.round(rows * 0.66)] : [Math.floor(rows / 2)];
    for (const y of linhas) for (let x = Math.round(cols * 0.28); x < Math.round(cols * 0.72); x++) muros.add(chave(x, y));

    fundo.width = canvas.width;
    fundo.height = canvas.height;
    fctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
    fctx.fillStyle = '#0f1226';
    fctx.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        fctx.fillStyle = (x + y) % 2 ? '#181c38' : '#151831';
        fctx.fillRect(ox + x * casa, oy + y * casa, casa + 0.5, casa + 0.5);
      }
    }
    for (const m2 of muros) {
      const x = ox + (m2 % cols) * casa;
      const y = oy + Math.floor(m2 / cols) * casa;
      const f = casa * 0.08;
      fctx.fillStyle = '#39416f';
      fctx.beginPath();
      fctx.roundRect(x + f, y + f, casa - f * 2, casa - f * 2, casa * 0.2);
      fctx.fill();
      fctx.fillStyle = '#4b5590';
      fctx.beginPath();
      fctx.roundRect(x + casa * 0.2, y + casa * 0.16, casa * 0.6, casa * 0.14, casa * 0.07);
      fctx.fill();
    }
    recomecar();
  }

  /** Primeiro passo do caminho mais curto até o alvo, ou -1. */
  function caminho(de, alvo, b) {
    const veio = new Int16Array(cols * rows).fill(-1);
    const fila = [chave(de.x, de.y)];
    veio[fila[0]] = -2;
    const fim = chave(alvo.x, alvo.y);
    if (fim === fila[0]) return -1;
    for (let i = 0; i < fila.length; i++) {
      const at = fila[i];
      if (at === fim) {
        let k = at;
        while (veio[k] !== fila[0]) k = veio[k];
        const dx = (k % cols) - de.x;
        const dy = Math.floor(k / cols) - de.y;
        return DIRS.findIndex((d) => d[0] === dx && d[1] === dy);
      }
      const x = at % cols;
      const y = Math.floor(at / cols);
      for (const [dx, dy] of DIRS) {
        const nx = x + dx;
        const ny = y + dy;
        if (fora(nx, ny)) continue;
        const k = chave(nx, ny);
        if (veio[k] !== -1 || (b[k] && k !== fim)) continue;
        veio[k] = at;
        fila.push(k);
      }
    }
    return -1;
  }

  /** Quantas casas livres dá para alcançar a partir daqui: foge de beco sem saída. */
  function espaco(x, y, b) {
    const visto = new Uint8Array(cols * rows);
    const fila = [[x, y]];
    visto[chave(x, y)] = 1;
    let n = 0;
    for (let i = 0; i < fila.length && n < 60; i++) {
      n++;
      for (const [dx, dy] of DIRS) {
        const nx = fila[i][0] + dx;
        const ny = fila[i][1] + dy;
        if (fora(nx, ny)) continue;
        const k = chave(nx, ny);
        if (visto[k] || b[k]) continue;
        visto[k] = 1;
        fila.push([nx, ny]);
      }
    }
    return n;
  }

  function passo() {
    for (const c of cobras) {
      if (c.morta > 0) continue;
      const b = bloqueio();
      const cabeca = c.corpo[0];
      let alvo = maca;
      if (c.jogador && rato.dentro) {
        const rx = Math.floor((rato.x - ox) / casa);
        const ry = Math.floor((rato.y - oy) / casa);
        if (!fora(rx, ry) && !b[chave(rx, ry)]) alvo = { x: rx, y: ry };
      }
      let dir = caminho(cabeca, alvo, b);
      if (dir < 0 && alvo !== maca) dir = caminho(cabeca, maca, b);
      if (dir < 0) {
        let melhor = 0;
        DIRS.forEach(([dx, dy], k) => {
          const nx = cabeca.x + dx;
          const ny = cabeca.y + dy;
          if (fora(nx, ny) || b[chave(nx, ny)]) return;
          const e = espaco(nx, ny, b);
          if (e > melhor) {
            melhor = e;
            dir = k;
          }
        });
      }
      c.antes = c.corpo.map((p) => ({ ...p }));
      if (dir < 0) {
        c.morta = 0.7; // sem saída: bateu
        continue;
      }
      c.dir = dir;
      c.corpo.unshift({ x: cabeca.x + DIRS[dir][0], y: cabeca.y + DIRS[dir][1] });
      if (c.cresce > 0) {
        c.cresce--;
        c.antes.push({ ...c.antes[c.antes.length - 1] });
      } else c.corpo.pop();

      const nova = c.corpo[0];
      if (nova.x === maca.x && nova.y === maca.y) {
        c.pontos++;
        if (c.corpo.length < 15) c.cresce += 2;
        textos.push({ x: maca.x, y: maca.y, vida: 1, texto: maca.dourada ? '+50' : '+10', cor: maca.dourada ? '#ffd23e' : '#ffffff' });
        placar[c.jogador ? 0 : 1].textContent = c.pontos;
        maca = novaMaca();
        if (c.pontos >= META) c.venceu = 1.4;
      }
    }
  }

  const centro = (p) => [ox + (p.x + 0.5) * casa, oy + (p.y + 0.5) * casa];

  function desenharCobra(c, f) {
    const cor = c.jogador ? CORES.voce : CORES.cpu;
    const pts = c.corpo.map((p, i) => {
      const a = c.antes[i] || p;
      return centro({ x: a.x + (p.x - a.x) * f, y: a.y + (p.y - a.y) * f });
    });
    if (c.morta > 0 && Math.floor(c.morta * 12) % 2) return; // pisca ao bater
    ctx.lineCap = 'round';
    for (const [larg, alfa] of [[casa * 1.5, 0.12], [casa * 0.78, 1]]) {
      ctx.lineWidth = larg;
      for (let i = pts.length - 1; i > 0; i--) {
        const u = 1 - i / pts.length;
        const rgb = cor.rabo.map((v, k) => Math.round(v + (cor.cabeca[k] - v) * u));
        ctx.strokeStyle = `rgb(${rgb.join(' ')} / ${alfa})`;
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[i - 1][0], pts[i - 1][1]);
        ctx.stroke();
      }
    }
    // Os olhos, virados para onde ela vai.
    const [hx, hy] = pts[0];
    const [dx, dy] = DIRS[c.dir];
    for (const lado of [-1, 1]) {
      const ex = hx + dx * casa * 0.14 - dy * lado * casa * 0.19;
      const ey = hy + dy * casa * 0.14 + dx * lado * casa * 0.19;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex, ey, casa * 0.13, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = '#10122a';
      ctx.beginPath();
      ctx.arc(ex + dx * casa * 0.05, ey + dy * casa * 0.05, casa * 0.065, 0, 6.2832);
      ctx.fill();
    }
  }

  function quadro(dt, t) {
    acumulado += dt;
    while (acumulado >= PASSO) {
      acumulado -= PASSO;
      passo();
    }
    for (const c of cobras) {
      if (c.morta > 0) {
        c.morta -= dt;
        if (c.morta <= 0) Object.assign(c, novaCobra(c.jogador));
      }
      if (c.venceu > 0) {
        c.venceu -= dt;
        if (c.venceu <= 0) recomecar();
      }
    }
    const f = acumulado / PASSO;

    ctx.drawImage(fundo, 0, 0, W, H);

    // A maçã, com um pulso de luz.
    const [mx, my] = centro(maca);
    const corMaca = maca.dourada ? '255 210 62' : '255 77 94';
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, casa * 1.5);
    g.addColorStop(0, `rgb(${corMaca} / ${0.3 + 0.12 * Math.sin(t * 5)})`);
    g.addColorStop(1, `rgb(${corMaca} / 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(mx - casa * 1.5, my - casa * 1.5, casa * 3, casa * 3);
    ctx.fillStyle = `rgb(${corMaca})`;
    ctx.beginPath();
    ctx.arc(mx, my + casa * 0.04, casa * 0.33, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#4bd66f';
    ctx.beginPath();
    ctx.arc(mx + casa * 0.1, my - casa * 0.32, casa * 0.11, 0, 6.2832);
    ctx.fill();

    for (const c of cobras) desenharCobra(c, f);

    ctx.font = `${Math.round(casa * 0.62)}px Silkscreen, ui-monospace, monospace`;
    ctx.textAlign = 'center';
    textos = textos.filter((x) => (x.vida -= dt * 1.1) > 0);
    for (const x of textos) {
      const [tx, ty] = centro(x);
      ctx.globalAlpha = Math.min(1, x.vida * 2);
      ctx.fillStyle = x.cor;
      ctx.fillText(x.texto, tx, ty - casa * (0.7 + (1 - x.vida) * 1.2));
    }
    ctx.globalAlpha = 1;
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
