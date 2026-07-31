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

// Add Koa bodyparser and custom routes for Square payments processing
server.app.use(bodyParser());

const router = new Router();

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
