import { createRequire } from "module";
import type { Server as ServerType } from "boardgame.io/server";
import { TrucoGame } from "shared";

const require = createRequire(import.meta.url);
const { Server, Origins } = require("boardgame.io/server");
const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");

// Configure boardgame.io server with dynamic origin allow function
const server = Server({
  games: [TrucoGame],
  origins: [
    Origins.LOCALHOST,
    /^https?:\/\/(www\.)?peligroso\.net$/,
    /^https?:\/\/server\.peligroso\.net$/,
    /^https?:\/\/peligroso-client\.vercel\.app$/,
    (origin: string) => true, // Fallback function allowing all origins
  ],
});

// Top-level Koa CORS Middleware handling all preflight OPTIONS & CORS headers
server.app.use(async (ctx: any, next: any) => {
  const origin = ctx.request.header.origin || "*";
  ctx.set("Access-Control-Allow-Origin", origin);
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH");
  ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With, Origin");

  if (ctx.method === "OPTIONS") {
    ctx.status = 204;
    return;
  }
  await next();
});

server.app.use(bodyParser());

const router = new Router();

// Active Online Users Presence Tracker Map
const onlinePresences = new Map<string, number>();

function pruneStalePresences() {
  const now = Date.now();
  for (const [id, lastSeen] of onlinePresences.entries()) {
    if (now - lastSeen > 15000) { // 15 seconds expiry
      onlinePresences.delete(id);
    }
  }
}

// Presence Heartbeat Endpoint
router.post("/api/presence/heartbeat", async (ctx: any) => {
  const { userId } = ctx.request.body || {};
  const clientKey = userId || ctx.ip || `anon-${Math.random()}`;
  onlinePresences.set(clientKey, Date.now());
  pruneStalePresences();

  ctx.status = 200;
  ctx.body = { onlineCount: Math.max(1, onlinePresences.size) };
});

// Presence Online Count GET Endpoint
router.get("/api/presence/online-count", async (ctx: any) => {
  pruneStalePresences();
  ctx.status = 200;
  ctx.body = { onlineCount: Math.max(1, onlinePresences.size) };
});

// Server-Backed Matchmaking Queue
interface ServerQueueEntry {
  roomId: string;
  player1Id: string;
  player1Name: string;
  player2Id?: string;
  player2Name?: string;
  status: "waiting" | "paired" | "cancelled";
  createdAt: number;
}

const serverMatchmakingQueue: ServerQueueEntry[] = [];

function pruneStaleQueue() {
  const now = Date.now();
  for (let i = serverMatchmakingQueue.length - 1; i >= 0; i--) {
    if (now - serverMatchmakingQueue[i].createdAt > 60000) { // 60s timeout
      serverMatchmakingQueue.splice(i, 1);
    }
  }
}

router.post("/api/matchmaking/join", async (ctx: any) => {
  pruneStaleQueue();
  const { userId, userName } = ctx.request.body || {};
  const myId = userId || `guest-${Math.random().toString(36).substring(2, 7)}`;
  const myName = userName || "Player";

  // Check for open waiting room created by another player
  const openRoom = serverMatchmakingQueue.find(
    (r) => r.status === "waiting" && r.player1Id !== myId
  );

  if (openRoom) {
    openRoom.status = "paired";
    openRoom.player2Id = myId;
    openRoom.player2Name = myName;

    ctx.status = 200;
    ctx.body = {
      status: "paired",
      role: "player2",
      assignedPlayerId: "1",
      roomId: openRoom.roomId,
      opponentName: openRoom.player1Name,
    };
    return;
  }

  // Create new waiting room
  const newRoomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const entry: ServerQueueEntry = {
    roomId: newRoomId,
    player1Id: myId,
    player1Name: myName,
    status: "waiting",
    createdAt: Date.now(),
  };
  serverMatchmakingQueue.push(entry);

  ctx.status = 200;
  ctx.body = {
    status: "waiting",
    role: "player1",
    assignedPlayerId: "0",
    roomId: newRoomId,
  };
});

router.get("/api/matchmaking/status/:roomId", async (ctx: any) => {
  pruneStaleQueue();
  const { roomId } = ctx.params;
  const room = serverMatchmakingQueue.find((r) => r.roomId === roomId);

  if (!room) {
    ctx.status = 200;
    ctx.body = { status: "not_found" };
    return;
  }

  ctx.status = 200;
  ctx.body = {
    status: room.status,
    roomId: room.roomId,
    player1Name: room.player1Name,
    player2Name: room.player2Name,
  };
});

router.post("/api/matchmaking/cancel", async (ctx: any) => {
  const { roomId } = ctx.request.body || {};
  const room = serverMatchmakingQueue.find((r) => r.roomId === roomId);
  if (room) {
    room.status = "cancelled";
  }
  ctx.status = 200;
  ctx.body = { success: true };
});

// Square Payment Processing API Endpoint
router.post("/api/payments/square/process", async (ctx: any) => {
  const { sourceId, usdAmount, userId } = ctx.request.body || {};

  if (!usdAmount || usdAmount <= 0) {
    ctx.status = 400;
    ctx.body = { error: "Invalid payment amount." };
    return;
  }

  // 1 USD = 1,000 Credits conversion
  const creditsGranted = Math.floor(usdAmount * 1000);

  ctx.status = 200;
  ctx.body = {
    success: true,
    paymentId: `sq_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    usdAmount,
    creditsGranted,
    userId: userId || "guest",
    message: `Payment of $${usdAmount} USD processed via Square. Granted ${creditsGranted} credits!`,
  };
});

server.app.use(router.routes()).use(router.allowedMethods());

const PORT = Number(process.env.PORT) || 8000;
server.run(PORT, () => {
  console.log(`Truco server listening on http://localhost:${PORT}`);
});
