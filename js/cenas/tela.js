// Um canvas que ocupa a tela da moldura, com a densidade de pixels do aparelho.
export function telaCanvas(tela, { dprMax = 2 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cena-canvas';
  tela.append(canvas);
  const ctx = canvas.getContext('2d');
  return {
    canvas,
    ctx,
    medir() {
      const dpr = Math.min(devicePixelRatio || 1, dprMax);
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h, dpr };
    },
  };
}
