// O motor da tinta: partículas na GPU (WebGL2, sem bibliotecas).
//
// Cada partícula tem posição e velocidade, simuladas com transform feedback. Uma mola a
// puxa para o alvo da cena atual, um campo de fluxo a leva durante as transições e o
// ponteiro a empurra. Tudo é desenhado num acumulador que apaga aos poucos, o que deixa
// rastro de luz, e depois passa por um brilho barato e pela composição com o papel.

const NOISE = `
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 m289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return m289(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=m289(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;
  vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}`;

const VS_ATUALIZA = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;
layout(location=0) in vec4 aEstado;
layout(location=1) in vec4 aSemente;
uniform sampler2DArray uAlvos;
uniform int uLado,uCenaA,uCenaB;
uniform float uMix,uT,uDt,uEscrita,uSnap,uFluxo,uBoil,uMola,uAtrito,uCortina;
uniform vec2 uOffA,uOffB,uRato,uRatoV,uTela;
uniform float uRatoR,uRatoF;
uniform vec4 uOlhoA,uOlhoB; // centro da íris, raio, meia largura do olho
uniform vec3 uLidA,uLidB;   // centro das pálpebras, altura de cima, altura de baixo
uniform vec2 uOlhar;
uniform float uPupila,uPiscar;
out vec4 vEstado;
${NOISE}
vec2 curl(vec2 p){
  const float e=.35;
  float n=snoise(p);
  return vec2(snoise(p+vec2(0.,e))-n,-(snoise(p+vec2(e,0.))-n))/e;
}
void main(){
  ivec2 c=ivec2(gl_VertexID%uLado,gl_VertexID/uLado);
  vec4 a=texelFetch(uAlvos,ivec3(c,uCenaA),0);
  vec4 b=texelFetch(uAlvos,ivec3(c,uCenaB),0);
  float s=aSemente.x;
  float m=smoothstep(s*.55,s*.55+.45,uMix);
  vec2 alvo=mix(a.xy+uOffA,b.xy+uOffB,m);
  float tipo=m<.5?a.w:b.w;
  float fase=m<.5?a.z:b.z;

  // Só a palavra é escrita: antes da hora, a partícula fica solta pela tela.
  float ativo=1.;
  if(uCenaA==0&&m<.5){
    ativo=smoothstep(a.z,a.z+.012,uEscrita);
    alvo=mix(aSemente.yz*uTela,alvo,ativo);
  }
  if(tipo>1.5&&tipo<2.5){ // brasa: sobe e recomeça
    float sobe=mod(uT*(16.+46.*aSemente.y)+fase*400.,150.);
    alvo.y-=sobe; alvo.x+=sin(uT*1.6+fase*40.)*sobe*.12;
  }else if(tipo>2.5&&tipo<3.5){ // bruma: deriva devagar
    alvo+=vec2(sin(uT*.17+fase*40.),cos(uT*.13+fase*70.))*(22.+40.*aSemente.w);
  }else if(tipo>4.5&&tipo<5.5){ // linha da cortina
    alvo.x=uCortina;
  }else if(tipo>5.5){
    vec4 ol=m<.5?uOlhoA:uOlhoB;
    vec3 la=m<.5?uLidA:uLidB;
    if(tipo<6.5){ // íris: as fibras encolhem e esticam com a pupila
      vec2 dc=alvo-ol.xy;
      float lc=max(length(dc),.001);
      float n=uPupila+(lc/ol.z-.34)/.66*(1.-uPupila);
      alvo=ol.xy+dc/lc*n*ol.z+uOlhar*ol.z;
    }else if(tipo<7.5){ // pálpebra de cima: desce ao piscar
      float u=(alvo.x-ol.x)/ol.w;
      alvo.y+=uPiscar*(la.y+la.z)*max(0.,1.-u*u)*(1.+.2*u);
    }else if(tipo<8.5){ // o brilho anda com o olhar, um pouco menos que a íris
      alvo+=uOlhar*ol.z*.8;
    }
  }
  // Tremido de desenho animado à mão: a linha muda poucas vezes por segundo.
  float q=floor(uT*7.);
  vec2 tre=vec2(sin(dot(alvo,vec2(.041,.067))+q*2.399),cos(dot(alvo,vec2(.053,.031))+q*1.731));
  alvo+=tre*uBoil;

  if(uSnap>.5){vEstado=vec4(alvo,0.,0.);return;}

  vec2 p=aEstado.xy,v=aEstado.zw;
  float dt=uDt;
  float solto=4.*m*(1.-m);
  float folga=max(solto,1.-ativo);
  v+=curl(p*.0024+vec2(uT*.05,-uT*.03))*(uFluxo+folga*1500.)*dt;
  vec2 d=p-uRato;
  float r2=dot(d,d);
  float f=exp(-r2/(uRatoR*uRatoR))*uRatoF;
  // Tinta em movimento demora a voltar: é o borrão que fica atrás do ponteiro.
  float pressa=clamp(length(v)/420.,0.,1.);
  float k=uMola*(.7+.6*aSemente.y)*mix(1.,.06,folga)*mix(1.,.16,max(pressa,f));
  v+=(alvo-p)*k*dt;
  if(f>.001){
    vec2 n=d/max(sqrt(r2),1.);
    v+=(n*1500.+vec2(-n.y,n.x)*1200.+uRatoV*4.)*f*dt;
  }
  v*=exp(-uAtrito*dt);
  p+=v*dt;
  if(tipo>4.5&&tipo<5.5&&solto<.02){p.x=uCortina;} // a linha da cortina não fica para trás nem treme
  vEstado=vec4(p,v);
}`;

const FS_NADA = `#version 300 es
precision mediump float;out vec4 o;void main(){o=vec4(0.);}`;

const VS_PONTOS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;
layout(location=0) in vec4 aEstado;
layout(location=1) in vec4 aSemente;
uniform sampler2DArray uAlvos;
uniform lowp sampler2DArray uCores;
uniform int uLado,uCenaA,uCenaB;
uniform float uMix,uT,uEscrita,uPonto,uGanho,uCortina;
uniform vec3 uQuente,uIris,uLidA,uLidB;
uniform vec4 uOlhoA,uOlhoB;
uniform vec2 uTela;
uniform float uPiscar,uFaixa;
out vec3 vCor;
void main(){
  ivec2 c=ivec2(gl_VertexID%uLado,gl_VertexID/uLado);
  float s=aSemente.x;
  float m=smoothstep(s*.55,s*.55+.45,uMix);
  vec4 ca=texelFetch(uCores,ivec3(c,uCenaA),0);
  vec4 cb=texelFetch(uCores,ivec3(c,uCenaB),0);
  vec4 pa=texelFetch(uAlvos,ivec3(c,uCenaA),0);
  vec4 pb=texelFetch(uAlvos,ivec3(c,uCenaB),0);
  vec4 cor=mix(ca,cb,m);
  float tipo=m<.5?pa.w:pb.w;
  float fase=m<.5?pa.z:pb.z;
  vec2 p=aEstado.xy;
  float e=clamp(length(aEstado.zw)/520.,0.,1.);
  float brilho=cor.a;
  vec3 base=cor.rgb;

  if(tipo>.5&&tipo<1.5){ // pulso que corre pelo traço
    float o=pow(.5+.5*sin(fase*26.-uT*2.2),10.);
    brilho*=.55+3.2*o;
  }else if(tipo>1.5&&tipo<2.5){ // brasa apaga enquanto sobe
    float sobe=mod(uT*(16.+46.*aSemente.y)+fase*400.,150.)/150.;
    brilho*=(1.-sobe)*(1.-sobe)*(.4+1.4*aSemente.w);
  }else if(tipo>2.5&&tipo<3.5){ // bruma cintila
    brilho*=.6+.4*sin(uT*.8+fase*50.);
  }
  if((tipo>3.5&&tipo<4.5)||tipo>5.5){ // o que está na foto
    if(tipo>5.5&&tipo<6.5) base=uIris*cor.rgb;
    if(tipo>7.5&&tipo<8.5){ // brilho no olhar
      float o=sin(uT*1.7+fase*2.)*.5+.5;
      brilho*=.55+1.1*o*o;
    }
    if(tipo>5.5&&abs(tipo-7.)>.5){ // íris e branco do olho ficam entre as pálpebras
      vec4 ol=m<.5?uOlhoA:uOlhoB;
      vec3 la=m<.5?uLidA:uLidB;
      float u=(p.x-ol.x)/ol.w;
      float cv=max(0.,1.-u*u)*(1.+.2*u);
      float inc=-.07*u*ol.w;
      float topo=la.x+inc-la.y*cv+uPiscar*(la.y+la.z)*cv;
      float baixo=la.x+inc+la.z*cv;
      brilho*=smoothstep(topo-1.,topo+1.,p.y)*smoothstep(baixo+1.,baixo-1.,p.y);
      brilho*=mix(.3,1.,smoothstep(topo,topo+ol.z*.42,p.y)); // sombra da pálpebra na íris
    }
    float d=smoothstep(-5.,5.,p.x-uCortina); // antes e depois
    float cinza=dot(base,vec3(.3,.59,.11));
    base=mix(vec3(cinza)*vec3(.82,.88,1.),base,d);
    brilho*=mix(.55,1.12,d);
    float fx=(p.x+p.y*.25-uFaixa)/44.; // a luz fria que mostra onde o pincel alcança
    float fb=exp(-fx*fx);
    base=mix(base,vec3(.7,.86,1.),fb*.85);
    brilho*=1.+fb*1.7;
  }
  if(uCenaA==0&&m<.5){
    // Durante a escrita, só acende o que já chegou perto da caneta. A tempestade fica ao fundo.
    float nasceu=smoothstep(pa.z,pa.z+.012,uEscrita);
    if(uEscrita<1.4){nasceu*=mix(.05,1.,smoothstep(240.,24.,distance(p,pa.xy)));}
    brilho*=mix(.012,1.,nasceu);
    e*=mix(.25,1.,nasceu);
  }
  vCor=mix(base,uQuente,e)*(brilho*(1.+e*1.3))*uGanho;
  gl_PointSize=uPonto*(.65+.8*aSemente.z)*(1.+e*.5);
  vec2 clip=p/uTela*2.-1.;
  gl_Position=vec4(clip.x,-clip.y,0.,1.);
}`;

const FS_PONTOS = `#version 300 es
precision mediump float;
in vec3 vCor;out vec4 o;
void main(){
  float d=length(gl_PointCoord-.5)*2.;
  float a=1.-smoothstep(.1,1.,d);
  o=vec4(vCor*a,1.);
}`;

const VS_TELA = `#version 300 es
out vec2 vUv;
void main(){
  vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
  vUv=p;gl_Position=vec4(p*2.-1.,0.,1.);
}`;

const FS_APAGA = `#version 300 es
precision mediump float;
in vec2 vUv;out vec4 o;uniform sampler2D uTex;uniform float uFade;
void main(){o=vec4(texture(uTex,vUv).rgb*uFade,1.);}`;

const FS_COPIA = `#version 300 es
precision mediump float;
in vec2 vUv;out vec4 o;uniform sampler2D uTex;
void main(){o=vec4(texture(uTex,vUv).rgb,1.);}`;

const FS_BORRA = `#version 300 es
precision mediump float;
in vec2 vUv;out vec4 o;uniform sampler2D uTex;uniform vec2 uDir;
void main(){
  vec3 c=texture(uTex,vUv).rgb*.227;
  c+=(texture(uTex,vUv+uDir*1.385).rgb+texture(uTex,vUv-uDir*1.385).rgb)*.316;
  c+=(texture(uTex,vUv+uDir*3.231).rgb+texture(uTex,vUv-uDir*3.231).rgb)*.07;
  o=vec4(c,1.);
}`;

const FS_COMPOE = `#version 300 es
precision highp float;
in vec2 vUv;out vec4 o;
uniform sampler2D uTinta,uBrilho1,uBrilho2;
uniform vec3 uPapel,uLuzRato;
uniform vec2 uRato,uRes;
uniform float uDpr,uGrade,uPapelY,uRatoF,uExpo,uHalo;
void main(){
  vec3 tinta=texture(uTinta,vUv).rgb;
  vec3 b1=texture(uBrilho1,vUv).rgb;
  vec3 b2=texture(uBrilho2,vUv).rgb;
  vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;

  // O papel quadriculado só aparece onde há luz: a do ponteiro ou a da própria tinta.
  vec2 cel=px+vec2(0.,uPapelY);
  vec2 g=abs(fract(cel/30.-.5)-.5)*30.;
  float linha=1.-smoothstep(0.,1.1,min(g.x,g.y));
  vec2 dr=px-uRato;
  float lampada=exp(-dot(dr,dr)/(200.*200.))*uRatoF;
  float luzTinta=(dot(b2,vec3(.33))*1.5+dot(b1,vec3(.33))*.5)*uHalo;
  vec3 papel=uPapel;
  papel+=uLuzRato*lampada*.028;
  papel+=uGrade*linha*(.012+lampada*.09+luzTinta*.3)*vec3(.74,.8,.68);

  vec3 luz=tinta*1.15+(b1*.75+b2*.85)*uHalo;
  luz=1.-exp(-luz*uExpo);
  vec3 c=papel+luz;
  float h=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  o=vec4(c+(h-.5)/255.*1.6,1.);
}`;

function compilar(gl, tipo, src) {
  const s = gl.createShader(tipo);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function programa(gl, vs, fs, saidas) {
  const p = gl.createProgram();
  gl.attachShader(p, compilar(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compilar(gl, gl.FRAGMENT_SHADER, fs));
  if (saidas) gl.transformFeedbackVaryings(p, saidas, gl.SEPARATE_ATTRIBS);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const nome = gl.getActiveUniform(p, i).name;
    u[nome] = gl.getUniformLocation(p, nome);
  }
  return { p, u };
}

export function criarTinta(canvas, { particulas, dprMax }) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const flutua = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));

  let atualiza;
  let pontos;
  let apaga;
  let copia;
  let borra;
  let compoe;
  try {
    atualiza = programa(gl, VS_ATUALIZA, FS_NADA, ['vEstado']);
    pontos = programa(gl, VS_PONTOS, FS_PONTOS);
    apaga = programa(gl, VS_TELA, FS_APAGA);
    copia = programa(gl, VS_TELA, FS_COPIA);
    borra = programa(gl, VS_TELA, FS_BORRA);
    compoe = programa(gl, VS_TELA, FS_COMPOE);
  } catch (erro) {
    console.warn('tinta:', erro.message);
    return null;
  }

  const N = particulas;
  const lado = Math.ceil(Math.sqrt(N));
  let visiveis = N;

  // Estado inicial: partículas soltas. O tamanho da tela só chega em redimensionar().
  const sementes = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) sementes[i] = Math.random();
  const bufSemente = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufSemente);
  gl.bufferData(gl.ARRAY_BUFFER, sementes, gl.STATIC_DRAW);

  const bufEstado = [gl.createBuffer(), gl.createBuffer()];
  const vaos = bufEstado.map((b) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, N * 16, gl.DYNAMIC_COPY);
    const v = gl.createVertexArray();
    gl.bindVertexArray(v);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufSemente);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return v;
  });
  const vaoVazio = gl.createVertexArray();
  const tf = gl.createTransformFeedback();
  let atual = 0;

  let texAlvos = null;
  let texCores = null;
  let metas = [];

  /** desenhos: lista de Desenho, um por camada. */
  function definirCenas(desenhos) {
    if (texAlvos) gl.deleteTexture(texAlvos);
    if (texCores) gl.deleteTexture(texCores);
    const L = desenhos.length;
    texAlvos = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texAlvos);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA32F, lado, lado, L);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    texCores = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texCores);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, lado, lado, L);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const pos = new Float32Array(lado * lado * 4);
    const cor = new Uint8Array(lado * lado * 4);
    metas = desenhos.map((d, camada) => {
      d.escrever(N, pos, cor);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, texAlvos);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, camada, lado, lado, 1, gl.RGBA, gl.FLOAT, pos);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, texCores);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, camada, lado, lado, 1, gl.RGBA, gl.UNSIGNED_BYTE, cor);
      return d.meta;
    });
  }

  // Alvos de render
  function criarAlvo(w, h, filtro = gl.LINEAR) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, flutua ? gl.RGBA16F : gl.RGBA8, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { t, f, w, h };
  }
  function soltarAlvo(a) {
    if (!a) return;
    gl.deleteTexture(a.t);
    gl.deleteFramebuffer(a.f);
  }

  let tinta = [null, null];
  let b1 = [null, null];
  let b2 = [null, null];
  let largura = 1;
  let altura = 1;
  let dpr = 1;
  let iniciado = false;

  function redimensionar(w, h, dprPedido) {
    dpr = Math.min(dprPedido, dprMax);
    largura = w;
    altura = h;
    const pw = Math.max(2, Math.round(w * dpr));
    const ph = Math.max(2, Math.round(h * dpr));
    canvas.width = pw;
    canvas.height = ph;
    [...tinta, ...b1, ...b2].forEach(soltarAlvo);
    tinta = [criarAlvo(pw, ph), criarAlvo(pw, ph)];
    const w1 = Math.max(2, pw >> 2);
    const h1 = Math.max(2, ph >> 2);
    b1 = [criarAlvo(w1, h1), criarAlvo(w1, h1)];
    const w2 = Math.max(2, pw >> 4);
    const h2 = Math.max(2, ph >> 4);
    b2 = [criarAlvo(w2, h2), criarAlvo(w2, h2)];

    if (!iniciado) {
      iniciado = true;
      const est = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) {
        est[i * 4] = sementes[i * 4 + 1] * w;
        est[i * 4 + 1] = sementes[i * 4 + 2] * h;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, bufEstado[atual]);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, est);
      gl.bindBuffer(gl.ARRAY_BUFFER, null); // preso aqui, o transform feedback recusa o buffer
    }
  }

  function tela(alvo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, alvo ? alvo.f : null);
    gl.viewport(0, 0, alvo ? alvo.w : canvas.width, alvo ? alvo.h : canvas.height);
    gl.bindVertexArray(vaoVazio);
  }
  function textura(unidade, t, loc) {
    gl.activeTexture(gl.TEXTURE0 + unidade);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.uniform1i(loc, unidade);
  }
  function borrar(par, fonte, raio) {
    gl.useProgram(copia.p);
    tela(par[0]);
    textura(0, fonte.t, copia.u.uTex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(borra.p);
    tela(par[1]);
    textura(0, par[0].t, borra.u.uTex);
    gl.uniform2f(borra.u.uDir, raio / par[0].w, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    tela(par[0]);
    textura(0, par[1].t, borra.u.uTex);
    gl.uniform2f(borra.u.uDir, 0, raio / par[0].h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /**
   * q: { dt, t, cenaA, cenaB, mix, offA, offB, escrita, rato, ratoV, ratoF, papelY, cortina, snap,
   *     olhar, pupila, piscar, iris, faixa }
   */
  function quadro(q) {
    const ma = metas[q.cenaA];
    const mb = metas[q.cenaB];
    const mx = q.mix;
    const lerp = (a, b) => a.map((v, i) => v + (b[i] - v) * mx);
    const lerp1 = (a, b) => a + (b - a) * mx;
    const quente = lerp(ma.quente, mb.quente);
    const papel = lerp(ma.papel, mb.papel);
    const grade = lerp1(ma.grade, mb.grade);
    const halo = lerp1(ma.halo, mb.halo);
    const tremido = lerp1(ma.tremido, mb.tremido);
    const poeOlho = (u) => {
      const [a, b] = [ma.olho, mb.olho];
      gl.uniform4fv(u.uOlhoA, a ? a.geo : [0, 0, 1, 1]);
      gl.uniform4fv(u.uOlhoB, b ? b.geo : [0, 0, 1, 1]);
      gl.uniform3fv(u.uLidA, a ? a.lid : [0, 0, 0]);
      gl.uniform3fv(u.uLidB, b ? b.lid : [0, 0, 0]);
      gl.uniform1f(u.uPiscar, q.piscar);
    };

    // 1. Física
    const prox = 1 - atual;
    gl.useProgram(atualiza.p);
    const u = atualiza.u;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texAlvos);
    gl.uniform1i(u.uAlvos, 0);
    gl.uniform1i(u.uLado, lado);
    gl.uniform1i(u.uCenaA, q.cenaA);
    gl.uniform1i(u.uCenaB, q.cenaB);
    gl.uniform1f(u.uMix, mx);
    gl.uniform1f(u.uT, q.t);
    gl.uniform1f(u.uDt, q.dt);
    gl.uniform1f(u.uEscrita, q.escrita);
    gl.uniform1f(u.uSnap, q.snap ? 1 : 0);
    gl.uniform1f(u.uFluxo, 22);
    gl.uniform1f(u.uBoil, q.snap ? 0 : tremido);
    gl.uniform1f(u.uMola, 62);
    gl.uniform1f(u.uAtrito, 9.5);
    gl.uniform1f(u.uCortina, q.cortina);
    gl.uniform2f(u.uOffA, q.offA[0], q.offA[1]);
    gl.uniform2f(u.uOffB, q.offB[0], q.offB[1]);
    gl.uniform2f(u.uRato, q.rato[0], q.rato[1]);
    gl.uniform2f(u.uRatoV, q.ratoV[0], q.ratoV[1]);
    gl.uniform2f(u.uTela, largura, altura);
    gl.uniform1f(u.uRatoR, Math.max(70, Math.min(largura, altura) * 0.12));
    gl.uniform1f(u.uRatoF, q.ratoF);
    poeOlho(u);
    gl.uniform2f(u.uOlhar, q.olhar[0], q.olhar[1]);
    gl.uniform1f(u.uPupila, q.pupila);

    gl.bindVertexArray(vaos[atual]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, bufEstado[prox]);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, visiveis);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null);
    atual = prox;

    // 2. Rastro: o quadro anterior, um pouco mais apagado
    const usaRastro = flutua && !q.snap;
    const fade = usaRastro ? Math.pow(0.8, q.dt * 60) : 0;
    const dest = tinta[1];
    gl.useProgram(apaga.p);
    tela(dest);
    textura(0, tinta[0].t, apaga.u.uTex);
    gl.uniform1f(apaga.u.uFade, fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 3. Partículas
    gl.useProgram(pontos.p);
    const p = pontos.u;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texAlvos);
    gl.uniform1i(p.uAlvos, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texCores);
    gl.uniform1i(p.uCores, 1);
    gl.uniform1i(p.uLado, lado);
    gl.uniform1i(p.uCenaA, q.cenaA);
    gl.uniform1i(p.uCenaB, q.cenaB);
    gl.uniform1f(p.uMix, mx);
    gl.uniform1f(p.uT, q.t);
    gl.uniform1f(p.uEscrita, q.escrita);
    gl.uniform1f(p.uPonto, 2.6 * dpr);
    gl.uniform1f(p.uGanho, (1 - fade) * (N / visiveis));
    gl.uniform1f(p.uCortina, q.cortina);
    poeOlho(p);
    gl.uniform3f(p.uIris, q.iris[0], q.iris[1], q.iris[2]);
    gl.uniform1f(p.uFaixa, q.faixa);
    gl.uniform3f(p.uQuente, quente[0], quente[1], quente[2]);
    gl.uniform2f(p.uTela, largura, altura);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dest.f);
    gl.viewport(0, 0, dest.w, dest.h);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindVertexArray(vaos[atual]);
    gl.drawArrays(gl.POINTS, 0, visiveis);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    tinta = [dest, tinta[0]];

    // 4. Brilho, em duas escalas
    borrar(b1, tinta[0], 1.3);
    borrar(b2, b1[0], 1.6);

    // 5. Composição com o papel
    gl.useProgram(compoe.p);
    tela(null);
    const c = compoe.u;
    textura(0, tinta[0].t, c.uTinta);
    textura(1, b1[0].t, c.uBrilho1);
    textura(2, b2[0].t, c.uBrilho2);
    gl.uniform3f(c.uPapel, papel[0], papel[1], papel[2]);
    gl.uniform3f(c.uLuzRato, quente[0], quente[1], quente[2]);
    gl.uniform2f(c.uRato, q.rato[0], q.rato[1]);
    gl.uniform2f(c.uRes, canvas.width, canvas.height);
    gl.uniform1f(c.uDpr, dpr);
    gl.uniform1f(c.uGrade, grade);
    gl.uniform1f(c.uPapelY, q.papelY);
    gl.uniform1f(c.uRatoF, q.ratoF);
    gl.uniform1f(c.uExpo, 1.25);
    gl.uniform1f(c.uHalo, halo);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return {
    redimensionar,
    definirCenas,
    quadro,
    reduzir() {
      visiveis = Math.max(5000, Math.floor(visiveis * 0.72));
      return visiveis;
    },
    get visiveis() {
      return visiveis;
    },
    get temFlutuante() {
      return flutua;
    },
    gl,
  };
}
