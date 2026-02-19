// ============================================================
// Grid.js — Mapa, celdas y lógica de conquista de territorio
// ============================================================

import { GRID } from '../utils/constants.js';

export class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = []; // cells[row][col] = { owner, hp, maxhp }
    this.init();
  }

  init() {
    const mid = Math.floor(this.rows / 2);
    this.cells = [];
    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const owner = r < mid ? 1 : 2;
        this.cells[r][c] = { owner, hp: GRID.CELL_HP, maxhp: GRID.CELL_HP };
      }
    }
  }

  getCell(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.cells[row][col];
  }

  /**
   * Inflige daño a una celda. Si hp llega a 0, la conquista.
   * @returns {boolean} true si la celda fue conquistada
   */
  damageCell(col, row, player, dmg, spreadBonus = 0) {
    const cell = this.getCell(col, row);
    if (!cell || cell.owner === player) return false;

    cell.hp -= dmg;
    if (cell.hp <= 0) {
      this.conquerCell(col, row, player);
      this.spreadDamage(col, row, player, spreadBonus);
      return true;
    }
    return false;
  }

  conquerCell(col, row, player) {
    const cell = this.getCell(col, row);
    if (!cell) return;
    cell.owner = player;
    cell.hp = cell.maxhp;
  }

  /**
   * Propaga daño ligero a celdas vecinas tras conquistar
   */
  spreadDamage(col, row, player, spreadBonus) {
    const neighbors = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of neighbors) {
      const cell = this.getCell(col + dc, row + dr);
      if (cell && cell.owner !== player) {
        const chance = GRID.SPREAD_CHANCE + spreadBonus * 0.05;
        if (Math.random() < chance) {
          cell.hp = Math.max(1, cell.hp - 1);
        }
      }
    }
  }

  /**
   * Conquista territorio en un radio (poder Supernova)
   */
  novaBlast(centerCol, centerRow, player, radius = 5) {
    const conquered = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.sqrt(dr * dr + dc * dc) <= radius) {
          const r = centerRow + dr, c = centerCol + dc;
          const cell = this.getCell(c, r);
          if (cell && cell.owner !== player) {
            this.conquerCell(c, r, player);
            conquered.push({ col: c, row: r });
          }
        }
      }
    }
    return conquered;
  }

  /**
   * Expande territorio orgánicamente desde el frente (poder Expansión)
   */
  expandTerritory(player, amount = 20) {
    const frontline = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].owner === player) {
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const cell = this.getCell(c + dc, r + dr);
            if (cell && cell.owner !== player) {
              frontline.push({ col: c + dc, row: r + dr });
            }
          }
        }
      }
    }
    // Shuffle y tomar `amount` celdas
    frontline.sort(() => Math.random() - 0.5);
    const toConquer = frontline.slice(0, amount);
    for (const pos of toConquer) {
      this.conquerCell(pos.col, pos.row, player);
    }
    return toConquer;
  }

  /**
   * Cuenta territorio por jugador
   */
  count() {
    let p1 = 0, p2 = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].owner === 1) p1++;
        else p2++;
      }
    }
    const total = p1 + p2;
    return { p1, p2, total, p1pct: Math.round(p1 / total * 100) };
  }

  /**
   * Encontrá la celda enemiga más cercana a una posición
   */
  findClosestEnemy(col, row, player, range) {
    let best = null, bestDist = Infinity;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].owner !== player) {
          const d = Math.sqrt((c - col) ** 2 + (r - row) ** 2);
          if (d <= range && d < bestDist) {
            bestDist = d;
            best = { col: c, row: r, dist: d };
          }
        }
      }
    }
    return best;
  }

  /**
   * Encontrá las N celdas enemigas más cercanas (para multibala)
   */
  findClosestEnemies(col, row, player, range, count = 1) {
    const targets = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].owner !== player) {
          const d = Math.sqrt((c - col) ** 2 + (r - row) ** 2);
          if (d <= range) targets.push({ col: c, row: r, dist: d });
        }
      }
    }
    return targets.sort((a, b) => a.dist - b.dist).slice(0, count);
  }
}
