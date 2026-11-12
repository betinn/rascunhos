// Rabisco: a cena de quem ainda não tem cena. Uma caneta de luz desenha sem parar.

import { telaCanvas } from './tela.js';

export function cenaRabisco(tela, app) {
  const { ctx, medir: medirTela } = telaCanvas(tela);
  const cor = app?.cor || '#dfe6ff';
  let W = 1;
  let H = 1;
  const rastro = [];

  const onde = (t) => [
    W * (0.5 + 0.3 * Math.sin(t * 1.1) + 0.12 * Math.sin(t * 2.7 + 1)),
    H * (0.5 + 0.26 * Math.sin(t * 1.7 + 0.6) + 0.1 * Math.cos(t * 3.1)),
  ];

  function desenhar() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    for (const [larg, alfa, tinta] of [[10, 0.1, cor], [2, 0.9, '#ffffff']]) {
      ctx.lineWidth = larg;
      ctx.strokeStyle = tinta;
      for (let i = 1; i < rastro.length; i++) {
        ctx.globalAlpha = alfa * (i / rastro.length) ** 1.2;
        ctx.beginPath();
        ctx.moveTo(rastro[i - 1][0], rastro[i - 1][1]);
        ctx.lineTo(rastro[i][0], rastro[i][1]);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  return {
    medir() {
      const m = medirTela();
      W = m.w;
      H = m.h;
      rastro.length = 0;
    },
    quadro(dt, t) {
      rastro.push(onde(t));
      if (rastro.length > 260) rastro.shift();
      desenhar();
    },
    parado() {
      rastro.length = 0;
      for (let k = 0; k < 260; k++) rastro.push(onde(k * 0.017));
      desenhar();
    },
  };
}
