# ⚡ NEON DEFENSE — PVP Tower Defense

Un juego de tower defense competitivo PVP con estética neón retro-futurista.  
Dos jugadores en pantalla dividida (arriba/abajo). Las torres disparan solas; los jugadores solo eligen mejoras.

## 🎮 Cómo jugar

- **P1** controla la mitad superior (cyan)
- **P2** controla la mitad inferior (naranja)
- Las torres rotan 360° y disparan automáticamente al territorio enemigo
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
│   │   └── Drone.js        # Drones orbitantes
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

## ⚡ Características implementadas

### Mecánicas principales
- **Sistema de conquista por grid**: Cada celda tiene 1 HP, se conquista al recibir daño
- **Torres con rotación 360°**: Rotación continua y automática
- **Disparo en cono**: Las torres disparan en un ángulo de 90° frente a ellas
- **Sistema de partículas**: Efectos visuales al conquistar celdas
- **Timer y pausas**: Partidas de 2 minutos con pausas cada 15 segundos

### Tipos de proyectiles
- **Balas normales**: Proyectiles básicos con trail visual
- **Laser Beam**: Rayos penetrantes que dañan múltiples celdas en línea
- **Shotgun**: Múltiples proyectiles en abanico
- **Ricochet**: Balas que rebotan hacia enemigos cercanos

### Habilidades automáticas
- **Explosión Automática**: Bombas periódicas desde torres aleatorias
- **Meteorito**: Impactos aleatorios en zona enemiga
- **Onda de Choque**: Empuja la frontera enemiga hacia atrás
- **Overdrive**: Duplica la velocidad de disparo temporalmente

### Mecánicas avanzadas
- **Drones orbitantes**: Unidades auxiliares que disparan automáticamente
- **Torre Sombra**: 20% de probabilidad de disparo duplicado fantasma
- **Multi Shot**: Balas adicionales por disparo
- **Sistema de spread**: Daño en cadena al conquistar celdas

### Poderes clásicos
- **Daño +1**: Incrementa el daño de las balas
- **Rotación +1**: Aumenta la velocidad de rotación de las torres
- **Expansión**: Conquista instantánea de 20 celdas
- **Supernova**: Explosión radial desde una torre

### Interfaz y UX
- **HUD en tiempo real**: Muestra puntajes, timer e indicadores de habilidades
- **Modal de mejoras**: Sistema categorizado con 4 opciones balanceadas
- **Indicadores visuales**: Cooldowns, estado de habilidades, niveles
- **Pantalla de inicio**: Instrucciones y botón de inicio
- **Pantalla de fin**: Resultados y opción de revancha

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

| Categoría | Poder | Efecto | Nivel máx |
|-----------|-------|--------|-----------|
| **Disparo** | Multi Shot | +1 bala adicional | 10 |
| | Laser | Balas penetrantes | 5 |
| | Ricochet | Rebotes automáticos | 5 |
| | Shotgun | Disparo en abanico | 5 |
| **Automático** | Explosión Auto | Bombas periódicas | 5 |
| | Meteorito | Impactos aleatorios | 5 |
| | Onda de Choque | Empuja frontera | 3 |
| **Avanzado** | Overdrive | Doble velocidad temporal | 3 |
| | Drones | Unidades orbitantes | 5 |
| | Torre Sombra | 20% disparo fantasma | 5 |
| **Clásico** | Daño +1 | +1 daño de bala | 10 |
| | Rotación +1 | +30% velocidad rotación | 10 |
| | Expansión | Conquista 20 celdas | — |
| | Supernova | Explosión radial | — |
