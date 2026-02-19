// ============================================================
// constants.js — Toda la configuración del juego en un lugar
// Modificá estos valores para balancear el juego fácilmente
// ============================================================

export const COLORS = {
  P1: '#00cfff',
  P2: '#ff6a00',
  P1_BG: '#00060d',
  P2_BG: '#0d0400',
  PARTICLE_GLOW: 4,
};

export const GRID = {
  CELL_SIZE: 14,      // px por celda
  CELL_HP: 1,         // vida base de cada celda (reducido de 3 a 1)
  SPREAD_CHANCE: 0.08, // probabilidad de dañar celda adyacente al conquistar
};

export const GAME = {
  DURATION: 120,        // segundos
  UPGRADE_INTERVAL: 15, // cada cuántos segundos aparece mejora
  FPS: 30,
};

export const TOWER = {
  BASE_COOLDOWN: 5,     // frames entre disparos (a 30fps = 0.17s - casi continuo)
  BULLET_SPEED_BASE: 5,
};

export const UPGRADES = [
  {
    id: 'dmg',
    icon: '⚔️',
    name: 'DAÑO +1',
    desc: 'Tus balas hacen más daño',
    apply: (stats) => { stats.dmg++; },
  },
  {
    id: 'rate',
    icon: '⚡',
    name: 'ROTACIÓN +1',
    desc: 'Torres rotan más rápido',
    apply: (stats) => { stats.rotationSpeed = (stats.rotationSpeed || 1) + 0.3; },
  },
  {
    id: 'range',
    icon: '🔭',
    name: 'RANGO +1',
    desc: 'Mayor alcance de disparo',
    apply: (stats) => { stats.range = Math.min(stats.range + 0.4, 3); },
  },
  {
    id: 'multi',
    icon: '💫',
    name: 'MULTIBALA',
    desc: 'Disparás 2 objetivos a la vez',
    apply: (stats) => { stats.bullets = Math.min(stats.bullets + 1, 4); },
  },
  {
    id: 'spread',
    icon: '🌊',
    name: 'EXPANSIÓN',
    desc: 'Conquista se propaga más',
    apply: (stats) => { stats.spreadBonus = (stats.spreadBonus || 0) + 1; },
    // La lógica especial la maneja Grid.js usando stats.spreadBonus
  },
  {
    id: 'nova',
    icon: '💥',
    name: 'SUPERNOVA',
    desc: 'Explosión que conquista una zona',
    apply: (stats) => { stats.pendingNova = true; },
    // La lógica especial la maneja Game.js
  },
];

export const INITIAL_STATS = () => ({
  dmg: 1,
  rate: 1,
  range: 1,
  bullets: 1,
  spreadBonus: 0,
  pendingNova: false,
});
