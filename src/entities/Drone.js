// ============================================================
// Drone.js — Drones orbitantes para torres
// ============================================================

import { COLORS } from '../utils/constants.js';

export class Drone {
  /**
   * @param {number} player - 1 o 2
   * @param {number} towerCol, towerRow - posición de la torre
   * @param {number} orbitRadius - radio de órbita
   * @param {number} angle - ángulo inicial en radianes
   */
  constructor(player, towerCol, towerRow, orbitRadius = 30, angle = 0) {
    this.player = player;
    this.towerCol = towerCol;
    this.towerRow = towerRow;
    this.orbitRadius = orbitRadius;
    this.angle = angle;
    this.orbitSpeed = 0.02; // radianes por frame
    this.shootCooldown = 0;
    this.shootInterval = 90; // frames entre disparos (3s a 30fps)
    this.damage = 1;
    this.radius = 4;
    this.color = player === 1 ? COLORS.P1 : COLORS.P2;
    this.dead = false;
  }

  /**
   * Actualiza posición del drone y cooldown de disparo
   */
  update() {
    // Rotación orbital
    this.angle += this.orbitSpeed;
    if (this.angle > Math.PI * 2) {
      this.angle -= Math.PI * 2;
    }

    // Cooldown de disparo
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
  }

  /**
   * Obtiene posición actual del drone en coordenadas de pantalla
   */
  getPosition(cellWidth, cellHeight) {
    const towerX = this.towerCol * cellWidth + cellWidth / 2;
    const towerY = this.towerRow * cellHeight + cellHeight / 2;
    
    return {
      x: towerX + Math.cos(this.angle) * this.orbitRadius,
      y: towerY + Math.sin(this.angle) * this.orbitRadius
    };
  }

  /**
   * Verifica si el drone puede disparar
   */
  canShoot() {
    return this.shootCooldown <= 0;
  }

  /**
   * Realiza un disparo
   */
  shoot() {
    this.shootCooldown = this.shootInterval;
  }

  /**
   * Busca el objetivo más cercano para disparar
   */
  findTarget(grid, cellWidth, cellHeight) {
    const pos = this.getPosition(cellWidth, cellHeight);
    const gridCol = Math.floor(pos.x / cellWidth);
    const gridRow = Math.floor(pos.y / cellHeight);
    
    let best = null;
    let bestDist = Infinity;
    const range = 8; // celdas de alcance
    
    for (let r = Math.max(0, gridRow - range); r < Math.min(grid.rows, gridRow + range + 1); r++) {
      for (let c = Math.max(0, gridCol - range); c < Math.min(grid.cols, gridCol + range + 1); c++) {
        if (grid.cells[r][c].owner !== this.player) {
          const dist = Math.sqrt(Math.pow(c - gridCol, 2) + Math.pow(r - gridRow, 2));
          if (dist <= range && dist < bestDist) {
            bestDist = dist;
            best = { col: c, row: r };
          }
        }
      }
    }
    
    return best;
  }
}

/**
 * Crea drones para una torre según el nivel
 */
export function createDronesForTower(tower, level) {
  const drones = [];
  const droneCount = level;
  
  for (let i = 0; i < droneCount; i++) {
    const angle = (Math.PI * 2 / droneCount) * i;
    const orbitRadius = 25 + level * 3;
    drones.push(new Drone(tower.player, tower.col, tower.row, orbitRadius, angle));
  }
  
  return drones;
}
