// ============================================================
// Game.js — Loop principal y coordinación de todo el juego
// ============================================================

import { Grid }          from './Grid.js';
import { Renderer }      from './Renderer.js';
import { Tower, createInitialTowers } from '../entities/Tower.js';
import { Bullet, burst } from '../entities/Bullet.js';
import { Particle }      from '../entities/Bullet.js';
import { HUD }           from '../ui/HUD.js';
import { UpgradeModal }  from '../ui/UpgradeModal.js';
import { GAME, TOWER, INITIAL_STATS } from '../utils/constants.js';
import { sleep }         from '../utils/helpers.js';

export class Game {
  constructor(canvas) {
    this.canvas   = canvas;
    this.renderer = new Renderer(canvas);
    this.hud      = new HUD();
    this.modal    = new UpgradeModal();

    this.grid      = null;
    this.towers    = [];
    this.bullets   = [];
    this.particles = [];
    this.stats     = [INITIAL_STATS(), INITIAL_STATS()];

    this.running   = false;
    this.gameTime  = GAME.DURATION;
    this.tickInt   = null;

    this._CW = 0;
    this._CH = 0;

    this._bindResize();
  }

  // ----------------------------------------------------------
  // SETUP
  // ----------------------------------------------------------
  resize() {
    this.canvas.width  = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    if (this.grid) {
      this._CW = this.canvas.width  / this.grid.cols;
      this._CH = this.canvas.height / this.grid.rows;
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
    this.resize();
    this._initGrid();
    this.towers    = createInitialTowers(this.grid.cols, this.grid.rows);
    this.bullets   = [];
    this.particles = [];
    this.stats     = [INITIAL_STATS(), INITIAL_STATS()];
    this.gameTime  = GAME.DURATION;
    this.running   = true;

    this.tickInt = setInterval(() => this._tick(), 1000 / GAME.FPS);
    this._runTimerAndUpgrades();
    this._draw();
  }

  // ----------------------------------------------------------
  // GAME TICK (30fps)
  // ----------------------------------------------------------
  _tick() {
    if (!this.running) return;

    // Update tower rotation
    for (const tower of this.towers) {
      const stats = this.stats[tower.player - 1];
      tower.updateRotation(stats);
    }

    // Towers shoot
    for (const tower of this.towers) {
      const stats = this.stats[tower.player - 1];
      if (tower.tick(stats)) {
        this._shootFrom(tower, stats);
      }
    }

    // Move bullets
    const toRemove = [];
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      const arrived = b.update();
      if (arrived) {
        const stats   = this.stats[b.player - 1];
        const spread  = stats.spreadBonus || 0;
        const conquered = this.grid.damageCell(b.targetCol, b.targetRow, b.player, b.dmg, spread);
        if (conquered) {
          const px = b.targetCol * this._CW + this._CW / 2;
          const py = b.targetRow * this._CH + this._CH / 2;
          this.particles.push(...burst(px, py, b.color));
          this._updateScores();
        }
        toRemove.push(i);
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) this.bullets.splice(toRemove[i], 1);

    // Update particles
    for (const p of this.particles) p.update();
    this.particles = this.particles.filter(p => !p.dead);

    this._draw();
  }

  _shootFrom(tower, stats) {
    const range   = tower.getRange(stats);
    const targets = this._findTargetsInDirection(tower, range, stats.bullets);
    const color   = tower.player === 1 ? '#00cfff' : '#ff6a00';

    for (const tgt of targets) {
      const sx = tower.col * this._CW + this._CW / 2;
      const sy = tower.row * this._CH + this._CH / 2;
      const tx = tgt.col   * this._CW + this._CW / 2;
      const ty = tgt.row   * this._CH + this._CH / 2;
      const speed = TOWER.BULLET_SPEED_BASE + stats.rate;

      this.bullets.push(new Bullet(tower.player, sx, sy, tx, ty, tgt.col, tgt.row, stats.dmg, speed));
    }
  }

  /**
   * Encuentra objetivos en un cono frente a la torre según su ángulo actual
   */
  _findTargetsInDirection(tower, range, count = 1) {
    const targets = [];
    const coneAngle = Math.PI / 2; // 90 grados de cono de disparo (aumentado de 60)
    
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        if (this.grid.cells[r][c].owner !== tower.player) {
          // Calcular ángulo hacia la celda
          const dx = c - tower.col;
          const dy = r - tower.row;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= range) {
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - tower.angle;
            
            // Normalizar diferencia de ángulo
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Verificar si está dentro del cono
            if (Math.abs(angleDiff) <= coneAngle / 2) {
              targets.push({ col: c, row: r, dist: distance });
            }
          }
        }
      }
    }
    
    return targets.sort((a, b) => a.dist - b.dist).slice(0, count);
  }

  // ----------------------------------------------------------
  // DRAW
  // ----------------------------------------------------------
  _draw() {
    this.renderer.clear();
    this.renderer.drawGrid(this.grid, this._CW, this._CH);
    this.renderer.drawBorders(this.grid, this._CW, this._CH);
    this.renderer.drawBullets(this.bullets);
    this.renderer.drawParticles(this.particles);
    this.renderer.drawTowers(this.towers, this._CW, this._CH);
    this.renderer.drawInCanvasHUD(this.stats[0], this.stats[1]);
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
        upg1.apply(this.stats[0], 1);
        this._handleSpecialUpgrade(1, upg1);

        await sleep(300);

        // P2 elige
        const upg2 = await this.modal.show(2);
        upg2.apply(this.stats[1], 2);
        this._handleSpecialUpgrade(2, upg2);

        this.running = true;
      }
    }
  }

  /**
   * Algunos upgrades tienen efectos inmediatos (spread, nova)
   */
  _handleSpecialUpgrade(player, upg) {
    const stats = this.stats[player - 1];
    const color  = player === 1 ? '#00cfff' : '#ff6a00';

    if (upg.id === 'spread') {
      const conquered = this.grid.expandTerritory(player, 20);
      for (const pos of conquered) {
        const px = pos.col * this._CW + this._CW / 2;
        const py = pos.row * this._CH + this._CH / 2;
        this.particles.push(...burst(px, py, color, 3));
      }
      this._updateScores();
    }

    if (upg.id === 'nova') {
      // Elegí una torre aleatoria del jugador y hacé explotar
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
