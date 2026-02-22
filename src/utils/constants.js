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

export const POWERS = {
  // Modificadores de Disparo (Stackables)
  multiShot: {
    id: 'multiShot',
    icon: '🔫',
    name: 'MULTI SHOT',
    desc: '+1 bala adicional por disparo',
    category: 'shooting',
    maxLevel: 10,
    apply: (stats) => { stats.multiShotLevel = (stats.multiShotLevel || 0) + 1; },
  },
  laser: {
    id: 'laser',
    icon: '⚡',
    name: 'LASER',
    desc: 'Balas se convierten en rayos penetrantes',
    category: 'shooting',
    maxLevel: 5,
    apply: (stats) => { stats.laserLevel = (stats.laserLevel || 0) + 1; },
  },
  ricochet: {
    id: 'ricochet',
    icon: '�',
    name: 'RICOCHET',
    desc: 'Balas rebotan hacia enemigos cercanos',
    category: 'shooting',
    maxLevel: 5,
    apply: (stats) => { stats.ricochetLevel = (stats.ricochetLevel || 0) + 1; },
  },
  shotgun: {
    id: 'shotgun',
    icon: '�',
    name: 'SHOTGUN',
    desc: 'Dispara múltiples proyectiles en abanico',
    category: 'shooting',
    maxLevel: 5,
    apply: (stats) => { stats.shotgunLevel = (stats.shotgunLevel || 0) + 1; },
  },
  
  // Habilidades Automáticas (Cooldown-based)
  autoExplosion: {
    id: 'autoExplosion',
    icon: '💣',
    name: 'EXPLOSIÓN AUTO',
    desc: 'Bomba cada 5 segundos',
    category: 'automatic',
    maxLevel: 5,
    apply: (stats) => { stats.autoExplosionLevel = (stats.autoExplosionLevel || 0) + 1; },
  },
  meteorite: {
    id: 'meteorite',
    icon: '☄️',
    name: 'METEORITO',
    desc: 'Impacto aleatorio en zona enemiga',
    category: 'automatic',
    maxLevel: 5,
    apply: (stats) => { stats.meteoriteLevel = (stats.meteoriteLevel || 0) + 1; },
  },
  shockwave: {
    id: 'shockwave',
    icon: '🌊',
    name: 'ONDA DE CHOQUE',
    desc: 'Empuja frontera enemiga',
    category: 'automatic',
    maxLevel: 3,
    apply: (stats) => { stats.shockwaveLevel = (stats.shockwaveLevel || 0) + 1; },
  },
  
  // Mecánicas Avanzadas
  overdrive: {
    id: 'overdrive',
    icon: '🚀',
    name: 'OVERDRIVE',
    desc: 'Doble velocidad de disparo por 3s',
    category: 'advanced',
    maxLevel: 3,
    apply: (stats) => { stats.overdriveLevel = (stats.overdriveLevel || 0) + 1; },
  },
  drones: {
    id: 'drones',
    icon: '🛸',
    name: 'DRONES',
    desc: 'Genera drones orbitantes',
    category: 'advanced',
    maxLevel: 5,
    apply: (stats) => { stats.droneLevel = (stats.droneLevel || 0) + 1; },
  },
  shadowTower: {
    id: 'shadowTower',
    icon: '�',
    name: 'TORRE SOMBRA',
    desc: '20% disparo duplicado fantasma',
    category: 'advanced',
    maxLevel: 5,
    apply: (stats) => { stats.shadowTowerLevel = (stats.shadowTowerLevel || 0) + 1; },
  },
  
  // Poderes clásicos (compatibilidad)
  dmg: {
    id: 'dmg',
    icon: '⚔️',
    name: 'DAÑO +1',
    desc: 'Tus balas hacen más daño',
    category: 'classic',
    maxLevel: 10,
    apply: (stats) => { stats.dmg++; },
  },
  rate: {
    id: 'rate',
    icon: '⚡',
    name: 'ROTACIÓN +1',
    desc: 'Torres rotan más rápido',
    category: 'classic',
    maxLevel: 10,
    apply: (stats) => { stats.rotationSpeed = (stats.rotationSpeed || 1) + 0.3; },
  },
};

// Array plano para compatibilidad con modal
export const POWERS_ARRAY = Object.values(POWERS);

export const INITIAL_STATS = () => ({
  // Stats clásicos
  dmg: 1,
  rate: 1,
  range: 1,
  bullets: 1,
  spreadBonus: 0,
  pendingNova: false,
  
  // Modificadores de Disparo
  multiShotLevel: 0,
  laserLevel: 0,
  ricochetLevel: 0,
  shotgunLevel: 0,
  
  // Habilidades Automáticas (cooldowns en frames)
  autoExplosionLevel: 0,
  autoExplosionCooldown: 0,
  meteoriteLevel: 0,
  meteoriteCooldown: 0,
  shockwaveLevel: 0,
  shockwaveCooldown: 0,
  
  // Mecánicas Avanzadas
  overdriveLevel: 0,
  overdriveDuration: 0,
  overdriveCooldown: 0,
  droneLevel: 0,
  shadowTowerLevel: 0,
  
  // Control de niveles por poder
  powerLevels: {},
});
