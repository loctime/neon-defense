// ============================================================
// Grid.js — Mapa, celdas y lógica de conquista de territorio
// ============================================================

import { GRID } from '../utils/constants.js';

export class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = []; // cells[row][col] = { owner, hp, maxhp, shield, fortified }
    this.init();
  }

  init() {
    const mid = Math.floor(this.rows / 2);
    this.cells = [];
    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const owner = r < mid ? 1 : 2;
        this.cells[r][c] = { 
          owner, 
          hp: GRID.CELL_HP, 
          maxhp: GRID.CELL_HP,
          shield: 0,        // Temporary shield HP
          fortified: false   // Permanent fortification status
        };
      }
    }
  }

  getCell(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.cells[row][col];
  }

  /**
   * Inflige daño a una celda. Si hp llega a 0, la conquista.
   * UPDATED: Handles shields and fortification
   * @returns {boolean} true si la celda fue conquistada
   */
  damageCell(col, row, player, dmg, spreadBonus = 0, playerStats = null) {
    const cell = this.getCell(col, row);
    if (!cell || cell.owner === player) return false;

    let actualDamage = dmg;
    
    // Apply defensive bonuses if player stats are provided
    if (playerStats) {
      const maxHP = GRID.CELL_HP + (playerStats.cellBonusHP || 0);
      
      // Apply shield first (temporary HP)
      if (cell.shield > 0) {
        const shieldDamage = Math.min(cell.shield, actualDamage);
        cell.shield -= shieldDamage;
        actualDamage -= shieldDamage;
      }
      
      // Fortified cells take 50% reduced damage
      if (cell.fortified) {
        actualDamage = Math.floor(actualDamage * 0.5);
      }
      
      // Update max HP for fortified cells
      if (cell.fortified && cell.maxhp === GRID.CELL_HP) {
        cell.maxhp = maxHP;
        cell.hp = Math.min(cell.hp + (maxHP - GRID.CELL_HP), maxHP);
      }
    }

    if (actualDamage > 0) {
      cell.hp -= actualDamage;
      if (cell.hp <= 0) {
        this.conquerCell(col, row, player);
        this.spreadDamage(col, row, player, spreadBonus);
        return true;
      }
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
   * Aplica escudos temporales a las celdas de un jugador
   */
  applyShields(player, shieldHP, duration) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        if (cell.owner === player) {
          cell.shield = Math.max(cell.shield, shieldHP);
          cell.shieldDuration = duration;
        }
      }
    }
  }

  /**
   * Fortifica las celdas de un jugador permanentemente
   */
  fortifyCells(player, bonusHP) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        if (cell.owner === player && !cell.fortified) {
          cell.fortified = true;
          cell.maxhp += bonusHP;
          cell.hp += bonusHP;
        }
      }
    }
  }

  /**
   * Regenera celdas perdidas lentamente
   */
  regenerateCells(player, regenRate) {
    const frontier = [];
    
    // Encontrar frontera para regeneración
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].owner === player) {
          // Buscar celdas vecinas enemigas
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const neighborCell = this.getCell(c + dc, r + dr);
            if (neighborCell && neighborCell.owner !== player && neighborCell.owner !== 0) {
              frontier.push({ col: c + dc, row: r + dr });
            }
          }
        }
      }
    }
    
    // Regenerar celdas en frontera
    if (frontier.length > 0 && Math.random() < regenRate * 0.1) {
      const target = frontier[Math.floor(Math.random() * frontier.length)];
      const cell = this.getCell(target.col, target.row);
      if (cell) {
        cell.hp = Math.max(1, cell.hp - 1);
        if (cell.hp <= 0) {
          this.conquerCell(target.col, target.row, player);
        }
      }
    }
  }

  /**
   * Actualiza duración de escudos
   */
  updateShields() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        if (cell.shieldDuration > 0) {
          cell.shieldDuration--;
          if (cell.shieldDuration <= 0) {
            cell.shield = 0;
          }
        }
      }
    }
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
   * Empuja frontera enemiga hacia atrás (poder Onda de Choque)
   */
  pushTerritory(player, distance) {
    const conquered = [];
    const enemyPlayer = player === 1 ? 2 : 1;
    
    // Encontrar frontera enemiga y empujar hacia atrás
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].owner === enemyPlayer) {
          // Verificar si está cerca de territorio aliado
          let nearAlly = false;
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const neighborCell = this.getCell(c + dc, r + dr);
            if (neighborCell && neighborCell.owner === player) {
              nearAlly = true;
              break;
            }
          }
          
          if (nearAlly) {
            // Calcular dirección de empuje (alejarse del jugador)
            const playerCenter = this._getPlayerCenter(player);
            const dx = c - playerCenter.col;
            const dy = r - playerCenter.row;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
              const pushCol = Math.round(c + (dx / dist) * distance);
              const pushRow = Math.round(r + (dy / dist) * distance);
              
              // Mover celda enemiga si está en bounds
              if (pushCol >= 0 && pushCol < this.cols && pushRow >= 0 && pushRow < this.rows) {
                const targetCell = this.getCell(pushCol, pushRow);
                if (targetCell && targetCell.owner === enemyPlayer) {
                  this.conquerCell(c, r, player);
                  conquered.push({ col: c, row: r });
                }
              }
            }
          }
        }
      }
    }
    
    return conquered;
  }
  
  /**
   * Calcula el centro de territorio de un jugador
   */
  _getPlayerCenter(player) {
    let sumCol = 0, sumRow = 0, count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].owner === player) {
          sumCol += c;
          sumRow += r;
          count++;
        }
      }
    }
    return {
      col: Math.round(sumCol / count),
      row: Math.round(sumRow / count)
    };
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
