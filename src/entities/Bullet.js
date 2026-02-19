// ============================================================
// Bullet.js — Proyectiles y partículas
// ============================================================

import { TOWER, COLORS } from '../utils/constants.js';

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
