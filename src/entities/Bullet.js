// ============================================================
// Bullet.js — Proyectiles y partículas
// ============================================================

import { TOWER, COLORS } from '../utils/constants.js';

export class LaserBeam {
  /**
   * @param {number} player
   * @param {number} x, y  - posición inicial en px
   * @param {number} tx, ty - posición destino en px
   * @param {number} targetCol, targetRow - celda destino
   * @param {number} dmg
   * @param {number} level - nivel de penetración
   */
  constructor(player, x, y, tx, ty, targetCol, targetRow, dmg, level) {
    this.player = player;
    this.x = x;
    this.y = y;
    this.tx = tx;
    this.ty = ty;
    this.targetCol = targetCol;
    this.targetRow = targetRow;
    this.dmg = dmg;
    this.level = level;
    this.penetration = level; // celdas que puede atravesar
    this.width = 2 + level * 0.5;
    this.color = player === 1 ? '#00ffff' : '#ff8800';
    this.dead = false;
    this.hitCells = []; // celdas ya dañadas por este laser
  }

  /**
   * Los lasers no se mueven, impactan instantáneamente
   */
  update() {
    this.dead = true;
    return true;
  }

  /**
   * Calcula todas las celdas que atraviesa el laser
   */
  getPenetratedPath(startCol, startRow, endCol, endRow) {
    const cells = [];
    const dx = Math.abs(endCol - startCol);
    const dy = Math.abs(endRow - startRow);
    const sx = startCol < endCol ? 1 : -1;
    const sy = startRow < endRow ? 1 : -1;
    let err = dx - dy;
    let col = startCol;
    let row = startRow;

    cells.push({ col, row });

    while (col !== endCol || row !== endRow) {
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        col += sx;
      }
      if (e2 < dx) {
        err += dx;
        row += sy;
      }
      cells.push({ col, row });
      
      // Limitar penetración
      if (cells.length > this.penetration + 1) break;
    }

    return cells;
  }
}

export class Bullet {
  /**
   * @param {number} player
   * @param {number} x, y  - posición inicial en px
   * @param {number} tx, ty - posición destino en px
   * @param {number} targetCol, targetRow - celda destino
   * @param {number} dmg
   * @param {number} speed
   */
  constructor(player, x, y, tx, ty, targetCol, targetRow, dmg, speed) {
    this.player = player;
    this.x = x;
    this.y = y;
    this.tx = tx;
    this.ty = ty;
    this.targetCol = targetCol;
    this.targetRow = targetRow;
    this.dmg = dmg;
    this.speed = speed;
    this.radius = 3;
    this.trail = [];
    this.color = player === 1 ? COLORS.P1 : COLORS.P2;
    this.dead = false;
  }

  /**
   * Mueve la bala. Devuelve true si llegó al destino.
   */
  update() {
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.pop();

    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < this.speed) {
      this.dead = true;
      return true; // llegó
    }

    this.x += (dx / d) * this.speed;
    this.y += (dy / d) * this.speed;
    return false;
  }

  /**
   * Busca enemigos cercanos para ricochet
   */
  findRicochetTarget(grid, player) {
    const searchRadius = 5;
    const targets = [];
    
    for (let r = Math.max(0, this.targetRow - searchRadius); r < Math.min(grid.rows, this.targetRow + searchRadius + 1); r++) {
      for (let c = Math.max(0, this.targetCol - searchRadius); c < Math.min(grid.cols, this.targetCol + searchRadius + 1); c++) {
        if (grid.cells[r][c].owner !== player && !(r === this.targetRow && c === this.targetCol)) {
          const dist = Math.sqrt(Math.pow(c - this.targetCol, 2) + Math.pow(r - this.targetRow, 2));
          if (dist <= searchRadius) {
            targets.push({ col: c, row: r, dist });
          }
        }
      }
    }
    
    return targets.sort((a, b) => a.dist - b.dist)[0];
  }
}

export class Particle {
  constructor(x, y, color, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx ?? (Math.random() - 0.5) * 4;
    this.vy = vy ?? (Math.random() - 0.5) * 4;
    this.color = color;
    this.alpha = 1;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.025;
    if (this.alpha <= 0) this.dead = true;
  }
}

/**
 * Crea una ráfaga de partículas en una posición
 */
export function burst(x, y, color, count = 6) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
  return particles;
}
