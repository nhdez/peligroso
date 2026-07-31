import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Router = require("@koa/router");
const { version } = require("../../package.json");

export const healthRouter = new Router();

healthRouter.get("/api/health", async (ctx: any) => {
  ctx.status = 200;
  ctx.body = { status: "ok", service: "peligroso-server", version, time: new Date().toISOString() };
});
