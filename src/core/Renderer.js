// ============================================================
// Renderer.js — Todo el dibujado en canvas
// ============================================================

import { COLORS, GRID } from '../utils/constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  get W() { return this.canvas.width; }
  get H() { return this.canvas.height; }

  clear() {
    this.ctx.clearRect(0, 0, this.W, this.H);
  }

  // ----------------------------------------------------------
  // GRILLA DE TERRITORIO
  // ----------------------------------------------------------
  drawGrid(grid, CW, CH) {
    const { ctx } = this;
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const cell = grid.cells[r][c];
        const x = c * CW, y = r * CH;
        ctx.fillStyle = cell.owner === 1 ? COLORS.P1_BG : COLORS.P2_BG;
        ctx.fillRect(x, y, CW, CH);
      }
    }
  }

  // ----------------------------------------------------------
  // BORDES NEÓN ENTRE TERRITORIOS
  // ----------------------------------------------------------
  drawBorders(grid, CW, CH) {
    const { ctx } = this;
    ctx.save();

    // Bordes horizontales (entre filas)
    for (let r = 0; r < grid.rows - 1; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.cells[r][c].owner !== grid.cells[r + 1][c].owner) {
          const x = c * CW, y = (r + 1) * CH;
          const frontIsP1 = grid.cells[r][c].owner === 1;
          this._drawNeonLine(x, y, x + CW, y, frontIsP1);
        }
      }
    }

    // Bordes verticales (entre columnas)
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols - 1; c++) {
        if (grid.cells[r][c].owner !== grid.cells[r][c + 1].owner) {
          const x = (c + 1) * CW, y = r * CH;
          const frontIsP1 = grid.cells[r][c].owner === 1;
          this._drawNeonLine(x, y, x, y + CH, frontIsP1, true);
        }
      }
    }

    ctx.restore();
  }

  _drawNeonLine(x1, y1, x2, y2, frontIsP1, vertical = false) {
    const { ctx } = this;
    const c1 = frontIsP1 ? COLORS.P1 : COLORS.P2;
    const c2 = frontIsP1 ? COLORS.P2 : COLORS.P1;
    const grd = vertical
      ? ctx.createLinearGradient(x1 - 4, 0, x1 + 4, 0)
      : ctx.createLinearGradient(0, y1 - 4, 0, y1 + 4);
    grd.addColorStop(0, c1 + 'cc');
    grd.addColorStop(0.5, '#ffffffaa');
    grd.addColorStop(1, c2 + 'cc');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ----------------------------------------------------------
  // TORRES
  // ----------------------------------------------------------
  drawTowers(towers, CW, CH) {
    for (const t of towers) this.drawTower(t, CW, CH);
  }

  drawTower(tower, CW, CH) {
    const { ctx } = this;
    const x = tower.col * CW + CW / 2;
    const y = tower.row * CH + CH / 2;
    const color = tower.player === 1 ? COLORS.P1 : COLORS.P2;
    const r = Math.min(CW, CH) * 0.55;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;

    // Anillo exterior
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Interior oscuro
    ctx.fillStyle = tower.player === 1 ? '#001520' : '#150800';
    ctx.beginPath();
    ctx.arc(x, y, r - 2, 0, Math.PI * 2);
    ctx.fill();

    // Puntos de nivel
    ctx.fillStyle = color;
    ctx.shadowBlur = 6;
    for (let i = 0; i < tower.level; i++) {
      const angle = (i / tower.level) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(angle) * (r * 0.5),
        y + Math.sin(angle) * (r * 0.5),
        2, 0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  // ----------------------------------------------------------
  // BALAS
  // ----------------------------------------------------------
  drawBullets(bullets) {
    const { ctx } = this;
    for (const b of bullets) {
      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Trail
      ctx.shadowBlur = 0;
      for (let i = 0; i < b.trail.length; i++) {
        ctx.globalAlpha = (i / b.trail.length) * 0.3;
        ctx.beginPath();
        ctx.arc(b.trail[i].x, b.trail[i].y, b.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ----------------------------------------------------------
  // PARTÍCULAS
  // ----------------------------------------------------------
  drawParticles(particles) {
    const { ctx } = this;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = COLORS.PARTICLE_GLOW;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      ctx.restore();
    }
  }

  // ----------------------------------------------------------
  // HUD IN-CANVAS (stats debajo de cada mitad)
  // ----------------------------------------------------------
  drawInCanvasHUD(stats1, stats2) {
    const { ctx } = this;
    ctx.save();
    ctx.font = '9px Orbitron, monospace';

    ctx.fillStyle = 'rgba(0,207,255,0.35)';
    ctx.textAlign = 'left';
    ctx.fillText(`DMG:${stats1.dmg} RNG:${stats1.range.toFixed(1)} SPD:${stats1.rate.toFixed(1)} BALAS:${stats1.bullets}`, 8, 14);

    ctx.fillStyle = 'rgba(255,106,0,0.35)';
    ctx.textAlign = 'right';
    ctx.fillText(`DMG:${stats2.dmg} RNG:${stats2.range.toFixed(1)} SPD:${stats2.rate.toFixed(1)} BALAS:${stats2.bullets}`, this.W - 8, this.H - 5);

    ctx.restore();
  }
}
