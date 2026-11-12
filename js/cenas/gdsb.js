// GDSB: o cofre trancado é só texto cifrado. A digital abre, as entradas aparecem, uma senha
// é copiada e some, e o cofre se tranca sozinho de novo.

const ENTRADAS = ['E-mail', 'Banco', 'Wi-Fi de casa', 'Loja online', 'Streaming'];
const HEX = '0123456789ABCDEF';
const FASES = [
  ['trancado', 2.4],
  ['abrindo', 1.0],
  ['aberto', 5.4],
  ['trancando', 0.7],
];

const MARCA = `<svg viewBox="14 8 100 100" aria-hidden="true">
  <path d="M83.2 27.6A24 24 0 1 0 84.1 55.1V45H71" fill="none" stroke="#D936D3" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" fill="#FCFCFC" d="M22 64h84a42 42 0 0 1-84 0zM56 79a8 8 0 1 1 16 0 8 8 0 1 1-16 0zM60.5 86.5C54 90.5 55 97 61 100.5l3.5-2C60 96 59.5 92 64 88.500z"/>
</svg>`;
const DIGITAL = `<svg viewBox="0 0 48 48" aria-hidden="true">
  <path d="M14 40c-3-7-4-13-2-18a12.5 12.5 0 0 1 24 4c.5 5 1.5 9 3 12M19 42c-2-7-3.5-13-1.5-17a7 7 0 0 1 13.5 2c.5 6 1.5 10 3 14M24 27c0 6 1 11 3 16M9 31c-.5-4 0-8 1.5-11M15 10a17 17 0 0 1 24 7"/>
</svg>`;

const cifra = (n) => Array.from({ length: n }, () => HEX[(Math.random() * 16) | 0]).join('');

export function cenaGdsb(tela) {
  tela.classList.add('cena-gdsb');
  tela.innerHTML = `
    <div class="cofre" data-fase="trancado" aria-hidden="true">
      <div class="cofre-topo">${MARCA}<span class="cofre-arquivo">cofre.GDSBX</span><span class="cofre-estado"></span></div>
      <ul class="cofre-lista">
        ${ENTRADAS.map((e) => `<li><i>${e[0]}</i><span class="cofre-nome"></span><span class="cofre-senha"></span><em>copiada</em></li>`).join('')}
      </ul>
      <div class="cofre-digital">${DIGITAL}<span></span></div>
    </div>`;
  const cofre = tela.firstElementChild;
  const estado = cofre.querySelector('.cofre-estado');
  const dica = cofre.querySelector('.cofre-digital span');
  const linhas = [...cofre.querySelectorAll('li')].map((li, k) => ({
    li,
    nome: li.querySelector('.cofre-nome'),
    senha: li.querySelector('.cofre-senha'),
    texto: ENTRADAS[k],
  }));

  let fase = 0;
  let tempo = 0;
  let tique = 0;

  function entrar(f) {
    fase = f;
    tempo = 0;
    const nome = FASES[f][0];
    cofre.dataset.fase = nome;
    const aberto = nome === 'aberto' || nome === 'abrindo';
    estado.textContent = aberto ? 'Aberto' : 'Trancado';
    dica.textContent = aberto ? 'tranca sozinho' : 'digital ou senha mestra';
    linhas.forEach((l) => l.li.classList.remove('copiada'));
  }

  /** u = 0: tudo cifrado. u = 1: tudo às claras. */
  function escrever(u) {
    for (const l of linhas) {
      const n = Math.round(l.texto.length * u);
      l.nome.textContent = l.texto.slice(0, n) + cifra(u >= 1 ? 0 : Math.max(2, 12 - n));
      l.senha.textContent = u >= 1 ? '••••••••' : cifra(8);
    }
  }

  function quadro(dt) {
    tempo += dt;
    const [nome, dura] = FASES[fase];
    if (tempo >= dura) entrar((fase + 1) % FASES.length);
    else if (nome === 'aberto') linhas[1].li.classList.toggle('copiada', tempo > 1.6 && tempo < 3.6);

    // O texto cifrado troca umas vinte vezes por segundo, não a cada quadro.
    tique += dt;
    if (tique < 0.05) return;
    tique = 0;
    const agora = FASES[fase][0];
    const u = Math.min(1, tempo / FASES[fase][1]);
    if (agora === 'trancado') escrever(0);
    else if (agora === 'abrindo') escrever(u);
    else if (agora === 'trancando') escrever(1 - u);
    else if (linhas[0].nome.textContent !== linhas[0].texto || linhas[0].senha.textContent[0] !== '•') escrever(1);
  }

  // Tocar ou passar o mouse no cofre trancado abre na hora.
  tela.addEventListener('pointerenter', () => FASES[fase][0] === 'trancado' && entrar(1));

  entrar(0);
  escrever(0);
  return {
    medir() {},
    quadro,
    parado() {
      entrar(2);
      escrever(1);
    },
  };
}
