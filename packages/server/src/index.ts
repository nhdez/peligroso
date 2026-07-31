import { createRequire } from "module";
import type { Server as ServerType } from "boardgame.io/server";
import { TrucoGame } from "shared";
import { apiRouters } from "./api/index.js";

const require = createRequire(import.meta.url);
const { Server, Origins } = require("boardgame.io/server");
const bodyParser = require("koa-bodyparser");

// Explicit allowlist - do not fall back to reflecting arbitrary origins,
// especially with credentials enabled (that lets any website make
// credentialed requests here and read the response).
const ALLOWED_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/(www\.)?peligroso\.net$/,
  /^https?:\/\/server\.peligroso\.net$/,
  /^https?:\/\/peligroso-client\.vercel\.app$/,
];

function isAllowedOrigin(origin: string | undefined): boolean {
  return !!origin && ALLOWED_ORIGINS.some((r) => r.test(origin));
}

const server = Server({
  games: [TrucoGame],
  origins: [Origins.LOCALHOST, ...ALLOWED_ORIGINS],
});

// Top-level Koa CORS Middleware handling all preflight OPTIONS & CORS headers
server.app.use(async (ctx: any, next: any) => {
  const origin = ctx.request.header.origin;
  if (isAllowedOrigin(origin)) {
    ctx.set("Access-Control-Allow-Origin", origin);
    ctx.set("Vary", "Origin");
    ctx.set("Access-Control-Allow-Credentials", "true");
    ctx.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH");
    ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With, Origin");
  }

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
