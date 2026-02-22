// ============================================================
// UpgradeModal.js — Modal de selección de mejoras
// ============================================================

import { POWERS_ARRAY } from '../utils/constants.js';
import { pickRandom } from '../utils/helpers.js';

export class UpgradeModal {
  constructor() {
    this.el       = document.getElementById('modal');
    this.elPlayer = document.getElementById('modal-player');
    this.elTitle  = document.getElementById('modal-title');
    this.elGrid   = document.getElementById('upg-grid');
  }

  /**
   * Muestra el modal para un jugador y resuelve con el poder elegido.
   * @param {number} player - 1 o 2
   * @returns {Promise<object>} - el poder elegido
   */
  show(player) {
    return new Promise(resolve => {
      const color = player === 1 ? '#00cfff' : '#ff6a00';
      this.elPlayer.textContent = `JUGADOR ${player}`;
      this.elPlayer.style.color = color;
      this.elTitle.textContent  = 'ELEGÍ UN PODER';
      this.elTitle.style.color  = color;

      // Seleccionar poderes aleatorios con preferencia por categorías variadas
      const options = this._selectBalancedPowers(POWERS_ARRAY, 4);
      this.elGrid.innerHTML = '';

      for (const power of options) {
        const btn = document.createElement('button');
        btn.className = 'upg-btn';
        btn.style.borderColor = color + '55';
        
        // Añadir indicador de categoría
        const categoryColor = this._getCategoryColor(power.category);
        
        btn.innerHTML = `
          <div class="upg-header">
            <span class="upg-icon">${power.icon}</span>
            <span class="upg-category" style="color:${categoryColor};font-size:8px">${this._getCategoryName(power.category)}</span>
          </div>
          <span class="upg-name" style="color:${color}">${power.name}</span>
          <span class="upg-desc">${power.desc}</span>
        `;
        
        btn.addEventListener('click', () => {
          this.hide();
          resolve(power);
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
   * Selecciona poderes balanceados para dar variedad
   */
  _selectBalancedPowers(powers, count) {
    const categories = ['shooting', 'automatic', 'advanced', 'classic'];
    const selected = [];
    const available = [...powers];
    
    // Intentar obtener al menos uno de cada categoría principal
    for (const category of categories) {
      const categoryPowers = available.filter(p => p.category === category);
      if (categoryPowers.length > 0 && selected.length < count) {
        const power = categoryPowers[Math.floor(Math.random() * categoryPowers.length)];
        selected.push(power);
        available.splice(available.indexOf(power), 1);
      }
    }
    
    // Completar con poderes aleatorios si falta
    while (selected.length < count && available.length > 0) {
      const index = Math.floor(Math.random() * available.length);
      selected.push(available[index]);
      available.splice(index, 1);
    }
    
    // Mezclar resultado
    return selected.sort(() => Math.random() - 0.5);
  }
  
  /**
   * Obtiene color para categoría
   */
  _getCategoryColor(category) {
    const colors = {
      shooting: '#ff6b6b',
      automatic: '#4ecdc4', 
      advanced: '#45b7d1',
      classic: '#96ceb4'
    };
    return colors[category] || '#ffffff';
  }
  
  /**
   * Obtiene nombre legible de categoría
   */
  _getCategoryName(category) {
    const names = {
      shooting: 'DISPARO',
      automatic: 'AUTO',
      advanced: 'AVANZADO', 
      classic: 'CLÁSICO'
    };
    return names[category] || category;
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
