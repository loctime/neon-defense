// ============================================================
// UpgradeModal.js — Modal de selección de mejoras
// ============================================================

import { UPGRADES } from '../utils/constants.js';
import { pickRandom } from '../utils/helpers.js';

export class UpgradeModal {
  constructor() {
    this.el       = document.getElementById('modal');
    this.elPlayer = document.getElementById('modal-player');
    this.elTitle  = document.getElementById('modal-title');
    this.elGrid   = document.getElementById('upg-grid');
  }

  /**
   * Muestra el modal para un jugador y resuelve con la mejora elegida.
   * @param {number} player - 1 o 2
   * @returns {Promise<object>} - el upgrade elegido
   */
  show(player) {
    return new Promise(resolve => {
      const color = player === 1 ? '#00cfff' : '#ff6a00';
      this.elPlayer.textContent = `JUGADOR ${player}`;
      this.elPlayer.style.color = color;
      this.elTitle.textContent  = 'ELEGÍ UNA MEJORA';
      this.elTitle.style.color  = color;

      const options = pickRandom(UPGRADES, 4);
      this.elGrid.innerHTML = '';

      for (const upg of options) {
        const btn = document.createElement('button');
        btn.className = 'upg-btn';
        btn.style.borderColor = color + '55';
        btn.innerHTML = `
          <span class="upg-icon">${upg.icon}</span>
          <span class="upg-name" style="color:${color}">${upg.name}</span>
          <span class="upg-desc">${upg.desc}</span>
        `;
        btn.addEventListener('click', () => {
          this.hide();
          resolve(upg);
        });
        // Feedback táctil
        btn.addEventListener('touchstart', () => { btn.style.background = '#111'; }, { passive: true });
        btn.addEventListener('touchend',   () => { btn.style.background = ''; }, { passive: true });
        this.elGrid.appendChild(btn);
      }

      this.el.classList.add('show');
    });
  }

  /**
   * Muestra pantalla de fin de juego
   */
  showResult(p1pct) {
    const p2pct = 100 - p1pct;
    const winner = p1pct > 50 ? 1 : p1pct < 50 ? 2 : 0;
    const color = winner === 1 ? '#00cfff' : winner === 2 ? '#ff6a00' : '#fff';

    this.elPlayer.textContent = 'PARTIDA TERMINADA';
    this.elPlayer.style.color = '#555';
    this.elTitle.textContent  = winner === 0 ? 'EMPATE ✦' : `JUGADOR ${winner} GANA`;
    this.elTitle.style.color  = color;

    this.elGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:#555;font-size:10px;letter-spacing:2px;padding:8px 0">
        P1: ${p1pct}% &nbsp;|&nbsp; P2: ${p2pct}%
      </div>
      <button class="upg-btn" style="grid-column:1/-1;border-color:${color}44" onclick="location.reload()">
        <span class="upg-icon">🔄</span>
        <span class="upg-name" style="color:${color}">REVANCHA</span>
      </button>
    `;

    this.el.classList.add('show');
  }

  hide() {
    this.el.classList.remove('show');
  }
}
