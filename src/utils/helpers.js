// ============================================================
// helpers.js — Funciones utilitarias reutilizables
// ============================================================

/** Distancia euclidiana entre dos puntos */
export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** Número aleatorio entre min y max */
export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

/** Entero aleatorio entre min y max (inclusive) */
export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

/** Clampa un valor entre min y max */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/** Promesa que resuelve después de ms milisegundos */
export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Mezcla un array aleatoriamente (Fisher-Yates) */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Devuelve 4 opciones únicas aleatorias de un array */
export function pickRandom(arr, count = 4) {
  return shuffle(arr).slice(0, count);
}
