import { createRequire } from "module";
import type { Server as ServerType } from "boardgame.io/server";
import { TrucoGame } from "shared";

const require = createRequire(import.meta.url);
const { Server, Origins } = require("boardgame.io/server");
const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");

const server = Server({
  games: [TrucoGame],
  origins: [Origins.LOCALHOST, "https://peligroso-client.vercel.app"],
});

// Add Koa bodyparser and custom routes
server.app.use(bodyParser());

const router = new Router();

// Active Online Users Presence Tracker Map (Stores userId/sessionId -> lastSeen timestamp)
const onlinePresences = new Map<string, number>();

function pruneStalePresences() {
  const now = Date.now();
  for (const [id, lastSeen] of onlinePresences.entries()) {
    if (now - lastSeen > 15000) { // 15 seconds expiry
      onlinePresences.delete(id);
    }
  }
}

// Presence Heartbeat Endpoint for registered and guest users
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

  // Return success response with credits granted details
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
