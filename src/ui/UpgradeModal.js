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
      const stats = window.game ? window.game.stats[player - 1] : null;
      const availablePoints = stats ? stats.upgradePoints : 3;
      
      const color = player === 1 ? '#00cfff' : '#ff6a00';
      this.elPlayer.textContent = `JUGADOR ${player} (${availablePoints} pts)`;
      this.elPlayer.style.color = color;
      this.elTitle.textContent  = 'ELEGÍ UN PODER';
      this.elTitle.style.color  = color;

      // Seleccionar poderes aleatorios con preferencia por categorías variadas
      const options = this._selectBalancedPowers(POWERS_ARRAY, 4, availablePoints);
      this.elGrid.innerHTML = '';

      for (const power of options) {
        const canAfford = !power.pointCost || availablePoints >= power.pointCost;
        const btn = document.createElement('button');
        btn.className = 'upg-btn';
        btn.style.borderColor = color + '55';
        btn.style.opacity = canAfford ? '1' : '0.5';
        btn.disabled = !canAfford;
        
        // Añadir indicador de categoría
        const categoryColor = this._getCategoryColor(power.category);
        
        // Add point cost to display
        const costText = power.pointCost ? ` (${power.pointCost} pts)` : '';
        
        btn.innerHTML = `
          <div class="upg-header">
            <span class="upg-icon">${power.icon}</span>
            <span class="upg-category" style="color:${categoryColor};font-size:8px">${this._getCategoryName(power.category)}</span>
          </div>
          <span class="upg-name" style="color:${color}">${power.name}${costText}</span>
          <span class="upg-desc">${power.desc}</span>
        `;
        
        btn.addEventListener('click', () => {
          if (canAfford) {
            this.hide();
            resolve(power);
          }
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
   * UPDATED: Filters by available upgrade points
   */
  _selectBalancedPowers(powers, count, availablePoints) {
    const categories = ['shooting', 'automatic', 'advanced', 'classic'];
    const selected = [];
    
    // Filter powers by affordability
    const affordablePowers = availablePoints > 0 ? 
      powers.filter(p => !p.pointCost || p.pointCost <= availablePoints) :
      powers.filter(p => !p.pointCost); // Only free powers if no points available
    
    const available = [...affordablePowers];
    
    // Priority weights for counter-play balance
    const categoryWeights = {
      shooting: 0.6,      // Reduced weight for offensive stacking
      automatic: 1.2,     // Increased weight for strategic abilities
      advanced: 1.0,      // Maintained weight for advanced mechanics
      classic: 0.8        // Slightly reduced for basic stats
    };
    
    // Weighted selection to favor counter-play options
    const weightedAvailable = available.map(power => ({
      ...power,
      weight: categoryWeights[power.category] || 1.0
    }));
    
    // Sort by weight (higher = more likely to be selected)
    weightedAvailable.sort((a, b) => b.weight - a.weight);
    
    // Attempt to get balanced selection with weighted preference
    for (const category of categories) {
      const categoryPowers = weightedAvailable.filter(p => p.category === category);
      if (categoryPowers.length > 0 && selected.length < count) {
        // Select from top weighted options in each category
        const power = categoryPowers[0];
        selected.push(power);
        const index = available.findIndex(p => p.id === power.id);
        if (index !== -1) {
          available.splice(index, 1);
        }
      }
    }
    
    // Completar con poderes de mayor peso si falta
    while (selected.length < count && available.length > 0) {
      const remainingWeighted = available.map(p => ({
        ...p,
        weight: categoryWeights[p.category] || 1.0
      }));
      remainingWeighted.sort((a, b) => b.weight - a.weight);
      
      const power = remainingWeighted[0];
      selected.push(power);
      const index = available.findIndex(p => p.id === power.id);
      if (index !== -1) {
        available.splice(index, 1);
      }
    }
    
    // Mezclar resultado para mantener variedad visual
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
