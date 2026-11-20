import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DURACAO, novoTimer, rodando, iniciar, pausar, reiniciar,
  restante, avancar, formatar, hoje, contadorDoDia
} from "../timer.js";

const MIN = 60 * 1000;

test("começa parado, no foco, com 25:00", () => {
  const t = novoTimer();
  assert.equal(t.fase, "foco");
  assert.equal(rodando(t), false);
  assert.equal(formatar(restante(t, 0)), "25:00");
});

test("conta pela hora final: 10 minutos depois faltam 15", () => {
  const t = iniciar(novoTimer(), 1000);
  assert.equal(formatar(restante(t, 1000 + 10 * MIN)), "15:00");
});

test("pausar congela o tempo e iniciar continua de onde parou", () => {
  let t = iniciar(novoTimer(), 0);
  t = pausar(t, 3 * MIN);
  assert.equal(rodando(t), false);
  assert.equal(formatar(restante(t, 99 * MIN)), "22:00");
  t = iniciar(t, 100 * MIN);
  assert.equal(formatar(restante(t, 101 * MIN)), "21:00");
});

test("fim do foco vira pausa de 5:00, conta 1 Pomodoro e segue rodando", () => {
  const t = iniciar(novoTimer(), 0);
  const r = avancar(t, DURACAO.foco);
  assert.equal(r.trocou, true);
  assert.equal(r.focosConcluidos, 1);
  assert.equal(r.timer.fase, "pausa");
  assert.equal(rodando(r.timer), true);
  assert.equal(formatar(restante(r.timer, DURACAO.foco)), "05:00");
});

test("fim da pausa volta ao foco sem contar Pomodoro", () => {
  let t = iniciar(novoTimer(), 0);
  t = avancar(t, DURACAO.foco).timer;
  const r = avancar(t, DURACAO.foco + DURACAO.pausa);
  assert.equal(r.timer.fase, "foco");
  assert.equal(r.focosConcluidos, 0);
  assert.equal(formatar(restante(r.timer, DURACAO.foco + DURACAO.pausa)), "25:00");
});

test("aba parada por 1 hora: fases puladas são contadas, sem atraso acumulado", () => {
  const t = iniciar(novoTimer(), 0);
  const r = avancar(t, 60 * MIN);
  // 0–25 foco, 25–30 pausa, 30–55 foco, 55–60 pausa → 2 focos; 60 começa foco
  assert.equal(r.focosConcluidos, 2);
  assert.equal(r.timer.fase, "foco");
  assert.equal(formatar(restante(r.timer, 60 * MIN)), "25:00");
});

test("antes do fim não troca nada", () => {
  const t = iniciar(novoTimer(), 0);
  const r = avancar(t, DURACAO.foco - 1);
  assert.equal(r.trocou, false);
  assert.equal(r.timer, t);
});

test("timer pausado não avança de fase", () => {
  const t = pausar(iniciar(novoTimer(), 0), MIN);
  assert.equal(avancar(t, 99 * MIN).trocou, false);
});

test("reiniciar volta ao foco parado em 25:00", () => {
  const t = reiniciar();
  assert.deepEqual(t, novoTimer());
});

test("formatar arredonda para cima: 24:59,4 mostra 25:00 até virar o segundo", () => {
  assert.equal(formatar(DURACAO.foco - 400), "25:00");
  assert.equal(formatar(DURACAO.foco - 1000), "24:59");
  assert.equal(formatar(0), "00:00");
});

test("contador zera em dia novo e ignora dado inválido", () => {
  assert.deepEqual(contadorDoDia({ data: "2026-11-19", total: 4 }, "2026-11-20"), { data: "2026-11-20", total: 0 });
  assert.deepEqual(contadorDoDia({ data: "2026-11-20", total: 4 }, "2026-11-20"), { data: "2026-11-20", total: 4 });
  assert.deepEqual(contadorDoDia({ data: "2026-11-20", total: -1 }, "2026-11-20"), { data: "2026-11-20", total: 0 });
  assert.deepEqual(contadorDoDia(null, "2026-11-20"), { data: "2026-11-20", total: 0 });
});

test("hoje usa a data local no formato AAAA-MM-DD", () => {
  assert.equal(hoje(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});
