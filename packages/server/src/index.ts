import { createRequire } from "module";
import type { Server as ServerType } from "boardgame.io/server";
import { TrucoGame } from "shared";

const require = createRequire(import.meta.url);
const { Server, Origins } = require("boardgame.io/server");

const server = Server({
  games: [TrucoGame],
  origins: [Origins.LOCALHOST, "https://peligroso-client.vercel.app"],
});

const PORT = Number(process.env.PORT) || 8000;
server.run(PORT, () => {
  console.log(`Truco server listening on http://localhost:${PORT}`);
});

