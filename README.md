# Peligroso (Truco Patagónico)

Full multiplayer, TypeScript, built on **boardgame.io** for state
sync/networking + **React** for the client.

## Structure

```
packages/
  shared/   # Pure rules engine + boardgame.io Game definition. No I/O.
  server/   # boardgame.io Server (Node), serves the game + Socket.IO transport.
  client/   # React app (Vite), connects via boardgame.io/multiplayer SocketIO.
```

`shared` is the single source of truth for rules — both `server` and
`client` import it, so the client never re-implements game logic; it just
renders whatever state boardgame.io syncs down and dispatches moves.

## Running it

```bash
npm install          # from repo root — installs all workspaces
npm run dev:server   # terminal 1 — starts the game server on :8000
npm run dev:client    # terminal 2 — starts the React app on :3000
```

Open two browser tabs at `http://localhost:3000`, join the same match ID
as Player 0 and Player 1, and you have a live 2-player game.

## What's real vs. stubbed

Real / working:
- Deck, card ranking (sin flor), Envido value calculation — `shared/src/deck.ts`, `rules.ts`
- boardgame.io `Game` definition with `playCard`, `callEnvido` /
  `respondEnvido`, `callTruco` / `respondTruco`, `irseAlMazo` moves
- Trick resolution (including parda/tied tricks)
- Full networking, state sync, and a playable 2-tab loop

Simplified / TODO (flagged with `// TODO` in `game.ts`):
- **Point values for declined calls** — currently hardcoded to `1`; should
  track the *previous accepted* call's value (e.g. if Retruco was accepted
  then Vale4 is declined, the caller of Vale4's opponent gets the Retruco
  value, not 1).
- **Falta Envido** value — currently just jumps the caller straight to 30;
  correct rule is "whatever the leader needs to reach 30."
- **Envido must be called before the first card of the hand is played** —
  partially enforced (`G.tricks.length > 0` check) but doesn't yet block a
  call after *any* player (not just the caller) has played.
- **Escalating Truco calls** (Truco → Retruco → Vale4) — moves exist but
  there's no validation yet that stops e.g. calling Vale4 before Truco was
  accepted.
- **Dealing the next hand** — `endIf` only ends the whole match at 30
  points; when a hand ends without reaching 30, nothing currently deals
  the next hand. This is the next thing to build.
- **4-player teams** — `teamOf()` in `types.ts` has the seat→team mapping,
  but turn order, partner calls-on-behalf-of-team, and señas aren't wired
  into `game.ts` yet (see `TODO(4p)` comments).
- **Lobby / matchmaking** — `App.tsx` has a manual match-ID + seat picker
  for local testing. Swap in boardgame.io's `LobbyClient` for real
  matchmaking.

Good next step: pick one TODO (dealing the next hand is probably highest
value) and knock it out before touching the UI further.
