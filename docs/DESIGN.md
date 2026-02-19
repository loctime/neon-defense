# NEON DEFENSE — Documento de Diseño

## Visión
Tower defense PVP competitivo donde la estrategia está en **qué mejoras elegís**, no en microgestión. Simple de aprender, difícil de dominar.

## Loop de juego
1. La partida empieza con ambos jugadores con territorio 50/50
2. Las torres atacan automáticamente — no hay input manual
3. Cada 15 segundos, el juego se pausa y **cada jugador elige 1 mejora**
4. Al terminar los 2 minutos, gana quien tenga más territorio

## Principios de diseño
- **Cero clicks durante el juego** — toda la agencia está en las mejoras
- **Información clara** — el % de territorio siempre visible
- **Asimetría emergente** — distintas combinaciones de mejoras llevan a estilos distintos
- **Sesiones cortas** — 2 minutos por partida, ideal mobile

## Árbol de mejoras futuras

### Ofensivas
- Daño +1 (stackeable)
- Velocidad de disparo (hasta 3x)
- Multibala (hasta 4 objetivos)
- Bala perforante (atraviesa celdas)
- Bala explosiva (AOE al impactar)

### Estratégicas (una vez)
- Expansión: conquista 20 celdas del frente
- Supernova: explosión en radio 5 alrededor de una torre
- Fortaleza: refuerza todas tus celdas (+1 hp)
- Teletransporte: mueve una torre al frente de batalla

### Defensivas (futuras)
- Escudo: las celdas tienen +2 hp por 30 segundos
- Regeneración: recupera celdas perdidas lentamente
- Torre reforzada: una torre se vuelve indestructible

## Nodos especiales (roadmap)
Celdas en el centro del mapa que otorgan bonificaciones al ser controladas:
- ⚡ Nodo de energía: disparo 50% más rápido
- 🔷 Nodo de plasma: daño doble
- 💠 Nodo central: +10% territorio instantáneo

## Modos de juego planeados
| Modo       | Descripción                           |
|------------|---------------------------------------|
| 1v1 local  | ✅ Implementado                        |
| 1v1 online | WebSockets (Node.js + Socket.io)      |
| 2v2        | Compartir territorio entre aliados    |
| Torneo     | Eliminatorias automáticas             |

## Stack técnico recomendado
- **Frontend**: HTML5 Canvas + ES Modules (vanilla)
- **Backend PVP online**: Node.js + Socket.io
- **Deploy**: Vercel / Netlify (frontend) + Railway / Fly.io (backend)
- **Mobile**: Capacitor para wrappear como app nativa
