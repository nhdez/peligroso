import { healthRouter } from "./health.js";
import { presenceRouter } from "./presence.js";
import { matchmakingRouter } from "./matchmaking.js";
import { paymentsRouter } from "./payments.js";

// Every REST route the game exposes alongside the boardgame.io Socket.IO
// game protocol lives here. This is the surface a future mobile (Kotlin)
// client would consume for anything that isn't live match play itself.
export const apiRouters = [healthRouter, presenceRouter, matchmakingRouter, paymentsRouter];
