// ============================================================
// HUD.js — Barra central: puntajes, timer, territorio
// ============================================================

export class HUD {
  constructor() {
    this.elS1    = document.getElementById('s1');
    this.elS2    = document.getElementById('s2');
    this.elTimer = document.getElementById('timer');
    this.elBar1  = document.getElementById('terrBar1');
    this.elBar2  = document.getElementById('terrBar2');
  }

  updateScores(p1pct) {
    const p2pct = 100 - p1pct;
    this.elS1.textContent = p1pct + '%';
    this.elS2.textContent = p2pct + '%';
    if (this.elBar1) this.elBar1.style.width = p1pct + '%';
    if (this.elBar2) this.elBar2.style.width = p2pct + '%';
  }

  updateTimer(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    this.elTimer.textContent = `${m}:${s}`;
    this.elTimer.style.color = seconds <= 15 ? '#ff4444' : '';
  }
}
