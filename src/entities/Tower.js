// ============================================================
// Tower.js — Clase Torre
// ============================================================

import { TOWER } from '../utils/constants.js';

export class Tower {
  /**
   * @param {number} player - 1 o 2
   * @param {number} col - columna en la grilla
   * @param {number} row - fila en la grilla
   * @param {string} type - 'basic' | 'rapid' | 'ray' | 'blast' (futuro)
   */
  constructor(player, col, row, type = 'basic') {
    this.player = player;
    this.col = col;
    this.row = row;
    this.type = type;
    this.level = 1;
    this.cooldown = 0;
    
    // Movimiento rotatorio
    this.angle = player === 1 ? 0 : Math.PI; // P1 apunta hacia abajo, P2 hacia arriba
    this.rotationSpeed = 0.02; // radianes por frame (movimiento lento)
  }

  /**
   * Actualiza el cooldown. Devuelve true cuando puede disparar.
   * @param {object} stats - stats del jugador (rate, etc.)
   */
  tick(stats) {
    this.cooldown--;
    const rate = Math.floor(TOWER.BASE_COOLDOWN / stats.rate);
    if (this.cooldown <= 0) {
      this.cooldown = rate;
      return true; // puede disparar
    }
    return false;
  }

  /**
   * Actualiza el movimiento rotatorio de la torre
   */
  updateRotation() {
    this.angle += this.rotationSpeed;
    // Mantener el ángulo en el rango [0, 2π]
    if (this.angle > Math.PI * 2) {
      this.angle -= Math.PI * 2;
    }
  }

  /**
   * Calcula el rango de disparo basado en stats y nivel
   */
  getRange(stats) {
    // rango completo - las torres siempre pueden alcanzar todo el mapa
    return Infinity;
  }

  levelUp() {
    this.level = Math.min(this.level + 1, 5);
  }
}

/**
 * Crea una torre por jugador en los bordes del mapa.
 * P1 en el borde superior, P2 en el borde inferior.
 */
export function createInitialTowers(cols, rows) {
  const towers = [];
  
  // P1 — torre en el borde superior centrada
  const p1Col = Math.floor(cols / 2);
  const p1Row = 0; // primera fila (borde superior)
  towers.push(new Tower(1, p1Col, p1Row));
  
  // P2 — torre en el borde inferior centrada
  const p2Col = Math.floor(cols / 2);
  const p2Row = rows - 1; // última fila (borde inferior)
  towers.push(new Tower(2, p2Col, p2Row));
  
  return towers;
}
