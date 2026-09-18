/* Imersão Reset Total — player do YouTube, abas e suporte */

/* ===== configuração ===== */
const VIDEO_ID   = "lzBobeS34H8";        // ID do vídeo no YouTube (a parte final de youtu.be/<ID>)
const MODO       = "Replay";             // texto do selo vermelho
const MENSAGENS  = [
  // formato: { autor: "Suporte Life Reset", texto: "...", staff: true }
];
const OFERTA_URL = "https://wa.link/53l2yi";

/* ===== atalhos ===== */
const $ = id => document.getElementById(id);
const drop = $('drop'), toast = $('toast');
let toastTimer;

const flash = msg => {
  toast.textContent = msg; toast.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('on'), 1400);
};

/* ===== selo ===== */
if ($('badgeLive')) $('badgeLive').lastChild.textContent = ' ' + MODO;

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

/* ===== player do YouTube (via API oficial) ===== */
const PROGRESS_KEY = 'lifereset:progress:yt:' + VIDEO_ID; // guardado no dispositivo do usuário
const SAVE_EVERY   = 5000; // salva a posição a cada 5s enquanto toca
const END_MARGIN   = 10;   // se faltar menos que isso para o fim, recomeça do início
let player, restored = false, saveTimer = null;

// callback chamado pela API do YouTube quando ela termina de carregar
// o iframe já está no HTML (com enablejsapi=1); aqui só nos conectamos a ele
// para poder retomar de onde o usuário parou e abrir a oferta no fim.
window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player('player', {
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerState,
      onError: onPlayerError
    }
  });
};

// injeta o script da API do YouTube (depois de definir o callback acima)
(function loadYT() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
})();

function posicaoSalva() {
  let t;
  try { t = parseFloat(localStorage.getItem(PROGRESS_KEY)); } catch (e) { return 0; }
  return isFinite(t) && t > 0 ? t : 0;
}
function salvarProgresso() {
  if (!player || !player.getCurrentTime) return;
  const t = player.getCurrentTime(), d = player.getDuration();
  if (t > 0 && d && t < d - 1) {
    try { localStorage.setItem(PROGRESS_KEY, String(t)); } catch (e) {}
  }
}

function onPlayerReady() {
  // salva também ao sair/fechar/ocultar a aba
  window.addEventListener('pagehide', salvarProgresso);
  document.addEventListener('visibilitychange', () => { if (document.hidden) salvarProgresso(); });
}

function onPlayerState(e) {
  if (e.data === YT.PlayerState.PLAYING) {
    // retoma de onde parou (só na primeira vez que dá play)
    if (!restored) {
      restored = true;
      const t = posicaoSalva(), d = player.getDuration();
      if (t > 0 && d && t < d - END_MARGIN) {
        player.seekTo(t, true);
        flash('Retomando de onde parou');
      }
    }
    // salva a posição periodicamente enquanto o vídeo toca
    clearInterval(saveTimer);
    saveTimer = setInterval(salvarProgresso, SAVE_EVERY);
  } else {
    clearInterval(saveTimer);
    if (e.data === YT.PlayerState.PAUSED) salvarProgresso();
    if (e.data === YT.PlayerState.ENDED) {
      try { localStorage.removeItem(PROGRESS_KEY); } catch (e2) {} // terminou: próxima visita começa do início
      abrirOferta();
    }
  }
}

function onPlayerError(e) {
  // mostra a caixa de aviso e explica a causa conforme o código do YouTube
  drop.classList.remove('gone');
  const causas = {
    2:   'ID do vídeo inválido (verifique VIDEO_ID no script.js).',
    5:   'Erro do player HTML5. Tente outro navegador.',
    100: 'Vídeo não encontrado, removido ou marcado como privado.',
    101: 'O dono do vídeo desativou a reprodução em outros sites (incorporação).',
    150: 'O dono do vídeo desativou a reprodução em outros sites (incorporação).'
  };
  const msg = causas[e && e.data] || ('Erro desconhecido (código ' + (e && e.data) + ').');
  console.error('[YouTube] Falha ao carregar o vídeo:', e && e.data, '-', msg);
  const p = drop.querySelector('p');
  if (p) p.textContent = msg;
}

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

/* teclado: só atua com o pop-up aberto (mantém o foco dentro dele) */
document.addEventListener('keydown', e => {
  if (modalOferta.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); fecharOferta(); }
  else if (e.key === 'Tab') {
    const alvos = [$('ofertaFechar'), $('ofertaCta')];
    const i = alvos.indexOf(document.activeElement);
    e.preventDefault();
    alvos[(i + (e.shiftKey ? alvos.length - 1 : 1)) % alvos.length].focus();
  }
});
