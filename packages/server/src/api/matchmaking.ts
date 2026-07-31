import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Router = require("@koa/router");

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
    if (now - serverMatchmakingQueue[i].createdAt > 60000) {
      // 60s timeout
      serverMatchmakingQueue.splice(i, 1);
    }
  }
}

export const matchmakingRouter = new Router();

matchmakingRouter.post("/api/matchmaking/join", async (ctx: any) => {
  pruneStaleQueue();
  const { userId, userName } = ctx.request.body || {};
  const myId = userId || `guest-${Math.random().toString(36).substring(2, 7)}`;
  const myName = userName || "Player";

  // Check for open waiting room created by another player
  const openRoom = serverMatchmakingQueue.find((r) => r.status === "waiting" && r.player1Id !== myId);

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

matchmakingRouter.get("/api/matchmaking/status/:roomId", async (ctx: any) => {
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

matchmakingRouter.post("/api/matchmaking/cancel", async (ctx: any) => {
  const { roomId } = ctx.request.body || {};
  const room = serverMatchmakingQueue.find((r) => r.roomId === roomId);
  if (room) {
    room.status = "cancelled";
  }
  ctx.status = 200;
  ctx.body = { success: true };
});
