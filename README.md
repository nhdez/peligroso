# Peligroso (Truco Patagónico)

A competitive, full-featured esports web platform for **Truco Patagónico** built on **boardgame.io** for real-time state synchronization, **React (Vite)** for the client interface, **Koa** for the backend server, and **Supabase** for user profiles and object storage.

---

## 📁 Repository Structure

```
packages/
  shared/   # Pure Truco rules engine & boardgame.io Game definition. Single source of truth.
  server/   # boardgame.io Server (Koa + Socket.IO), custom API endpoints, presence tracker, & matchmaking.
  client/   # React esports client (Vite), 3-column dashboard, audio recorder, & admin console.
```

---

## ⚡ Quick Start / Running Locally

```bash
# 1. Install dependencies from repo root
npm install

# 2. Build the shared rules package
npm run build:shared

# 3. Start the boardgame.io & API server (Port 8000)
npm run dev --workspace=server

# 4. Start the React dev server (Port 3000)
npm run dev --workspace=client
```

Open `http://localhost:3000` to access the main esports lobby.

---

## 🎮 Game Engine Features (`shared`)

- **Full Truco Engine**: Complete implementation of Argentine/Patagónico Truco rules (sin flor).
- **Envido & Calls**: Accurate Envido score calculation, score order tie-breaking, and dynamic **Falta Envido** logic ("points needed by the leader to reach 30").
- **Escalating Truco Stakes**: Validated state machine for Truco (2 pts) → Re-Truco (3 pts) → Vale 4 (4 pts).
- **Declined Call Point Calculation**: Declined calls automatically award points based on the *previous accepted stake* (not hardcoded 1).
- **Automated Hand Rotation**: Automatic trick resolution, parda/tied trick handling, hand cleanup, mano player rotation, and match victory detection at 30 points.
- **1v1 & 2v2 Team Modes**: Support for 2-player 1v1 and 4-player 2v2 team matches (`teamOf()` seat mapping).

---

## 🌐 Server & Platform APIs (`server`)

- **Real-time State Sync**: Socket.IO transport powered by `boardgame.io/server`.
- **Global CORS Middleware**: Dynamic origin reflection with preflight `OPTIONS` support for production domains (`https://www.peligroso.net`, `https://server.peligroso.net`).
- **Server Matchmaking Queue**: Live queue endpoints (`/api/matchmaking/join`, `/api/matchmaking/status`, `/api/matchmaking/cancel`) with automatic 1.5s polling fallback so players pair instantly.
- **Online Presence Tracker**: In-memory heartbeat tracker (`/api/presence/heartbeat`, `/api/presence/online-count`) rendering real-time active player counts.
- **Square Payments Integration**: `/api/payments/square/process` endpoint converting USD payments into in-game credits ($1.00 USD = 1,000 Credits).

---

## 🏆 Client & Esports Dashboard (`client`)

- **Esports Dashboard**: Dark metallic 3-column lobby (`MATCH CENTER`, `GLOBAL LOBBY CHAT`, `PLAYER DOSSIER & COMPETITIVE STANDINGS`).
- **Competitive ELO Ranking System ($K=32$)**: Strict human-vs-human ELO rating calculation and W/L standings. AI bot matches do not affect competitive rankings.
- **Admin Audio Shouts (Gritos) Console**: In-browser **live microphone voice recorder** (`MediaRecorder`) and MP3 asset manager for custom game shouts (Envido, Truco, Re-Truco, Mazo).
- **Deck Themes & Playmats**: Custom card deck theme designer and playmat arena customizer.
- **Multi-language Support (i18n)**: Native Spanish and English language switching.
