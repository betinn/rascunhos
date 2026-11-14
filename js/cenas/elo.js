// ELO: um agendamento nasce na tela de cadastro, voa até o dia dele na agenda e, depois,
// some ao ser cancelado. E começa de novo, sem fim. Os nomes são inventados.

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HORA_INICIAL = 9;
const HORAS = 9; // das 9h às 18h

// Agendamentos que já estão na semana: [dia, início em horas, duração em horas, serviço, cliente].
const SEMANA = [
  [0, 10, 1, 'Escova', 'Marina'],
  [1, 9, 1, 'Manicure', 'Júlia'],
  [2, 13, 2, 'Coloração', 'Renata'],
  [3, 9.5, 1, 'Corte', 'Sofia'],
  [4, 10, 1.5, 'Limpeza de pele', 'Carla'],
  [5, 15, 1, 'Massagem', 'Clara'],
  [1, 15.5, 1, 'Sobrancelha', 'Lara'],
];

// O agendamento que entra e sai.
const NOVO = { dia: 3, hora: 14, duracao: 1, servico: 'Corte', cliente: 'Bianca' };
const CAMPOS = [
  ['Cliente', NOVO.cliente],
  ['Serviço', `${NOVO.servico} · 1h`],
  ['Dia e hora', `${DIAS[NOVO.dia]}, ${NOVO.hora}:00`],
];

// O roteiro, em segundos. A volta inteira dura DURA.
const T = {
  dedoNovo: [0.1, 0.75],
  toqueNovo: 0.8,
  folhaSobe: [0.9, 1.5],
  campos: [
    [1.55, 1.65, 2.25], // o dedo chega, o texto começa, o texto termina
    [2.35, 2.45, 2.85],
    [2.95, 3.05, 3.55],
  ],
  dedoAgendar: [3.6, 4.1],
  toqueAgendar: 4.15,
  voo: [4.25, 5.25],
  folhaDesce: [4.25, 4.85],
  pouso: [5.25, 5.75],
  avisoCriado: [5.35, 6.45],
  dedoCard: [6.35, 6.95],
  toqueCard: 7.0,
  balaoAbre: [7.05, 7.35],
  dedoCancelar: [7.5, 8.0],
  toqueCancelar: 8.05,
  balaoFecha: [8.15, 8.4],
  cancela: [8.15, 8.45],
  some: [8.8, 9.4],
  avisoCancelado: [8.5, 9.6],
  dedoVolta: [8.4, 9.5],
};
const DURA = 10.3;

// Paleta do ELO no modo escuro.
const COR = {
  vinho400: [212, 137, 149],
  vinho900: [71, 29, 38],
  vinho950: [47, 17, 23],
  telha400: [241, 135, 97],
  telha900: [91, 25, 7],
  terra100: [242, 233, 216],
  terra300: [214, 193, 176],
  oliva500: [128, 131, 109],
};

const lim = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
const trecho = (t, [a, b]) => lim((t - a) / (b - a));
const suave = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const sai = (u) => 1 - (1 - u) ** 3;
const mistura = (a, b, u) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(' ')})`;
const entre = (a, b, u) => a + (b - a) * u;
/** Um aviso que entra, fica e sai dentro do trecho. */
const pulso = (t, [a, b], borda = 0.22) => Math.min(lim((t - a) / borda), lim((b - t) / borda));
const hora = (h) => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;

export function cenaElo(tela) {
  tela.classList.add('cena-elo');
  tela.innerHTML = `
    <div class="elo" aria-hidden="true">
      <div class="elo-topo">
        <span class="elo-marca">ELO</span>
        <span class="elo-titulo">Agenda</span>
        <span class="elo-semana">Esta semana</span>
      </div>
      <div class="elo-grade">
        <div class="elo-dias"><span></span>${DIAS.map((d) => `<span>${d}</span>`).join('')}</div>
        <div class="elo-horas">${Array.from({ length: HORAS }, (_, k) => `<span>${HORA_INICIAL + k}h</span>`).join('')}</div>
        <div class="elo-celas">
          <div class="elo-coluna"></div>
          ${SEMANA.map(
            ([, ini, dur, servico, cliente]) =>
              `<div class="elo-ag"><b>${hora(ini)} ${servico}</b><span>${cliente}</span></div>`,
          ).join('')}
        </div>
      </div>
      <div class="elo-rodape"><span class="elo-novo"><i>+</i> Novo agendamento</span></div>
      <div class="elo-veu"></div>
      <div class="elo-folha">
        <span class="elo-alca"></span>
        <p class="elo-folha-titulo">Novo agendamento</p>
        ${CAMPOS.map(([rotulo]) => `<div class="elo-campo"><small>${rotulo}</small><span></span></div>`).join('')}
        <span class="elo-agendar">Agendar</span>
      </div>
      <div class="elo-voo">
        <span class="elo-voo-botao">Agendar</span>
        <span class="elo-voo-card"><b>${NOVO.hora}:00 ${NOVO.servico}</b><span>${NOVO.cliente}</span></span>
        <span class="elo-voo-cancelado"><b>Cancelado</b><span>${NOVO.cliente}</span></span>
      </div>
      <div class="elo-balao">
        <b>${NOVO.cliente} · ${NOVO.servico}</b>
        <span>${DIAS[NOVO.dia]}, ${NOVO.hora}:00 às ${NOVO.hora + NOVO.duracao}:00</span>
        <span class="elo-cancelar">Cancelar agendamento</span>
      </div>
      <div class="elo-aviso"></div>
      <div class="elo-dedo"><i></i></div>
    </div>`;

  const raiz = tela.firstElementChild;
  const $ = (s) => raiz.querySelector(s);
  const el = {
    celas: $('.elo-celas'),
    coluna: $('.elo-coluna'),
    dias: [...raiz.querySelectorAll('.elo-dias span')].slice(1),
    ags: [...raiz.querySelectorAll('.elo-ag')],
    novo: $('.elo-novo'),
    veu: $('.elo-veu'),
    folha: $('.elo-folha'),
    campos: [...raiz.querySelectorAll('.elo-campo')],
    valores: [...raiz.querySelectorAll('.elo-campo span')],
    agendar: $('.elo-agendar'),
    voo: $('.elo-voo'),
    vooBotao: $('.elo-voo-botao'),
    vooCard: $('.elo-voo-card'),
    vooCancelado: $('.elo-voo-cancelado'),
    balao: $('.elo-balao'),
    cancelar: $('.elo-cancelar'),
    aviso: $('.elo-aviso'),
    dedo: $('.elo-dedo'),
  };

  let m = null; // as medidas da tela
  let tempo = 0;
  let semDedo = false;

  const caixa = (e, base) => {
    const r = e.getBoundingClientRect();
    return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
  };
  const centro = (c) => [c.x + c.w / 2, c.y + c.h / 2];

  function medir() {
    const w = raiz.clientWidth;
    const h = raiz.clientHeight;
    if (!w || !h) return;
    raiz.style.fontSize = `${Math.max(10.5, Math.min(15, w / 36)).toFixed(2)}px`;

    // Mede tudo com a folha aberta e o balão no lugar, sem transformações.
    el.folha.style.transform = 'none';
    el.balao.style.transform = 'none';
    const base = raiz.getBoundingClientRect();
    const celas = caixa(el.celas, base);
    const colW = celas.w / DIAS.length;
    const rowH = celas.h / HORAS;
    el.celas.style.setProperty('--col', `${colW}px`);
    el.celas.style.setProperty('--lin', `${rowH}px`);

    const vaga = (dia, ini, dur) => ({
      x: celas.x + dia * colW + 2,
      y: celas.y + (ini - HORA_INICIAL) * rowH + 2,
      w: colW - 4,
      h: dur * rowH - 4,
    });
    SEMANA.forEach(([dia, ini, dur], k) => {
      const v = vaga(dia, ini, dur);
      Object.assign(el.ags[k].style, {
        left: `${v.x - celas.x}px`,
        top: `${v.y - celas.y}px`,
        width: `${v.w}px`,
        height: `${v.h}px`,
      });
    });
    Object.assign(el.coluna.style, { left: `${NOVO.dia * colW}px`, width: `${colW}px` });

    const folha = caixa(el.folha, base);
    const balaoW = el.balao.offsetWidth;
    const balaoH = el.balao.offsetHeight;
    const alvo = vaga(NOVO.dia, NOVO.hora, NOVO.duracao);
    const balao = {
      x: Math.max(8, Math.min(w - balaoW - 8, alvo.x + alvo.w / 2 - balaoW / 2)),
      y: alvo.y - balaoH - 10,
    };
    el.balao.style.left = `${balao.x}px`;
    el.balao.style.top = `${balao.y}px`;
    const cancelar = caixa(el.cancelar, base); // o balão já está no lugar

    m = {
      w,
      h,
      folhaDesce: h - folha.y + 24,
      novo: caixa(el.novo, base),
      campos: el.campos.map((c) => caixa(c, base)),
      agendar: caixa(el.agendar, base),
      alvo,
      cancelar,
    };
    pintar(tempo);
  }

  function posicionar(e, c) {
    Object.assign(e.style, { left: `${c.x}px`, top: `${c.y}px`, width: `${c.w}px`, height: `${c.h}px` });
  }

  /** O caminho do dedo: uma lista de [tempo, ponto], com deslizes suaves entre eles. */
  function dedo(t) {
    const repouso = [m.w * 0.8, m.h * 0.58];
    const pontos = [
      [0, repouso],
      [T.dedoNovo[0], repouso],
      [T.dedoNovo[1], centro(m.novo)],
      [T.campos[0][0] - 0.05, centro(m.novo)],
      [T.campos[0][0], centro(m.campos[0])],
      [T.campos[1][0] - 0.05, centro(m.campos[0])],
      [T.campos[1][0], centro(m.campos[1])],
      [T.campos[2][0] - 0.05, centro(m.campos[1])],
      [T.campos[2][0], centro(m.campos[2])],
      [T.dedoAgendar[0], centro(m.campos[2])],
      [T.dedoAgendar[1], centro(m.agendar)],
      [T.dedoCard[0], centro(m.agendar)],
      [T.dedoCard[1], centro(m.alvo)],
      [T.dedoCancelar[0], centro(m.alvo)],
      [T.dedoCancelar[1], centro(m.cancelar)],
      [T.dedoVolta[0], centro(m.cancelar)],
      [T.dedoVolta[1], repouso],
      [DURA, repouso],
    ];
    // Os campos descem com a folha: o dedo os acompanha enquanto ela sobe.
    const subida = 1 - suave(trecho(t, T.folhaSobe));
    for (let k = 1; k < pontos.length; k++) {
      const [tb, b] = pontos[k];
      if (t > tb) continue;
      const [ta, a] = pontos[k - 1];
      const u = suave(lim((t - ta) / Math.max(0.001, tb - ta)));
      let y = entre(a[1], b[1], u);
      if (t < T.dedoAgendar[1] && t > T.folhaSobe[0] && k >= 4) y += subida * m.folhaDesce;
      return [entre(a[0], b[0], u), y];
    }
    return repouso;
  }

  function toque(t) {
    for (const q of [T.toqueNovo, T.toqueAgendar, T.toqueCard, T.toqueCancelar]) {
      const u = (t - q + 0.06) / 0.5;
      if (u >= 0 && u <= 1) return u;
    }
    return -1;
  }

  function pintar(t) {
    if (!m) return;

    // O botão de novo agendamento afunda quando o dedo toca.
    const apertoNovo = pulso(t, [T.toqueNovo - 0.06, T.toqueNovo + 0.14], 0.08);
    el.novo.style.transform = `scale(${1 - 0.05 * apertoNovo})`;

    // A folha de cadastro sobe e desce.
    const aberta = t < T.folhaDesce[0] ? suave(trecho(t, T.folhaSobe)) : 1 - suave(trecho(t, T.folhaDesce));
    el.folha.style.transform = `translateY(${((1 - aberta) * m.folhaDesce).toFixed(1)}px)`;
    el.folha.style.visibility = aberta > 0.001 ? 'visible' : 'hidden';
    el.veu.style.opacity = (aberta * 0.55).toFixed(3);

    // Os campos se preenchem um a um.
    CAMPOS.forEach(([, valor], k) => {
      const [chega, ini, fim] = T.campos[k];
      const n = Math.round(valor.length * lim((t - ini) / (fim - ini)));
      const texto = t < T.folhaSobe[0] ? '' : valor.slice(0, n);
      if (el.valores[k].textContent !== texto) el.valores[k].textContent = texto;
      el.campos[k].classList.toggle('em-foco', t >= chega && t < (T.campos[k + 1]?.[0] ?? T.dedoAgendar[0]));
    });

    // O botão Agendar afunda e vira o card.
    const apertoAgendar = pulso(t, [T.toqueAgendar - 0.06, T.toqueAgendar + 0.12], 0.07);
    el.agendar.style.transform = `scale(${1 - 0.04 * apertoAgendar})`;
    el.agendar.style.opacity = t >= T.voo[0] ? 0 : 1;

    // O voo: do botão até o dia do agendamento na agenda.
    const vivo = t >= T.voo[0] && t < T.some[1];
    el.voo.style.visibility = vivo ? 'visible' : 'hidden';
    if (vivo) {
      const u = suave(trecho(t, T.voo));
      const de = m.agendar;
      const para = m.alvo;
      const arco = Math.sin(Math.PI * u) * Math.min(60, m.w * 0.12);
      const c = {
        x: entre(de.x, para.x, u) + arco,
        y: entre(de.y, para.y, u),
        w: entre(de.w, para.w, u),
        h: entre(de.h, para.h, u),
      };
      // Pousa com um respiro, e some encolhendo.
      const pouso = trecho(t, T.pouso);
      const respiro = Math.sin(Math.PI * pouso) * 0.06;
      const some = sai(trecho(t, T.some));
      posicionar(el.voo, c);
      el.voo.style.transform = `scale(${(1 + respiro) * (1 - 0.35 * some)})`;
      el.voo.style.opacity = (1 - some).toFixed(3);
      el.voo.style.borderRadius = `${entre(999, 7, sai(u)).toFixed(1)}px`;

      const cancela = suave(trecho(t, T.cancela));
      const fundo = cancela > 0 ? mistura(COR.vinho900, COR.telha900, cancela) : mistura(COR.vinho400, COR.vinho900, u);
      const borda = cancela > 0 ? mistura(COR.oliva500, COR.telha400, cancela) : mistura(COR.vinho400, COR.oliva500, u);
      el.voo.style.background = fundo;
      el.voo.style.borderLeftColor = borda;
      el.voo.style.borderLeftWidth = `${entre(0, 3, u).toFixed(2)}px`;
      el.vooBotao.style.opacity = (1 - lim(u * 2.2)).toFixed(3);
      el.vooCard.style.opacity = (lim(u * 2 - 0.9) * (1 - cancela)).toFixed(3);
      el.vooCancelado.style.opacity = cancela.toFixed(3);
      el.voo.style.boxShadow = `0 ${entre(10, 0, u).toFixed(1)}px ${entre(26, 0, u).toFixed(1)}px rgb(0 0 0 / ${entre(0.45, 0, u).toFixed(2)})`;
    }

    // A coluna do dia acende quando o card chega e quando ele sai.
    const coluna = Math.max(pulso(t, [T.voo[1] - 0.3, T.avisoCriado[1]], 0.3), 0.6 * pulso(t, T.avisoCancelado, 0.3));
    el.coluna.style.opacity = (coluna * 0.6).toFixed(3);
    el.dias[NOVO.dia].classList.toggle('aceso', coluna > 0.3);

    // O balão do card, com o botão de cancelar.
    const balao = t < T.balaoFecha[0] ? sai(trecho(t, T.balaoAbre)) : 1 - sai(trecho(t, T.balaoFecha));
    el.balao.style.opacity = balao.toFixed(3);
    el.balao.style.visibility = balao > 0.001 ? 'visible' : 'hidden';
    el.balao.style.transform = `translateY(${((1 - balao) * 8).toFixed(1)}px) scale(${(0.96 + 0.04 * balao).toFixed(3)})`;
    const apertoCancelar = pulso(t, [T.toqueCancelar - 0.06, T.toqueCancelar + 0.12], 0.07);
    el.cancelar.style.transform = `scale(${1 - 0.05 * apertoCancelar})`;

    // Os avisos de cima.
    const criado = pulso(t, T.avisoCriado);
    const cancelado = pulso(t, T.avisoCancelado);
    const aviso = Math.max(criado, cancelado);
    const textoAviso = cancelado > 0 ? 'Agendamento cancelado' : 'Agendamento criado';
    if (el.aviso.textContent !== textoAviso) el.aviso.textContent = textoAviso;
    el.aviso.classList.toggle('perigo', cancelado > 0);
    el.aviso.style.opacity = aviso.toFixed(3);
    el.aviso.style.transform = `translate(-50%, ${((1 - aviso) * -10).toFixed(1)}px)`;

    // O dedo e o anel do toque.
    el.dedo.style.visibility = semDedo ? 'hidden' : 'visible';
    if (!semDedo) {
      const [x, y] = dedo(t);
      const q = toque(t);
      el.dedo.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${q >= 0 ? 1 - 0.18 * Math.sin(Math.PI * Math.min(1, q * 2.5)) : 1})`;
      el.dedo.style.setProperty('--anel', q >= 0 ? q.toFixed(3) : '0');
      el.dedo.style.setProperty('--anel-op', q >= 0 ? (1 - q).toFixed(3) : '0');
      const parado = t < T.dedoNovo[0] || t > T.dedoVolta[1];
      el.dedo.style.opacity = parado ? '0.45' : '0.95';
    }
  }

  return {
    medir,
    quadro(dt) {
      if (!m || raiz.clientWidth !== m.w || raiz.clientHeight !== m.h) medir();
      semDedo = false;
      tempo = (tempo + dt) % DURA;
      pintar(tempo);
    },
    parado() {
      // O quadro parado: o agendamento já na agenda, sem o dedo.
      semDedo = true;
      tempo = T.avisoCriado[0] + 0.5;
      if (!m) medir();
      else pintar(tempo);
    },
  };
}
