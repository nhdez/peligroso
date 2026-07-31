import { createRequire } from "module";
import type { Server as ServerType } from "boardgame.io/server";
import { TrucoGame } from "shared";
import { apiRouters } from "./api/index.js";

const require = createRequire(import.meta.url);
const { Server, Origins } = require("boardgame.io/server");
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

for (const router of apiRouters) {
  server.app.use(router.routes()).use(router.allowedMethods());
}

const PORT = Number(process.env.PORT) || 8000;
server.run(PORT, () => {
  console.log(`Truco server listening on http://localhost:${PORT}`);
});
