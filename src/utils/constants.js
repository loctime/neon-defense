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
  CELL_HP: 3,         // vida base de cada celda (aumentado de 1 a 3 para evitar snowball)
  SPREAD_CHANCE: 0.08, // probabilidad de dañar celda adyacente al conquistar
};

export const GAME = {
  DURATION: 120,        // segundos
  UPGRADE_INTERVAL: 15, // cada cuántos segundos aparece mejora
  FPS: 30,
};

// Diminishing Returns Calculator
export const DIMINISHING_RETURNS = {
  /**
   * Calculate diminished value based on level and curve type
   * @param {number} level - Current upgrade level
   * @param {number} baseValue - Base value per level
   * @param {string} curveType - 'linear', 'exponential', 'logarithmic'
   * @param {number} curveStrength - How strong the diminishing effect is (0.1-0.9)
   * @returns {number} Diminished value
   */
  calculate: (level, baseValue, curveType = 'exponential', curveStrength = 0.3) => {
    if (level <= 1) return baseValue;
    
    switch (curveType) {
      case 'exponential':
        return baseValue * Math.pow(1 - curveStrength, level - 1);
      case 'logarithmic':
        return baseValue * (1 / Math.log(level + 1));
      case 'linear':
        return Math.max(baseValue * (1 - curveStrength * (level - 1)), baseValue * 0.1);
      default:
        return baseValue;
    }
  },
  
  /**
   * Get curve type for different upgrade categories
   */
  getCurveType: (upgradeId) => {
    const curves = {
      // Offensive upgrades - strong diminishing returns
      'multiShot': 'exponential',
      'shotgun': 'exponential',
      'laser': 'exponential',
      'ricochet': 'exponential',
      
      // Defensive upgrades - moderate diminishing returns
      'shield': 'logarithmic',
      'regeneration': 'logarithmic',
      'fortification': 'linear',
      
      // Utility upgrades - light diminishing returns
      'cooling': 'linear',
      'heatEfficiency': 'linear',
      
      // Classic stats - moderate diminishing returns
      'dmg': 'exponential',
      'rate': 'logarithmic',
    };
    
    return curves[upgradeId] || 'linear';
  },
  
  /**
   * Get curve strength for different upgrade categories
   */
  getCurveStrength: (upgradeId) => {
    const strengths = {
      // High stacking potential - strong diminishing
      'multiShot': 0.4,
      'shotgun': 0.35,
      'dmg': 0.3,
      
      // Moderate stacking - medium diminishing
      'laser': 0.25,
      'ricochet': 0.25,
      'rate': 0.2,
      
      // Low stacking - light diminishing
      'shield': 0.15,
      'regeneration': 0.15,
      'fortification': 0.1,
      'cooling': 0.1,
      'heatEfficiency': 0.1,
    };
    
    return strengths[upgradeId] || 0.2;
  }
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
    desc: '+1 bala adicional por disparo (Costo: 2 pts)',
    category: 'shooting',
    maxLevel: 10,
    pointCost: 2,
    apply: (stats) => { 
      const currentLevel = (stats.multiShotLevel || 0);
      const curveType = DIMINISHING_RETURNS.getCurveType('multiShot');
      const curveStrength = DIMINISHING_RETURNS.getCurveStrength('multiShot');
      const diminishedValue = DIMINISHING_RETURNS.calculate(currentLevel + 1, 1, curveType, curveStrength);
      stats.multiShotLevel = currentLevel + 1;
    },
  },
  laser: {
    id: 'laser',
    icon: '⚡',
    name: 'LASER',
    desc: 'Balas se convierten en rayos penetrantes (Costo: 2 pts)',
    category: 'shooting',
    maxLevel: 5,
    pointCost: 2,
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
  
  // Heat Management (counter-play upgrades)
  cooling: {
    id: 'cooling',
    icon: '❄️',
    name: 'ENFRIAMIENTO',
    desc: 'Mejora disipación de calor',
    category: 'advanced',
    maxLevel: 5,
    apply: (stats) => { 
      stats.heatDissipation = (stats.heatDissipation || 2) + 1;
      stats.maxHeat = (stats.maxHeat || 100) + 20;
    },
  },
  heatEfficiency: {
    id: 'heatEfficiency',
    icon: '⚙️',
    name: 'EFICIENCIA TÉRMICA',
    desc: 'Reduce generación de calor',
    category: 'advanced',
    maxLevel: 5,
    apply: (stats) => { 
      stats.heatPerShot = Math.max(1, (stats.heatPerShot || 5) - 1);
      stats.overheatPenalty = Math.max(0.2, (stats.overheatPenalty || 0.5) - 0.1);
    },
  },
  
  // Defensive Upgrades (counter-play options)
  shield: {
    id: 'shield',
    icon: '🛡️',
    name: 'ESCUDO',
    desc: 'Celdas ganan +2 HP temporal (Costo: 1 pt)',
    category: 'advanced',
    maxLevel: 3,
    pointCost: 1,
    apply: (stats) => { 
      stats.shieldLevel = (stats.shieldLevel || 0) + 1;
      stats.shieldDuration = (stats.shieldDuration || 0) + (30 * GAME.FPS); // 30 seconds per level
    },
  },
  regeneration: {
    id: 'regeneration',
    icon: '💚',
    name: 'REGENERACIÓN',
    desc: 'Recupera celdas perdidas lentamente',
    category: 'advanced',
    maxLevel: 5,
    apply: (stats) => { 
      stats.regenerationLevel = (stats.regenerationLevel || 0) + 1;
      stats.regenerationRate = (stats.regenerationRate || 0) + 0.5; // HP per second
    },
  },
  fortification: {
    id: 'fortification',
    icon: '🏰',
    name: 'FORTIFICACIÓN',
    desc: 'Celdas ganan +1 HP permanente',
    category: 'advanced',
    maxLevel: 3,
    apply: (stats) => { 
      stats.fortificationLevel = (stats.fortificationLevel || 0) + 1;
      stats.cellBonusHP = (stats.cellBonusHP || 0) + 1;
    },
  },
  
  // Targeting Behavior Modifiers
  targetingClosest: {
    id: 'targetingClosest',
    icon: '🎯',
    name: 'TIRO CERCA',
    desc: 'Prioriza objetivos más cercanos',
    category: 'advanced',
    maxLevel: 1,
    apply: (stats) => { stats.targetingMode = 'closest'; },
  },
  targetingWeakest: {
    id: 'targetingWeakest',
    icon: '💔',
    name: 'TIRO DÉBIL',
    desc: 'Prioriza celdas con menos HP',
    category: 'advanced',
    maxLevel: 1,
    apply: (stats) => { stats.targetingMode = 'weakest'; },
  },
  targetingFrontline: {
    id: 'targetingFrontline',
    icon: '⚔️',
    name: 'TIRO FRENTE',
    desc: 'Prioriza objetivos en frontera',
    category: 'advanced',
    maxLevel: 1,
    apply: (stats) => { stats.targetingMode = 'frontline'; },
  },
  targetingRandom: {
    id: 'targetingRandom',
    icon: '🎲',
    name: 'TIRO ALEATORIO',
    desc: 'Dispara a objetivos aleatorios',
    category: 'advanced',
    maxLevel: 1,
    apply: (stats) => { stats.targetingMode = 'random'; },
  },
  
  // Counter-Tech Upgrades (direct counters to dominant strategies)
  antiProjectile: {
    id: 'antiProjectile',
    icon: '🛡️',
    name: 'ANTI-PROYECTIL',
    desc: 'Reduce daño de balas enemigas 30% (Costo: 2 pts)',
    category: 'advanced',
    maxLevel: 3,
    pointCost: 2,
    apply: (stats) => { 
      stats.antiProjectileLevel = (stats.antiProjectileLevel || 0) + 1;
      stats.enemyDamageReduction = (stats.enemyDamageReduction || 0) + 0.3;
    },
  },
  antiLaser: {
    id: 'antiLaser',
    icon: '🔰',
    name: 'ANTI-LÁSER',
    desc: 'Reduce daño de láseres 40%',
    category: 'advanced',
    maxLevel: 3,
    apply: (stats) => { 
      stats.antiLaserLevel = (stats.antiLaserLevel || 0) + 1;
      stats.enemyLaserReduction = (stats.enemyLaserReduction || 0) + 0.4;
    },
  },
  antiDrone: {
    id: 'antiDrone',
    icon: '🚫',
    name: 'ANTI-DRONE',
    desc: 'Destruye drones enemigos más rápido',
    category: 'advanced',
    maxLevel: 3,
    apply: (stats) => { 
      stats.antiDroneLevel = (stats.antiDroneLevel || 0) + 1;
      stats.droneDamageBonus = (stats.droneDamageBonus || 0) + 2;
    },
  },
  heatAmplifier: {
    id: 'heatAmplifier',
    icon: '🔥',
    name: 'AMPLIFICADOR TÉRMICO',
    desc: 'Enemigos generan +50% calor',
    category: 'advanced',
    maxLevel: 3,
    apply: (stats) => { 
      stats.heatAmplifierLevel = (stats.heatAmplifierLevel || 0) + 1;
      stats.enemyHeatAmplifier = (stats.enemyHeatAmplifier || 0) + 0.5;
    },
  },
  
  // Poderes clásicos (compatibilidad)
  dmg: {
    id: 'dmg',
    icon: '⚔️',
    name: 'DAÑO +1',
    desc: 'Tus balas hacen más daño',
    category: 'classic',
    maxLevel: 10,
    apply: (stats) => { 
      const currentLevel = (stats.dmg || 1);
      const curveType = DIMINISHING_RETURNS.getCurveType('dmg');
      const curveStrength = DIMINISHING_RETURNS.getCurveStrength('dmg');
      const diminishedValue = DIMINISHING_RETURNS.calculate(currentLevel, 1, curveType, curveStrength);
      stats.dmg = Math.floor((stats.dmg || 1) + diminishedValue);
    },
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
  
  // Heat System (anti-dominant strategy)
  heat: 0,              // Current heat level (0-100)
  maxHeat: 100,        // Maximum heat before overheating
  heatDissipation: 2,  // Heat dissipated per frame
  heatPerShot: 5,      // Heat generated per shot
  overheatPenalty: 0.5, // Damage multiplier when overheated
  isOverheated: false,  // Overheat status flag
  
  // Defensive Upgrades
  shieldLevel: 0,      // Shield upgrade level
  shieldDuration: 0,   // Remaining shield duration in frames
  regenerationLevel: 0, // Regeneration upgrade level
  regenerationRate: 0, // HP regenerated per second
  fortificationLevel: 0, // Fortification upgrade level
  cellBonusHP: 0,     // Permanent HP bonus for cells
  
  // Targeting Behavior
  targetingMode: 'default', // 'default', 'closest', 'weakest', 'frontline', 'random'
  
  // Counter-Tech Upgrades
  antiProjectileLevel: 0,    // Anti-projectile upgrade level
  enemyDamageReduction: 0,   // Damage reduction for enemy projectiles
  antiLaserLevel: 0,         // Anti-laser upgrade level  
  enemyLaserReduction: 0,     // Damage reduction for enemy lasers
  antiDroneLevel: 0,         // Anti-drone upgrade level
  droneDamageBonus: 0,        // Extra damage against drones
  heatAmplifierLevel: 0,      // Heat amplifier upgrade level
  enemyHeatAmplifier: 0,      // Heat generation multiplier for enemies
  
  // Resource Economy
  upgradePoints: 3,          // Points available for upgrades
  maxUpgradePoints: 8,        // Maximum upgrade points
  pointRegenRate: 0,         // Points regenerated per second
  pointRegenTimer: 0,         // Timer for point regeneration
  
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
