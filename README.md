# ⚡ NEON DEFENSE — PVP Tower Defense

Un juego de tower defense competitivo PVP con estética neón retro-futurista.  
Dos jugadores en pantalla dividida (arriba/abajo). Las torres disparan solas; los jugadores solo eligen mejoras.

## 🎮 Cómo jugar

- **P1** controla la mitad superior (cyan)
- **P2** controla la mitad inferior (naranja)
- Las torres disparan automáticamente al territorio enemigo
- Cada **15 segundos** el juego se pausa y cada jugador elige **1 mejora** de 4 opciones
- Gana quien tenga **más territorio** al terminar los 2 minutos

## 📁 Estructura del proyecto

```
neon-defense/
├── index.html              # Punto de entrada
├── src/
│   ├── core/
│   │   ├── Game.js         # Loop principal, estado global
│   │   ├── Grid.js         # Lógica del mapa y territorios
│   │   └── Renderer.js     # Todo el dibujado en canvas
│   ├── entities/
│   │   ├── Tower.js        # Clase Torre
│   │   ├── Bullet.js       # Clase Bala / proyectil
│   │   └── Particle.js     # Sistema de partículas
│   ├── ui/
│   │   ├── HUD.js          # Puntajes, timer, barra de territorio
│   │   └── UpgradeModal.js # Modal de mejoras entre rondas
│   └── utils/
│       ├── constants.js    # Colores, configs, balanceo
│       └── helpers.js      # Funciones utilitarias
├── assets/                 # Futuros sprites, sonidos
└── docs/
    └── DESIGN.md           # Documento de diseño del juego
```

## 🚀 Cómo correr

```bash
# Opción 1: servidor simple con Python
python3 -m http.server 8080

# Opción 2: con Node.js
npx serve .

# Opción 3: abrir index.html directo en el navegador
# (puede haber restricciones de módulos ES6 en algunos browsers)
```

## 🛠️ Ideas para expandir

### Corto plazo
- [ ] Sonidos (Web Audio API)
- [ ] Más tipos de torres (rayo, explosiva, soporte)
- [ ] Animación de conquista más orgánica
- [ ] Efectos de pantalla al usar poderes

### Mediano plazo
- [ ] Modo online con WebSockets (Node.js + Socket.io)
- [ ] Árbol de mejoras más profundo
- [ ] Nodos centrales con poderes especiales
- [ ] Mapas con obstáculos

### Largo plazo
- [ ] Cuentas y ranking
- [ ] Torneos automáticos
- [ ] App mobile (Capacitor)

## ⚖️ Balance actual

| Mejora      | Efecto              | Nivel máx |
|-------------|---------------------|-----------|
| Daño        | +1 hp de conquista  | ilimitado |
| Velocidad   | ÷1.5 cooldown       | 3x        |
| Rango       | +40% alcance        | 3x        |
| Multibala   | +1 objetivo         | 4         |
| Expansión   | conquista 20 celdas | —         |
| Supernova   | blast radio 5       | —         |
