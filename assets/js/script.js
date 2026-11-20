/*
 * Tela do Focus JM. A regra do timer está em timer.js; aqui só fica o que
 * mexe no DOM, no som e no localStorage.
 */

import {
  novoTimer,
  rodando,
  iniciar,
  pausar,
  reiniciar,
  restante,
  avancar,
  formatar,
  hoje,
  contadorDoDia
} from "./timer.js";

const CHAVE = "focusjm:contador";

const el = {
  painel: document.querySelector(".painel"),
  fase: document.querySelector("#fase"),
  tempo: document.querySelector("#tempo"),
  iniciar: document.querySelector("#iniciar"),
  pausar: document.querySelector("#pausar"),
  reiniciar: document.querySelector("#reiniciar"),
  contador: document.querySelector("#contador"),
  aviso: document.querySelector("#aviso")
};

const NOME_FASE = { foco: "Foco", pausa: "Pausa" };

let timer = novoTimer();
let contador = lerContador();
let intervalo = null;

/* ---------- contador (localStorage é conveniência: falhar não quebra) ---------- */

function lerContador() {
  let salvo = null;
  try {
    salvo = JSON.parse(localStorage.getItem(CHAVE));
  } catch {
    /* modo privado ou armazenamento bloqueado */
  }
  return contadorDoDia(salvo, hoje());
}

function gravarContador() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(contador));
  } catch {
    /* segue funcionando sem guardar */
  }
}

/* ---------- som: um "plim" curto gerado por código, sem arquivo ---------- */

let audio = null;

function prepararSom() {
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return;
  if (!audio) audio = new Contexto();
  if (audio.state === "suspended") audio.resume();
}

function tocarSom() {
  if (!audio) return;
  const inicio = audio.currentTime;
  [880, 660].forEach((frequencia, i) => {
    const osc = audio.createOscillator();
    const volume = audio.createGain();
    const t = inicio + i * 0.18;
    osc.type = "sine";
    osc.frequency.value = frequencia;
    volume.gain.setValueAtTime(0.0001, t);
    volume.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(volume).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

/* ---------- tela ---------- */

function desenhar() {
  const agora = Date.now();
  const texto = formatar(restante(timer, agora));

  el.fase.textContent = NOME_FASE[timer.fase].toUpperCase();
  el.tempo.textContent = texto;
  el.tempo.setAttribute("datetime", `PT${texto.replace(":", "M")}S`);
  el.painel.dataset.fase = timer.fase;

  el.iniciar.disabled = rodando(timer);
  el.pausar.disabled = !rodando(timer);

  const total = contador.total;
  el.contador.textContent = `${total} ${total === 1 ? "Pomodoro concluído" : "Pomodoros concluídos"} hoje`;

  document.title = rodando(timer)
    ? `${texto} · ${NOME_FASE[timer.fase]} — Focus JM`
    : "Focus JM — Pomodoro";
}

function anunciar(mensagem) {
  /* Região aria-live: leitor de tela ouve a troca de fase, não cada segundo. */
  el.aviso.textContent = mensagem;
}

function tique() {
  const agora = Date.now();

  if (contador.data !== hoje()) {
    contador = contadorDoDia(null, hoje());
    gravarContador();
  }

  const r = avancar(timer, agora);
  if (r.trocou) {
    timer = r.timer;
    if (r.focosConcluidos > 0) {
      contador = { ...contador, total: contador.total + r.focosConcluidos };
      gravarContador();
    }
    tocarSom();
    anunciar(timer.fase === "pausa" ? "Foco concluído. Pausa de 5 minutos." : "Pausa terminada. Foco de 25 minutos.");
  }

  desenhar();
}

function ligarRelogio() {
  if (intervalo === null) intervalo = window.setInterval(tique, 250);
}

function desligarRelogio() {
  window.clearInterval(intervalo);
  intervalo = null;
}

/* ---------- botões ---------- */

el.iniciar.addEventListener("click", () => {
  prepararSom();
  timer = iniciar(timer, Date.now());
  ligarRelogio();
  desenhar();
  el.pausar.focus();
});

el.pausar.addEventListener("click", () => {
  timer = pausar(timer, Date.now());
  desligarRelogio();
  desenhar();
  el.iniciar.focus();
});

el.reiniciar.addEventListener("click", () => {
  timer = reiniciar();
  desligarRelogio();
  desenhar();
  anunciar("Timer reiniciado: foco de 25 minutos.");
});

/* Ao voltar para a aba, atualiza na hora em vez de esperar o próximo tique. */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && rodando(timer)) tique();
});

desenhar();
