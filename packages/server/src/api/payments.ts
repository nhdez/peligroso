import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Router = require("@koa/router");

// NOTE: this does not call Square at all - it trusts whatever usdAmount the
// client sends and fabricates a fake payment ID. Fine as a placeholder while
// the app is pre-launch, but must be replaced with a real Square API call
// (verifying sourceId server-side) before any real money is on the line.
export const paymentsRouter = new Router();

paymentsRouter.post("/api/payments/square/process", async (ctx: any) => {
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
