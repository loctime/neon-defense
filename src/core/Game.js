// ============================================================
// Game.js — Loop principal y coordinación de todo el juego
// ============================================================

import { Grid }          from './Grid.js';
import { Renderer }      from './Renderer.js';
import { Tower, createInitialTowers } from '../entities/Tower.js';
import { Bullet, LaserBeam, burst } from '../entities/Bullet.js';
import { Particle }      from '../entities/Bullet.js';
import { Drone, createDronesForTower } from '../entities/Drone.js';
import { HUD }           from '../ui/HUD.js';
import { UpgradeModal }  from '../ui/UpgradeModal.js';
import { GAME, TOWER, INITIAL_STATS, POWERS_ARRAY, DIMINISHING_RETURNS } from '../utils/constants.js';
import { sleep }         from '../utils/helpers.js';

export class Game {
  constructor(canvas) {
    console.log('Game constructor, canvas:', canvas);
    this.canvas   = canvas;
    this.renderer = new Renderer(canvas);
    console.log('Renderer created:', this.renderer);
    this.hud      = new HUD();
    this.modal    = new UpgradeModal();

    this.grid      = null;
    this.towers    = [];
    this.bullets   = [];
    this.particles = [];
    this.drones     = []; // drones orbitantes
    this.stats     = [INITIAL_STATS(), INITIAL_STATS()];

    this.running   = false;
    this.gameTime  = GAME.DURATION;
    this.tickInt   = null;

    this._CW = 0;
    this._CH = 0;
    
    // Performance optimization: cache enemy positions
    this._enemyPositionCache = { 1: [], 2: [] };
    this._lastCacheUpdate = 0;

    this._bindResize();
  }

  /**
   * Calculate effective multiShot value with diminishing returns
   */
  _getEffectiveMultiShot(stats) {
    const level = stats.multiShotLevel || 0;
    if (level === 0) return 0;
    
    const curveType = DIMINISHING_RETURNS.getCurveType('multiShot');
    const curveStrength = DIMINISHING_RETURNS.getCurveStrength('multiShot');
    
    let effectiveValue = 0;
    for (let i = 1; i <= level; i++) {
      const diminishedValue = DIMINISHING_RETURNS.calculate(i, 1, curveType, curveStrength);
      effectiveValue += diminishedValue;
    }
    
    return Math.floor(effectiveValue);
  }

  /**
   * Updates heat dissipation and overheat status
   */
  _updateHeat(stats) {
    // Dissipate heat
    stats.heat = Math.max(0, stats.heat - stats.heatDissipation);
    
    // Update overheat status
    const wasOverheated = stats.isOverheated;
    stats.isOverheated = stats.heat >= stats.maxHeat;
    
    // Visual feedback when entering/exiting overheat
    if (stats.isOverheated && !wasOverheated) {
      // TODO: Add visual overheat indicator
      console.log(`Player ${stats.player || 'Unknown'} is OVERHEATED!`);
    }
  }

  // ----------------------------------------------------------
  // PERFORMANCE OPTIMIZATION
  // ----------------------------------------------------------
  _updateEnemyPositionCache() {
    // Update cache every 10 frames to balance performance and accuracy
    if (this._lastCacheUpdate++ < 10) return;
    this._lastCacheUpdate = 0;
    
    this._enemyPositionCache = { 1: [], 2: [] };
    
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const owner = this.grid.cells[r][c].owner;
        if (owner !== 0) {
          this._enemyPositionCache[owner === 1 ? 2 : 1].push({ col: c, row: r });
        }
      }
    }
  }

  // ----------------------------------------------------------
  // SETUP
  // ----------------------------------------------------------
  resize() {
    console.log('Resizing canvas...');
    this.canvas.width  = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    console.log('New canvas size:', this.canvas.width, 'x', this.canvas.height);
    if (this.grid) {
      this._CW = this.canvas.width  / this.grid.cols;
      this._CH = this.canvas.height / this.grid.rows;
      console.log('Cell size:', this._CW, 'x', this._CH);
    }
  }

  _bindResize() {
    window.addEventListener('resize', () => {
      this.resize();
      if (!this.running) this._draw();
    });
  }

  _initGrid() {
    const cols = Math.floor(this.canvas.width  / 14);
    const rows = Math.floor(this.canvas.height / 14);
    this.grid  = new Grid(cols, rows);
    this._CW   = this.canvas.width  / cols;
    this._CH   = this.canvas.height / rows;
  }

  // ----------------------------------------------------------
  // START
  // ----------------------------------------------------------
  start() {
    console.log('Game starting...');
    
    // Forzar resize inicial
    this.canvas.width = this.canvas.offsetWidth || window.innerWidth;
    this.canvas.height = (this.canvas.offsetHeight || window.innerHeight) - 36;
    
    this.resize();
    this._initGrid();
    this.towers    = createInitialTowers(this.grid.cols, this.grid.rows);
    console.log('Towers created:', this.towers);
    this.bullets   = [];
    this.particles = [];
    this.drones     = []; // Inicializar drones
    this.stats     = [INITIAL_STATS(), INITIAL_STATS()];
    this.gameTime  = GAME.DURATION;
    this.running   = true;

    console.log('Grid dimensions:', this.grid.cols, 'x', this.grid.rows);
    console.log('Cell size:', this._CW, 'x', this._CH);
    console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);

    this.tickInt = setInterval(() => this._tick(), 1000 / GAME.FPS);
    this._runTimerAndUpgrades();
    this._draw();
  }

  // ----------------------------------------------------------
  // GAME TICK (30fps)
  // ----------------------------------------------------------
  _tick() {
    if (!this.running) return;

    // Update performance cache
    this._updateEnemyPositionCache();

    // Update heat dissipation for both players
    for (let player = 1; player <= 2; player++) {
      const stats = this.stats[player - 1];
      this._updateHeat(stats);
    }

    // Update defensive systems
    this.grid.updateShields();
    for (let player = 1; player <= 2; player++) {
      const stats = this.stats[player - 1];
      if (stats.regenerationRate > 0) {
        this.grid.regenerateCells(player, stats.regenerationRate);
      }
      
      // Point regeneration (1 point every 30 seconds)
      stats.pointRegenTimer++;
      if (stats.pointRegenTimer >= 30 * GAME.FPS && stats.upgradePoints < stats.maxUpgradePoints) {
        stats.upgradePoints++;
        stats.pointRegenTimer = 0;
      }
    }

    // Update tower rotation
    for (const tower of this.towers) {
      const stats = this.stats[tower.player - 1];
      tower.updateRotation(stats);
    }

    // Procesar cooldowns de habilidades automáticas
    this._updateAbilityCooldowns();
    
    // Ejecutar habilidades automáticas
    this._executeAutomaticAbilities();
    
    // Actualizar drones
    this._updateDrones();

    // Towers shoot (con overdrive)
    for (const tower of this.towers) {
      const stats = this.stats[tower.player - 1];
      const modifiedCooldown = stats.overdriveDuration > 0 ? 
        Math.ceil(tower.cooldown * 0.5) : tower.cooldown; // Overdrive: doble velocidad
      
      if (tower.tick(stats, modifiedCooldown)) {
        this._shootFrom(tower, stats);
      }
    }

    // Move bullets
    const toRemove = [];
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      const stats = this.stats[b.player - 1];
      const arrived = b.update();
      
      if (arrived) {
        if (b instanceof LaserBeam) {
          // Laser: dañar múltiples celdas en línea
          const path = b.getPenetratedPath(
            Math.floor(b.x / this._CW),
            Math.floor(b.y / this._CH),
            b.targetCol,
            b.targetRow
          );
          
          // Apply counter-tech effects
          const enemyPlayer = b.player === 1 ? 2 : 1;
          const enemyStats = this.stats[enemyPlayer - 1];
          let damageMultiplier = 1.0;
          
          if (enemyStats.antiLaserLevel > 0) {
            damageMultiplier *= (1 - enemyStats.enemyLaserReduction);
          }
          
          for (const cell of path) {
            if (cell.col >= 0 && cell.col < this.grid.cols && cell.row >= 0 && cell.row < this.grid.rows) {
              const spread = stats.spreadBonus || 0;
              const damageReduction = Math.max(0.3, 1 - (path.indexOf(cell) * 0.1)); // daño reducido por penetración
              const finalDamage = Math.floor(b.dmg * damageReduction * damageMultiplier);
              const conquered = this.grid.damageCell(cell.col, cell.row, b.player, finalDamage, spread, stats);
              
              if (conquered) {
                const px = cell.col * this._CW + this._CW / 2;
                const py = cell.row * this._CH + this._CH / 2;
                this.particles.push(...burst(px, py, b.color, 3));
              }
            }
          }
        } else {
          // Bullet normal
          const spread = stats.spreadBonus || 0;
          
          // Apply counter-tech effects
          const enemyPlayer = b.player === 1 ? 2 : 1;
          const enemyStats = this.stats[enemyPlayer - 1];
          let damageMultiplier = 1.0;
          
          if (enemyStats.antiProjectileLevel > 0) {
            damageMultiplier *= (1 - enemyStats.enemyDamageReduction);
          }
          
          const finalDamage = Math.floor(b.dmg * damageMultiplier);
          const conquered = this.grid.damageCell(b.targetCol, b.targetRow, b.player, finalDamage, spread, stats);
          
          if (conquered) {
            const px = b.targetCol * this._CW + this._CW / 2;
            const py = b.targetRow * this._CH + this._CH / 2;
            this.particles.push(...burst(px, py, b.color));
          }
          
          // Ricochet: buscar nuevo objetivo
          const ricochetLevel = stats.ricochetLevel || 0;
          if (ricochetLevel > 0 && !b.isGhost) {
            const newTarget = b.findRicochetTarget(this.grid, b.player);
            if (newTarget && Math.random() < ricochetLevel * 0.3) {
              // Crear nueva bala hacia el nuevo objetivo
              const newTx = newTarget.col * this._CW + this._CW / 2;
              const newTy = newTarget.row * this._CH + this._CH / 2;
              const speed = TOWER.BULLET_SPEED_BASE + stats.rate;
              const ricochetBullet = new Bullet(b.player, b.x, b.y, newTx, newTy, newTarget.col, newTarget.row, b.dmg * 0.8, speed);
              ricochetBullet.isRicochet = true;
              this.bullets.push(ricochetBullet);
            }
          }
        }
        
        this._updateScores();
        toRemove.push(i);
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) this.bullets.splice(toRemove[i], 1);

    // Update particles
    for (const p of this.particles) p.update();
    this.particles = this.particles.filter(p => !p.dead);

    this._draw();
  }

  /**
   * Actualiza drones y maneja su disparo automático
   */
  _updateDrones() {
    // Actualizar drones existentes
    for (const drone of this.drones) {
      drone.update();
      
      // Disparo automático de drones
      if (drone.canShoot()) {
        const target = drone.findTarget(this.grid, this._CW, this._CH);
        if (target) {
          const pos = drone.getPosition(this._CW, this._CH);
          const tx = target.col * this._CW + this._CW / 2;
          const ty = target.row * this._CH + this._CH / 2;
          
          this.bullets.push(new Bullet(drone.player, pos.x, pos.y, tx, ty, target.col, target.row, drone.damage, TOWER.BULLET_SPEED_BASE));
          drone.shoot();
        }
      }
    }
    
    // Sincronizar drones con niveles de poder
    this._syncDronesWithPowerLevels();
  }
  
  /**
   * Sincroniza la cantidad de drones con los niveles de poder de cada jugador
   */
  _syncDronesWithPowerLevels() {
    for (let player = 1; player <= 2; player++) {
      const stats = this.stats[player - 1];
      const droneLevel = stats.droneLevel || 0;
      const playerTowers = this.towers.filter(t => t.player === player);
      
      // Contar drones actuales del jugador
      const currentDrones = this.drones.filter(d => d.player === player);
      const expectedDrones = playerTowers.length * droneLevel;
      
      if (currentDrones.length < expectedDrones) {
        // Agregar drones faltantes
        for (const tower of playerTowers) {
          const towerDrones = this.drones.filter(d => d.towerCol === tower.col && d.towerRow === tower.row);
          if (towerDrones.length < droneLevel) {
            const newDrones = createDronesForTower(tower, droneLevel - towerDrones.length);
            // Asignar ángulos únicos para evitar superposición
            newDrones.forEach((drone, i) => {
              drone.angle = (Math.PI * 2 / droneLevel) * (towerDrones.length + i);
            });
            this.drones.push(...newDrones);
          }
        }
      } else if (currentDrones.length > expectedDrones) {
        // Remover drones sobrantes
        const toRemove = currentDrones.length - expectedDrones;
        for (let i = 0; i < toRemove; i++) {
          const index = this.drones.findIndex(d => d.player === player);
          if (index !== -1) {
            this.drones.splice(index, 1);
          }
        }
      }
    }
  }

  _shootFrom(tower, stats) {
    // Check if can shoot (heat system)
    if (stats.isOverheated) {
      return; // Cannot shoot while overheated
    }
    
    const range   = tower.getRange(stats);
    const baseTargets = this._findTargetsInDirection(tower, range, stats.bullets);
    const color   = tower.player === 1 ? '#00cfff' : '#ff6a00';
    
    // Calculate total shots and heat generation
    const multiShotBonus = this._getEffectiveMultiShot(stats);
    const totalShots = Math.max(baseTargets.length, 1) + multiShotBonus;
    const shotgunLevel = stats.shotgunLevel || 0;
    
    // Calculate total heat for this volley
    let totalHeat = totalShots * stats.heatPerShot;
    if (shotgunLevel > 0) {
      totalHeat += totalShots * (5 + (shotgunLevel - 1) * 2) * stats.heatPerShot; // Shotgun pellets
    }
    
    // Apply enemy heat amplifier effects
    const enemyPlayer = tower.player === 1 ? 2 : 1;
    const enemyStats = this.stats[enemyPlayer - 1];
    if (enemyStats.heatAmplifierLevel > 0) {
      totalHeat *= (1 + enemyStats.enemyHeatAmplifier);
    }
    
    // Apply heat
    stats.heat = Math.min(stats.maxHeat, stats.heat + totalHeat);
    
    // Calculate damage with overheat penalty
    const baseDamage = stats.dmg;
    const damageMultiplier = stats.isOverheated ? stats.overheatPenalty : 1.0;
    const finalDamage = Math.floor(baseDamage * damageMultiplier);
    
    for (let i = 0; i < totalShots; i++) {
      // Para shots adicionales, encontrar objetivos cercanos al principal
      let target;
      if (i < baseTargets.length) {
        target = baseTargets[i];
      } else {
        // Encontrar objetivo cercano para multi shot
        const nearbyTargets = this._findNearbyTargets(tower, range, baseTargets);
        target = nearbyTargets[i % nearbyTargets.length] || baseTargets[0];
      }
      
      if (!target) continue;
      
      const sx = tower.col * this._CW + this._CW / 2;
      const sy = tower.row * this._CH + this._CH / 2;
      
      if (shotgunLevel > 0) {
        // Disparo shotgun: múltiples proyectiles en abanico
        const pelletCount = 5 + (shotgunLevel - 1) * 2;
        const spreadAngle = Math.PI / 6 + (shotgunLevel - 1) * Math.PI / 12;
        
        for (let p = 0; p < pelletCount; p++) {
          const angleOffset = (p - pelletCount / 2) * (spreadAngle / pelletCount);
          const tx = target.col * this._CW + this._CW / 2;
          const ty = target.row * this._CH + this._CH / 2;
          
          // Aplicar dispersión angular
          const dx = tx - sx;
          const dy = ty - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const baseAngle = Math.atan2(dy, dx);
          const finalAngle = baseAngle + angleOffset;
          
          const finalTx = sx + Math.cos(finalAngle) * dist;
          const finalTy = sy + Math.sin(finalAngle) * dist;
          
          const speed = TOWER.BULLET_SPEED_BASE + stats.rate;
          this.bullets.push(new Bullet(tower.player, sx, sy, finalTx, finalTy, target.col, target.row, finalDamage, speed));
        }
      } else {
        // Disparo normal o laser
        const tx = target.col * this._CW + this._CW / 2;
        const ty = target.row * this._CH + this._CH / 2;
        const speed = TOWER.BULLET_SPEED_BASE + stats.rate;
        
        if (stats.laserLevel > 0) {
          // Crear laser en lugar de bala normal
          this.bullets.push(new LaserBeam(tower.player, sx, sy, tx, ty, target.col, target.row, finalDamage, stats.laserLevel));
        } else {
          this.bullets.push(new Bullet(tower.player, sx, sy, tx, ty, target.col, target.row, finalDamage, speed));
        }
      }
      
      // Torre Sombra: 20% probabilidad de disparo duplicado
      if (stats.shadowTowerLevel > 0 && Math.random() < 0.2) {
        const ghostTarget = target;
        const tx = ghostTarget.col * this._CW + this._CW / 2;
        const ty = ghostTarget.row * this._CH + this._CH / 2;
        const speed = TOWER.BULLET_SPEED_BASE + stats.rate;
        const ghostBullet = new Bullet(tower.player, sx, sy, tx, ty, ghostTarget.col, ghostTarget.row, finalDamage, speed);
        ghostBullet.isGhost = true;
        this.bullets.push(ghostBullet);
      }
    }
  }

  /**
   * Actualiza cooldowns de habilidades automáticas
   */
  _updateAbilityCooldowns() {
    for (let player = 1; player <= 2; player++) {
      const stats = this.stats[player - 1];
      
      // Reducir cooldowns
      if (stats.autoExplosionCooldown > 0) stats.autoExplosionCooldown--;
      if (stats.meteoriteCooldown > 0) stats.meteoriteCooldown--;
      if (stats.shockwaveCooldown > 0) stats.shockwaveCooldown--;
      if (stats.overdriveCooldown > 0) stats.overdriveCooldown--;
      if (stats.overdriveDuration > 0) stats.overdriveDuration--;
    }
  }

  /**
   * Ejecuta habilidades automáticas cuando sus cooldowns terminan
   */
  _executeAutomaticAbilities() {
    for (let player = 1; player <= 2; player++) {
      const stats = this.stats[player - 1];
      const color = player === 1 ? '#00cfff' : '#ff6a00';
      
      // Explosión Automática
      if (stats.autoExplosionLevel > 0 && stats.autoExplosionCooldown <= 0) {
        this._triggerAutoExplosion(player, stats);
        stats.autoExplosionCooldown = (5 - stats.autoExplosionLevel * 0.5) * GAME.FPS; // 5s - 0.5s por nivel
      }
      
      // Meteorito
      if (stats.meteoriteLevel > 0 && stats.meteoriteCooldown <= 0) {
        this._triggerMeteorite(player, stats);
        stats.meteoriteCooldown = (8 - stats.meteoriteLevel) * GAME.FPS; // 8s - 1s por nivel
      }
      
      // Onda de Choque
      if (stats.shockwaveLevel > 0 && stats.shockwaveCooldown <= 0) {
        this._triggerShockwave(player, stats);
        stats.shockwaveCooldown = (15 - stats.shockwaveLevel * 2) * GAME.FPS; // 15s - 2s por nivel
      }
      
      // Overdrive (automático cuando cooldown termina)
      if (stats.overdriveLevel > 0 && stats.overdriveCooldown <= 0 && stats.overdriveDuration <= 0) {
        stats.overdriveDuration = (3 + stats.overdriveLevel) * GAME.FPS; // 3s + 1s por nivel
        stats.overdriveCooldown = (20 - stats.overdriveLevel * 3) * GAME.FPS; // 20s - 3s por nivel
      }
    }
  }

  /**
   * Activa explosión automática desde torre aleatoria
   */
  _triggerAutoExplosion(player, stats) {
    const myTowers = this.towers.filter(t => t.player === player);
    if (myTowers.length > 0) {
      const tower = myTowers[Math.floor(Math.random() * myTowers.length)];
      const radius = 2 + stats.autoExplosionLevel;
      const conquered = this.grid.novaBlast(tower.col, tower.row, player, radius);
      
      for (const pos of conquered) {
        const px = pos.col * this._CW + this._CW / 2;
        const py = pos.row * this._CH + this._CH / 2;
        this.particles.push(...burst(px, py, player === 1 ? '#00cfff' : '#ff6a00', 6));
      }
      this._updateScores();
    }
  }

  /**
   * Activa meteorito en zona enemiga
   */
  _triggerMeteorite(player, stats) {
    const enemyPlayer = player === 1 ? 2 : 1;
    const enemyCells = [];
    
    // Encontrar celdas enemigas
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        if (this.grid.cells[r][c].owner === enemyPlayer) {
          enemyCells.push({ col: c, row: r });
        }
      }
    }
    
    if (enemyCells.length > 0) {
      const target = enemyCells[Math.floor(Math.random() * enemyCells.length)];
      const radius = 1 + stats.meteoriteLevel;
      const conquered = this.grid.novaBlast(target.col, target.row, player, radius);
      
      // Efecto visual de meteorito
      for (let i = 0; i < 20; i++) {
        const px = target.col * this._CW + this._CW / 2 + (Math.random() - 0.5) * this._CW;
        const py = target.row * this._CH + this._CH / 2 + (Math.random() - 0.5) * this._CH;
        this.particles.push(...burst(px, py, '#ff6600', 2));
      }
      
      this._updateScores();
    }
  }

  /**
   * Activa onda de choque que empuja frontera enemiga
   */
  _triggerShockwave(player, stats) {
    const pushDistance = 1 + stats.shockwaveLevel;
    const conquered = this.grid.pushTerritory(player, pushDistance);
    
    for (const pos of conquered) {
      const px = pos.col * this._CW + this._CW / 2;
      const py = pos.row * this._CH + this._CH / 2;
      this.particles.push(...burst(px, py, player === 1 ? '#00ffff' : '#ffaa00', 4));
    }
    this._updateScores();
  }

  /**
   * Encuentra objetivos cercanos para Multi Shot
   * UPDATED: Uses targeting behavior logic
   */
  _findNearbyTargets(tower, range, mainTargets) {
    const stats = this.stats[tower.player - 1];
    const nearby = [];
    const coneAngle = Math.PI / 2;
    const enemyPositions = this._enemyPositionCache[tower.player] || [];
    
    // Collect all valid targets in cone
    const validTargets = [];
    for (const enemy of enemyPositions) {
      const dx = enemy.col - tower.col;
      const dy = enemy.row - tower.row;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= range) {
        let targetAngle = Math.atan2(dy, dx);
        
        while (targetAngle < tower.angle - Math.PI) {
          targetAngle += Math.PI * 2;
        }
        while (targetAngle > tower.angle + Math.PI) {
          targetAngle -= Math.PI * 2;
        }
        
        const angleDiff = Math.abs(targetAngle - tower.angle);
        
        if (angleDiff <= coneAngle / 2) {
          const cell = this.grid.getCell(enemy.col, enemy.row);
          validTargets.push({ 
            col: enemy.col, 
            row: enemy.row, 
            dist: distance,
            hp: cell ? cell.hp : 1,
            maxhp: cell ? cell.maxhp : 1,
            isFrontline: this._isFrontlineCell(enemy.col, enemy.row, tower.player)
          });
        }
      }
    }
    
    // Apply targeting behavior
    let sortedTargets;
    switch (stats.targetingMode) {
      case 'closest':
        sortedTargets = validTargets.sort((a, b) => a.dist - b.dist);
        break;
      case 'weakest':
        sortedTargets = validTargets.sort((a, b) => (a.hp / a.maxhp) - (b.hp / b.maxhp));
        break;
      case 'frontline':
        sortedTargets = validTargets.sort((a, b) => {
          if (a.isFrontline && !b.isFrontline) return -1;
          if (!a.isFrontline && b.isFrontline) return 1;
          return a.dist - b.dist;
        });
        break;
      case 'random':
        sortedTargets = validTargets.sort(() => Math.random() - 0.5);
        break;
      default: // 'default'
        sortedTargets = validTargets.sort((a, b) => a.dist - b.dist);
        break;
    }
    
    return sortedTargets;
  }

  /**
   * Encuentra objetivos en un cono frente a la torre según su ángulo actual
   * UPDATED: Supports different targeting behaviors
   */
  _findTargetsInDirection(tower, range, count = 1) {
    const stats = this.stats[tower.player - 1];
    const targets = [];
    const coneAngle = Math.PI / 2; // 90 grados de cono de disparo
    const enemyPositions = this._enemyPositionCache[tower.player] || [];
    
    // Collect all valid targets in cone
    const validTargets = [];
    for (const enemy of enemyPositions) {
      const dx = enemy.col - tower.col;
      const dy = enemy.row - tower.row;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= range) {
        let targetAngle = Math.atan2(dy, dx);
        
        // Normalizar targetAngle al rango de tower.angle para comparación
        while (targetAngle < tower.angle - Math.PI) {
          targetAngle += Math.PI * 2;
        }
        while (targetAngle > tower.angle + Math.PI) {
          targetAngle -= Math.PI * 2;
        }
        
        const angleDiff = Math.abs(targetAngle - tower.angle);
        
        // Verificar si está dentro del cono
        if (angleDiff <= coneAngle / 2) {
          const cell = this.grid.getCell(enemy.col, enemy.row);
          validTargets.push({ 
            col: enemy.col, 
            row: enemy.row, 
            dist: distance,
            hp: cell ? cell.hp : 1,
            maxhp: cell ? cell.maxhp : 1,
            isFrontline: this._isFrontlineCell(enemy.col, enemy.row, tower.player)
          });
        }
      }
    }
    
    // Apply targeting behavior
    let sortedTargets;
    switch (stats.targetingMode) {
      case 'closest':
        sortedTargets = validTargets.sort((a, b) => a.dist - b.dist);
        break;
      case 'weakest':
        sortedTargets = validTargets.sort((a, b) => (a.hp / a.maxhp) - (b.hp / b.maxhp));
        break;
      case 'frontline':
        sortedTargets = validTargets.sort((a, b) => {
          if (a.isFrontline && !b.isFrontline) return -1;
          if (!a.isFrontline && b.isFrontline) return 1;
          return a.dist - b.dist;
        });
        break;
      case 'random':
        sortedTargets = validTargets.sort(() => Math.random() - 0.5);
        break;
      default: // 'default'
        sortedTargets = validTargets.sort((a, b) => a.dist - b.dist);
        break;
    }
    
    return sortedTargets.slice(0, count);
  }

  /**
   * Check if a cell is on the frontline (adjacent to enemy territory)
   */
  _isFrontlineCell(col, row, player) {
    const enemyPlayer = player === 1 ? 2 : 1;
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const neighborCell = this.grid.getCell(col + dc, row + dr);
      if (neighborCell && neighborCell.owner === enemyPlayer) {
        return true;
      }
    }
    return false;
  }

  // ----------------------------------------------------------
  // DRAW
  // ----------------------------------------------------------
  _draw() {
    console.log('Drawing frame...');
    this.renderer.clear();
    this.renderer.drawGrid(this.grid, this._CW, this._CH);
    this.renderer.drawBorders(this.grid, this._CW, this._CH);
    this.renderer.drawBullets(this.bullets);
    this.renderer.drawParticles(this.particles);
    this.renderer.drawDrones(this.drones, this._CW, this._CH);
    this.renderer.drawTowers(this.towers, this._CW, this._CH);
    this.renderer.drawInCanvasHUD(this.stats[0], this.stats[1]);
    
    // Actualizar HUD con habilidades
    this.hud.updateAbilities(this.stats[0], this.stats[1]);
  }

  // ----------------------------------------------------------
  // TIMER + UPGRADES (async loop)
  // ----------------------------------------------------------
  async _runTimerAndUpgrades() {
    while (this.running && this.gameTime > 0) {
      await sleep(1000);
      if (!this.running) break;
      this.gameTime--;
      this.hud.updateTimer(this.gameTime);

      if (this.gameTime <= 0) {
        this._endGame();
        break;
      }

      // Pausa para mejoras cada UPGRADE_INTERVAL segundos
      if (this.gameTime % GAME.UPGRADE_INTERVAL === 0) {
        this.running = false;

        // P1 elige
        const upg1 = await this.modal.show(1);
        if (upg1.pointCost && this.stats[0].upgradePoints >= upg1.pointCost) {
          upg1.apply(this.stats[0], 1);
          this.stats[0].upgradePoints -= upg1.pointCost;
          this._handleSpecialPower(1, upg1);
        }

        await sleep(300);

        // P2 elige
        const upg2 = await this.modal.show(2);
        if (upg2.pointCost && this.stats[1].upgradePoints >= upg2.pointCost) {
          upg2.apply(this.stats[1], 2);
          this.stats[1].upgradePoints -= upg2.pointCost;
          this._handleSpecialPower(2, upg2);
        }

        this.running = true;
      }
    }
  }

  /**
   * Maneja poderes especiales con efectos inmediatos
   */
  _handleSpecialPower(player, power) {
    const stats = this.stats[player - 1];
    const color  = player === 1 ? '#00cfff' : '#ff6a00';

    // Poderes clásicos con efectos inmediatos
    if (power.id === 'spread') {
      const conquered = this.grid.expandTerritory(player, 20);
      for (const pos of conquered) {
        const px = pos.col * this._CW + this._CW / 2;
        const py = pos.row * this._CH + this._CH / 2;
        this.particles.push(...burst(px, py, color, 3));
      }
      this._updateScores();
    }

    if (power.id === 'nova') {
      // Elegir una torre aleatoria del jugador y hacer explotar
      const myTowers = this.towers.filter(t => t.player === player);
      if (myTowers.length > 0) {
        const t = myTowers[Math.floor(Math.random() * myTowers.length)];
        const conquered = this.grid.novaBlast(t.col, t.row, player);
        for (const pos of conquered) {
          const px = pos.col * this._CW + this._CW / 2;
          const py = pos.row * this._CH + this._CH / 2;
          this.particles.push(...burst(px, py, color, 4));
        }
        t.levelUp();
        this._updateScores();
      }
      stats.pendingNova = false;
    }
    
    // Defensive powers with immediate effects
    if (power.id === 'shield') {
      this.grid.applyShields(player, 2 * stats.shieldLevel, stats.shieldDuration);
      // Visual feedback for shield application
      for (let r = 0; r < this.grid.rows; r++) {
        for (let c = 0; c < this.grid.cols; c++) {
          const cell = this.grid.getCell(c, r);
          if (cell && cell.owner === player) {
            const px = c * this._CW + this._CW / 2;
            const py = r * this._CH + this._CH / 2;
            this.particles.push(...burst(px, py, '#00ff00', 1));
          }
        }
      }
    }
    
    if (power.id === 'fortification') {
      this.grid.fortifyCells(player, stats.cellBonusHP);
      // Visual feedback for fortification
      for (let r = 0; r < this.grid.rows; r++) {
        for (let c = 0; c < this.grid.cols; c++) {
          const cell = this.grid.getCell(c, r);
          if (cell && cell.owner === player && cell.fortified) {
            const px = c * this._CW + this._CW / 2;
            const py = r * this._CH + this._CH / 2;
            this.particles.push(...burst(px, py, '#8b4513', 1));
          }
        }
      }
    }
    
    // Actualizar drones inmediatamente si se cambia el nivel
    if (power.id === 'drones') {
      this._syncDronesWithPowerLevels();
    }
  }

  _updateScores() {
    const cnt = this.grid.count();
    this.hud.updateScores(cnt.p1pct);
  }

  _endGame() {
    this.running = false;
    clearInterval(this.tickInt);
    const cnt = this.grid.count();
    this.modal.showResult(cnt.p1pct);
  }
}
