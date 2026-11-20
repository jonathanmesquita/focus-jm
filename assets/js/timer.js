/*
 * Lógica do Pomodoro, sem DOM — por isso dá para testar com `node --test`.
 *
 * O tempo restante NÃO é descontado de 1 em 1 segundo: o timer guarda a hora
 * em que a fase termina (`terminaEm`) e calcula o que falta a partir do
 * relógio. O navegador desacelera `setInterval` em aba de fundo (o Chrome chega
 * a rodar uma vez por minuto) e dentro de embed; contando pela hora final, o
 * Pomodoro continua certo mesmo assim.
 */

export const DURACAO = {
  foco: 25 * 60 * 1000,
  pausa: 5 * 60 * 1000
};

export function novoTimer() {
  return { fase: "foco", restante: DURACAO.foco, terminaEm: null };
}

export function rodando(t) {
  return t.terminaEm !== null;
}

export function iniciar(t, agora) {
  if (rodando(t)) return t;
  return { ...t, terminaEm: agora + t.restante };
}

export function pausar(t, agora) {
  if (!rodando(t)) return t;
  return { ...t, restante: Math.max(0, t.terminaEm - agora), terminaEm: null };
}

/* Volta para o começo do foco. O contador de Pomodoros não é zerado aqui. */
export function reiniciar() {
  return novoTimer();
}

export function restante(t, agora) {
  return rodando(t) ? Math.max(0, t.terminaEm - agora) : t.restante;
}

/*
 * Avança as fases que já terminaram. Devolve o novo estado e quantos focos
 * foram concluídos — pode ser mais de um se a aba ficou muito tempo parada.
 * A fase seguinte começa na hora em que a anterior terminou, não "agora",
 * para o atraso de uma aba em segundo plano não se acumular.
 */
export function avancar(t, agora) {
  let atual = t;
  let focosConcluidos = 0;
  let trocas = 0;

  while (rodando(atual) && agora >= atual.terminaEm) {
    if (atual.fase === "foco") focosConcluidos += 1;
    const proxima = atual.fase === "foco" ? "pausa" : "foco";
    atual = {
      fase: proxima,
      restante: DURACAO[proxima],
      terminaEm: atual.terminaEm + DURACAO[proxima]
    };
    trocas += 1;
  }

  return { timer: atual, focosConcluidos, trocou: trocas > 0 };
}

export function formatar(ms) {
  const segundos = Math.ceil(ms / 1000);
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* Contador do dia: { data: "AAAA-MM-DD", total }. Dia novo começa do zero. */
export function hoje(data = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

export function contadorDoDia(salvo, diaAtual) {
  if (!salvo || salvo.data !== diaAtual || !Number.isInteger(salvo.total) || salvo.total < 0) {
    return { data: diaAtual, total: 0 };
  }
  return salvo;
}
