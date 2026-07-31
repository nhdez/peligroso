import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Router = require("@koa/router");

// Active Online Users Presence Tracker Map
const onlinePresences = new Map<string, number>();

function pruneStalePresences() {
  const now = Date.now();
  for (const [id, lastSeen] of onlinePresences.entries()) {
    if (now - lastSeen > 15000) {
      // 15 seconds expiry
      onlinePresences.delete(id);
    }
  }
}

export const presenceRouter = new Router();

presenceRouter.post("/api/presence/heartbeat", async (ctx: any) => {
  const { userId } = ctx.request.body || {};
  const clientKey = userId || ctx.ip || `anon-${Math.random()}`;
  onlinePresences.set(clientKey, Date.now());
  pruneStalePresences();

  ctx.status = 200;
  ctx.body = { onlineCount: Math.max(1, onlinePresences.size) };
});

presenceRouter.get("/api/presence/online-count", async (ctx: any) => {
  pruneStalePresences();
  ctx.status = 200;
  ctx.body = { onlineCount: Math.max(1, onlinePresences.size) };
});
