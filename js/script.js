/* Imersão Reset Total — player de vídeo, abas e suporte */

/* ===== configuração ===== */
const VIDEO_SRC = encodeURI("video/Cópia de Life Reset - Transmissão ao vivo Gravada v2.mp4");
const VIEWERS     = 0;                  // número exibido ao lado do ícone de olho (0 = esconde o selo)
const MODO        = "Replay";           // texto do selo vermelho
const MENSAGENS   = [
  // formato: { autor: "Suporte Life Reset", texto: "...", staff: true }
];
const OFERTA_URL  = "https://wa.link/53l2yi";

/* ===== atalhos ===== */
const $ = id => document.getElementById(id);
const v = $('v'), stage = $('stage'), drop = $('drop'), menu = $('rateMenu');
const fill = $('fill'), buf = $('buf'), knob = $('knob'), seekInput = $('seekInput');
const volFill = $('volFill'), volKnob = $('volKnob'), volInput = $('volInput'), toast = $('toast');
let hideTimer, toastTimer;

const fmt = s => {
  if (!isFinite(s)) return '0:00';
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return h ? h + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0')
           : m + ':' + String(x).padStart(2, '0');
};
const flash = msg => {
  toast.textContent = msg; toast.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('on'), 900);
};
const swap = (on, off) => { on.classList.remove('hidden'); off.classList.add('hidden'); };

/* ===== selos ===== */
$('badgeLive').lastChild.textContent = ' ' + MODO;
if (VIEWERS > 0) $('viewers').textContent = VIEWERS.toLocaleString('pt-BR');
else $('badgeCount').classList.add('hidden');

/* ===== chat ===== */
function renderChat() {
  const box = $('msgs');
  box.innerHTML = '';
  MENSAGENS.forEach(m => {
    const el = document.createElement('div');
    el.className = 'msg' + (m.staff ? ' staff' : '');
    const who = document.createElement('span'); who.className = 'who'; who.textContent = m.autor;
    const txt = document.createElement('span'); txt.className = 'txt'; txt.textContent = m.texto;
    el.append(who, txt);
    box.appendChild(el);
  });
  box.scrollTop = box.scrollHeight;
}
renderChat();

/* foto do suporte: se o arquivo não existir, mostra as iniciais */
$('supPhoto').addEventListener('error', () => $('supPhoto').parentElement.classList.add('noimg'));

$('tabChat').addEventListener('click', () => switchTab(true));
$('tabSup').addEventListener('click', () => switchTab(false));
function switchTab(chat) {
  $('tabChat').setAttribute('aria-selected', String(chat));
  $('tabSup').setAttribute('aria-selected', String(!chat));
  $('panelChat').hidden = !chat;
  $('panelSup').hidden = chat;
  $('note').style.visibility = chat ? 'visible' : 'hidden';
}

/* ===== fonte única e fixa ===== */
v.src = VIDEO_SRC;
v.addEventListener('error', () => {
  drop.classList.remove('gone');   // única mensagem de falha: sem troca de arquivo
  stage.classList.remove('buffering');
});
// bloqueia arrastar outro arquivo por cima da página
['dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
// remove o menu de contexto do vídeo (evita "salvar vídeo como")
v.addEventListener('contextmenu', e => e.preventDefault());

/* ===== play / pause ===== */
const toggle = () => {
  v.paused ? v.play() : v.pause();
};
$('play').addEventListener('click', toggle);
$('bigplay').addEventListener('click', toggle);
v.addEventListener('click', toggle);
v.addEventListener('play', () => {
  stage.classList.add('playing'); swap($('iPause'), $('iPlay'));
  $('play').setAttribute('aria-label', 'Pausar (espaço)'); show();
});
v.addEventListener('pause', () => {
  stage.classList.remove('playing'); swap($('iPlay'), $('iPause'));
  $('play').setAttribute('aria-label', 'Reproduzir (espaço)'); show();
});
v.addEventListener('waiting', () => stage.classList.add('buffering'));
['playing', 'canplay', 'error'].forEach(e => v.addEventListener(e, () => stage.classList.remove('buffering')));
v.addEventListener('ended', () => { stage.classList.remove('playing'); show(); abrirOferta(); });

/* ===== progresso ===== */
const paint = () => {
  const d = v.duration || 0, p = d ? v.currentTime / d : 0;
  fill.style.width = knob.style.left = (p * 100) + '%';
  seekInput.value = Math.round(p * 1000);
  $('cur').textContent = fmt(v.currentTime);
  if (v.buffered.length && d) buf.style.width = (v.buffered.end(v.buffered.length - 1) / d * 100) + '%';
};
v.addEventListener('timeupdate', paint);
v.addEventListener('progress', paint);
v.addEventListener('loadedmetadata', () => { $('dur').textContent = fmt(v.duration); paint(); });

seekInput.addEventListener('input', () => {
  if (!v.duration) return;
  const p = seekInput.value / 1000;
  v.currentTime = p * v.duration;
  fill.style.width = knob.style.left = (p * 100) + '%';
  $('cur').textContent = fmt(v.currentTime);
});
['pointerdown', 'pointerup'].forEach(e =>
  seekInput.addEventListener(e, ev => $('seek').classList.toggle('dragging', ev.type === 'pointerdown')));

$('back').addEventListener('click', () => { v.currentTime = Math.max(0, v.currentTime - 10); flash('− 10s'); });
$('fwd').addEventListener('click', () => { v.currentTime = Math.min(v.duration || 0, v.currentTime + 10); flash('+ 10s'); });

/* ===== volume ===== */
const paintVol = () => {
  const val = v.muted ? 0 : v.volume;
  volFill.style.width = volKnob.style.left = (val * 100) + '%';
  volInput.value = Math.round(val * 100);
  (v.muted || v.volume === 0) ? swap($('iMute'), $('iVol')) : swap($('iVol'), $('iMute'));
};
volInput.addEventListener('input', () => { v.volume = volInput.value / 100; v.muted = v.volume === 0; paintVol(); });
$('mute').addEventListener('click', () => {
  v.muted = !v.muted;
  if (!v.muted && v.volume === 0) v.volume = .5;
  paintVol(); flash(v.muted ? 'mudo' : 'som ligado');
});
v.addEventListener('volumechange', paintVol);
paintVol();

/* ===== velocidade ===== */
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
RATES.forEach(r => {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('role', 'menuitemradio');
  b.textContent = (r === 1 ? 'Normal' : r + 'x');
  b.setAttribute('aria-checked', String(r === 1));
  b.addEventListener('click', () => { v.playbackRate = r; closeMenu(); });
  menu.appendChild(b);
});
const closeMenu = () => { menu.classList.remove('on'); $('rateBtn').setAttribute('aria-expanded', 'false'); };
$('rateBtn').addEventListener('click', e => {
  e.stopPropagation();
  $('rateBtn').setAttribute('aria-expanded', String(menu.classList.toggle('on')));
});
document.addEventListener('click', closeMenu);
menu.addEventListener('click', e => e.stopPropagation());
v.addEventListener('ratechange', () => {
  $('rateBtn').textContent = (v.playbackRate === 1 ? '1x' : v.playbackRate + 'x');
  [...menu.children].forEach((b, i) => b.setAttribute('aria-checked', String(RATES[i] === v.playbackRate)));
});

/* ===== tela cheia / PiP ===== */
const fsToggle = () => document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen();
$('fs').addEventListener('click', fsToggle);
v.addEventListener('dblclick', fsToggle);
document.addEventListener('fullscreenchange', () => {
  document.fullscreenElement ? swap($('iFsOff'), $('iFs')) : swap($('iFs'), $('iFsOff'));
});
if (document.pictureInPictureEnabled) {
  $('pip').addEventListener('click', () => {
    document.pictureInPictureElement ? document.exitPictureInPicture() : v.requestPictureInPicture();
  });
} else $('pip').classList.add('hidden');

/* ===== ocultar controles ===== */
function show() {
  stage.classList.remove('idle');
  clearTimeout(hideTimer);
  if (!v.paused) hideTimer = setTimeout(() => {
    if (!menu.classList.contains('on')) stage.classList.add('idle');
  }, 2600);
}
['pointermove', 'pointerdown', 'focusin'].forEach(e => stage.addEventListener(e, show));
stage.addEventListener('pointerleave', () => { if (!v.paused) stage.classList.add('idle'); });

/* ===== teclado ===== */
document.addEventListener('keydown', e => {
  // com o pop-up aberto, o teclado pertence ao pop-up
  if (!modalOferta.hidden) {
    if (e.key === 'Escape') { e.preventDefault(); fecharOferta(); }
    else if (e.key === 'Tab') {                    // mantém o foco dentro do pop-up
      const alvos = [$('ofertaFechar'), $('ofertaCta')];
      const i = alvos.indexOf(document.activeElement);
      e.preventDefault();
      alvos[(i + (e.shiftKey ? alvos.length - 1 : 1)) % alvos.length].focus();
    }
    return;
  }
  const onSlider = e.target.matches && e.target.matches('input[type=range]');
  if (onSlider && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  const k = e.key;
  if (k === ' ' || k === 'k' || k === 'K') { e.preventDefault(); toggle(); }
  else if (k === 'ArrowRight') { e.preventDefault(); v.currentTime = Math.min(v.duration || 0, v.currentTime + 10); flash('+ 10s'); }
  else if (k === 'ArrowLeft') { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10); flash('− 10s'); }
  else if (k === 'ArrowUp') { e.preventDefault(); v.muted = false; v.volume = Math.min(1, v.volume + .05); flash('volume ' + Math.round(v.volume * 100) + '%'); }
  else if (k === 'ArrowDown') { e.preventDefault(); v.volume = Math.max(0, v.volume - .05); flash('volume ' + Math.round(v.volume * 100) + '%'); }
  else if (k === 'm' || k === 'M') { $('mute').click(); }
  else if (k === 'f' || k === 'F') { fsToggle(); }
  else if (/^[0-9]$/.test(k) && v.duration) { v.currentTime = v.duration * (+k / 10); flash(k * 10 + '%'); }
  show();
});

/* ===== pop-up de oferta ao terminar o vídeo ===== */
const modalOferta = $('ofertaModal'), ofertaCta = $('ofertaCta');
let focoAnterior = null;

ofertaCta.href = OFERTA_URL || '#';
if (!OFERTA_URL) console.warn('OFERTA_URL está vazio: o botão da promoção não leva a lugar nenhum.');

function abrirOferta() {
  if (!modalOferta.hidden) return;
  // em tela cheia o pop-up ficaria atrás do vídeo: sai primeiro, exibe depois
  if (document.fullscreenElement) { document.exitFullscreen().finally(exibirOferta); return; }
  exibirOferta();
}
function exibirOferta() {
  focoAnterior = document.activeElement;
  modalOferta.hidden = false;
  document.body.classList.add('locked');
  ofertaCta.focus();
}
function fecharOferta() {
  if (modalOferta.hidden) return;
  modalOferta.hidden = true;
  document.body.classList.remove('locked');
  if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
}

$('ofertaFechar').addEventListener('click', fecharOferta);
modalOferta.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) fecharOferta(); });
