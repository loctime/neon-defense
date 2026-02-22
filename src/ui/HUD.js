// ============================================================
// HUD.js — Barra central: puntajes, timer, territorio y habilidades
// ============================================================

export class HUD {
  constructor() {
    this.elS1    = document.getElementById('s1');
    this.elS2    = document.getElementById('s2');
    this.elTimer = document.getElementById('timer');
    this.elBar1  = document.getElementById('terrBar1');
    this.elBar2  = document.getElementById('terrBar2');
    
    // Elementos para indicadores de habilidades (crear si no existen)
    this._createAbilityIndicators();
  }
  
  /**
   * Crea indicadores visuales para habilidades activas
   */
  _createAbilityIndicators() {
    // Contenedor de habilidades para P1
    const p1Abilities = document.createElement('div');
    p1Abilities.id = 'p1-abilities';
    p1Abilities.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 8px;
      color: #00cfff;
      font-family: monospace;
    `;
    
    // Contenedor de habilidades para P2
    const p2Abilities = document.createElement('div');
    p2Abilities.id = 'p2-abilities';
    p2Abilities.style.cssText = `
      position: absolute;
      bottom: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 8px;
      color: #ff6a00;
      font-family: monospace;
      text-align: right;
    `;
    
    document.body.appendChild(p1Abilities);
    document.body.appendChild(p2Abilities);
    
    this.elP1Abilities = p1Abilities;
    this.elP2Abilities = p2Abilities;
  }

  updateScores(p1pct) {
    const p2pct = 100 - p1pct;
    this.elS1.textContent = p1pct + '%';
    this.elS2.textContent = p2pct + '%';
    if (this.elBar1) this.elBar1.style.width = p1pct + '%';
    if (this.elBar2) this.elBar2.style.width = p2pct + '%';
  }
  
  /**
   * Actualiza indicadores de habilidades activas
   */
  updateAbilities(stats1, stats2) {
    this._updatePlayerAbilities(stats1, this.elP1Abilities, 1);
    this._updatePlayerAbilities(stats2, this.elP2Abilities, 2);
  }
  
  /**
   * Actualiza habilidades de un jugador específico
   */
  _updatePlayerAbilities(stats, container, player) {
    const abilities = [];
    
    // Habilidades automáticas con cooldown
    if (stats.autoExplosionLevel > 0) {
      const cooldown = Math.ceil(stats.autoExplosionCooldown / 30); // Convertir a segundos
      abilities.push(`💣 ${cooldown > 0 ? cooldown + 's' : 'READY'}`);
    }
    
    if (stats.meteoriteLevel > 0) {
      const cooldown = Math.ceil(stats.meteoriteCooldown / 30);
      abilities.push(`☄️ ${cooldown > 0 ? cooldown + 's' : 'READY'}`);
    }
    
    if (stats.shockwaveLevel > 0) {
      const cooldown = Math.ceil(stats.shockwaveCooldown / 30);
      abilities.push(`🌊 ${cooldown > 0 ? cooldown + 's' : 'READY'}`);
    }
    
    // Overdrive
    if (stats.overdriveLevel > 0) {
      if (stats.overdriveDuration > 0) {
        const duration = Math.ceil(stats.overdriveDuration / 30);
        abilities.push(`🚀 ACTIVE ${duration}s`);
      } else {
        const cooldown = Math.ceil(stats.overdriveCooldown / 30);
        abilities.push(`🚀 ${cooldown > 0 ? cooldown + 's' : 'READY'}`);
      }
    }
    
    // Modificadores de disparo (siempre activos)
    if (stats.multiShotLevel > 0) {
      abilities.push(`🔫 x${stats.multiShotLevel + 1}`);
    }
    
    if (stats.laserLevel > 0) {
      abilities.push(`⚡ L${stats.laserLevel}`);
    }
    
    if (stats.ricochetLevel > 0) {
      abilities.push(`🔄 L${stats.ricochetLevel}`);
    }
    
    if (stats.shotgunLevel > 0) {
      abilities.push(`💥 L${stats.shotgunLevel}`);
    }
    
    if (stats.droneLevel > 0) {
      abilities.push(`🛸 x${stats.droneLevel}`);
    }
    
    if (stats.shadowTowerLevel > 0) {
      abilities.push(`👻 ${stats.shadowTowerLevel * 20}%`);
    }
    
    // Actualizar contenido
    container.innerHTML = abilities.join('<br>');
  }

  updateTimer(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    this.elTimer.textContent = `${m}:${s}`;
    this.elTimer.style.color = seconds <= 15 ? '#ff4444' : '';
  }
}
