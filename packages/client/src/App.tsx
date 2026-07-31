import React, { useState, useEffect } from "react";
import { Client as BoardClient } from "boardgame.io/client";
import { Client } from "boardgame.io/react";
import { SocketIO, Local } from "boardgame.io/multiplayer";
import { TrucoGame, getBotMove } from "shared";
import { TrucoBoard } from "./TrucoBoard.js";
import { AuthProvider, useAuth, getCountryFlag } from "./AuthContext.js";
import { AuthModal } from "./AuthModal.js";
import { AdminPanel } from "./AdminPanel.js";
import { I18nProvider, useI18n } from "./i18n/I18nContext.js";
import { StorageProvider } from "./storage/StorageContext.js";
import { LobbyChat } from "./LobbyChat.js";
import { Leaderboard } from "./Leaderboard.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

// Online Client
const OnlineTrucoClient = Client({
  game: TrucoGame,
  board: TrucoBoard,
  multiplayer: SocketIO({ server: SERVER_URL }),
  debug: false,
});

// Pass & Play Local 1v1 Client
const LocalTrucoClient = Client({
  game: TrucoGame,
  board: TrucoBoard,
  multiplayer: Local(),
  numPlayers: 2,
  debug: false,
});

// Pass & Play Local 2v2 Client
const Local2v2TrucoClient = Client({
  game: TrucoGame,
  board: TrucoBoard,
  multiplayer: Local(),
  numPlayers: 4,
  debug: false,
});

// 1v1 AI Single-Player Container
function AiGameContainer() {
  const { updateStats } = useAuth();

  useEffect(() => {
    const botClient = BoardClient({
      game: TrucoGame,
      multiplayer: Local(),
      matchID: "ai-match",
      playerID: "1",
      debug: false,
    });

    botClient.start();
    let isProcessing = false;
    let statsRecorded = false;

    const unsubscribe = botClient.subscribe((state) => {
      if (!state) return;

      if (state.ctx.gameover && !statsRecorded) {
        statsRecorded = true;
        const winner = state.ctx.gameover.winner;
        updateStats(winner === "0");
        return;
      }

      if (state.ctx.gameover || isProcessing) return;

      const isBotTurn = state.ctx.currentPlayer === "1";
      const isPendingEnvidoResponder =
        state.G.currentEnvidoCall?.pendingResponderID === "1" &&
        state.G.currentEnvidoCall?.accepted === null;
      const isPendingTrucoResponder =
        state.G.currentTrucoCall?.pendingResponderID === "1" &&
        state.G.currentTrucoCall?.accepted === null;

      if (isBotTurn || isPendingEnvidoResponder || isPendingTrucoResponder) {
        const botMove = getBotMove(state.G, "1");
        if (!botMove) return;

        isProcessing = true;
        setTimeout(() => {
          isProcessing = false;
          const currentState = botClient.getState();
          if (!currentState || currentState.ctx.gameover) return;

          switch (botMove.type) {
            case "playCard":
              botClient.moves.playCard(botMove.cardId);
              break;
            case "callEnvido":
              botClient.moves.callEnvido(botMove.callType);
              break;
            case "respondEnvido":
              botClient.moves.respondEnvido({
                accept: botMove.accept,
                raiseType: botMove.raiseType,
              });
              break;
            case "callTruco":
              botClient.moves.callTruco(botMove.callType);
              break;
            case "respondTruco":
              botClient.moves.respondTruco(botMove.accept);
              break;
            case "irseAlMazo":
              botClient.moves.irseAlMazo();
              break;
          }
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
      botClient.stop();
    };
  }, [updateStats]);

  return <LocalTrucoClient matchID="ai-match" playerID="0" />;
}

// 2v2 (4 Players) AI Game Container
function Ai2v2GameContainer() {
  const { updateStats } = useAuth();

  useEffect(() => {
    const botClients = ["1", "2", "3"].map((pid) =>
      BoardClient({
        game: TrucoGame,
        multiplayer: Local(),
        matchID: "ai-2v2-match",
        playerID: pid,
        numPlayers: 4,
        debug: false,
      })
    );

    botClients.forEach((client) => client.start());
    let isProcessing = false;
    let statsRecorded = false;

    const mainClient = botClients[0];
    const unsubscribe = mainClient.subscribe((state) => {
      if (!state) return;

      if (state.ctx.gameover && !statsRecorded) {
        statsRecorded = true;
        const winner = state.ctx.gameover.winner;
        updateStats(winner === "0");
        return;
      }

      if (state.ctx.gameover || isProcessing) return;

      const currentPID = state.ctx.currentPlayer;
      const isPendingEnvidoResponder =
        state.G.currentEnvidoCall?.accepted === null &&
        state.G.currentEnvidoCall?.pendingResponderID !== "0";
      const isPendingTrucoResponder =
        state.G.currentTrucoCall?.accepted === null &&
        state.G.currentTrucoCall?.pendingResponderID !== "0";

      let actingBotID: string | null = null;

      if (isPendingEnvidoResponder) {
        actingBotID = state.G.currentEnvidoCall!.pendingResponderID;
      } else if (isPendingTrucoResponder) {
        actingBotID = state.G.currentTrucoCall!.pendingResponderID;
      } else if (currentPID !== "0") {
        actingBotID = currentPID;
      }

      if (actingBotID && actingBotID !== "0") {
        const botMove = getBotMove(state.G, actingBotID);
        if (!botMove) return;

        const targetBotClient = botClients[Number(actingBotID) - 1];
        if (!targetBotClient) return;

        isProcessing = true;
        setTimeout(() => {
          isProcessing = false;
          const currentState = targetBotClient.getState();
          if (!currentState || currentState.ctx.gameover) return;

          switch (botMove.type) {
            case "playCard":
              targetBotClient.moves.playCard(botMove.cardId);
              break;
            case "callEnvido":
              targetBotClient.moves.callEnvido(botMove.callType);
              break;
            case "respondEnvido":
              targetBotClient.moves.respondEnvido({
                accept: botMove.accept,
                raiseType: botMove.raiseType,
              });
              break;
            case "callTruco":
              targetBotClient.moves.callTruco(botMove.callType);
              break;
            case "respondTruco":
              targetBotClient.moves.respondTruco(botMove.accept);
              break;
            case "irseAlMazo":
              targetBotClient.moves.irseAlMazo();
              break;
          }
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
      botClients.forEach((c) => c.stop());
    };
  }, [updateStats]);

  return <Local2v2TrucoClient matchID="ai-2v2-match" playerID="0" />;
}

type GameMode = "ai-1v1" | "ai-2v2" | "local" | "online" | null;

function MainApp() {
  const { profile } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useI18n();

  const [mode, setMode] = useState<GameMode>(null);
  const [matchID, setMatchID] = useState("demo-match");
  const [playerID, setPlayerID] = useState("0");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  if (mode === "ai-1v1") {
    return (
      <div>
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 1000 }}>
          <button onClick={() => setMode(null)} style={leaveBtnStyle}>
            {t("app.leave")}
          </button>
        </div>
        <AiGameContainer />
      </div>
    );
  }

  if (mode === "ai-2v2") {
    return (
      <div>
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 1000 }}>
          <button onClick={() => setMode(null)} style={leaveBtnStyle}>
            {t("app.leave")}
          </button>
        </div>
        <Ai2v2GameContainer />
      </div>
    );
  }

  if (mode === "local") {
    return (
      <div>
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 1000 }}>
          <button onClick={() => setMode(null)} style={leaveBtnStyle}>
            {t("app.leave")}
          </button>
        </div>
        <Local2v2TrucoClient matchID="local-match" playerID={playerID} />
      </div>
    );
  }

  if (mode === "online") {
    return (
      <div>
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 1000 }}>
          <button onClick={() => setMode(null)} style={leaveBtnStyle}>
            {t("app.leave")}
          </button>
        </div>
        <OnlineTrucoClient matchID={matchID} playerID={playerID} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
        color: "#f8fafc",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* Top Header & Navigation Bar */}
      <header
        style={{
          width: "100%",
          maxWidth: "1280px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          padding: "14px 24px",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#f59e0b", letterSpacing: "1px" }}>
            {t("app.title")}
          </h1>
        </div>

        {/* Right Header Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "#0f172a",
              color: "#f59e0b",
              border: "1px solid rgba(255,255,255,0.2)",
              fontWeight: "bold",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <option value="es">🇪🇸 Español</option>
            <option value="en">🇬🇧 English</option>
            {availableLanguages
              .filter((l) => l !== "es" && l !== "en")
              .map((l) => (
                <option key={l} value={l}>
                  🌐 {l.toUpperCase()}
                </option>
              ))}
          </select>

          {/* User Profile Badge */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#f59e0b" }}>
              {getCountryFlag(profile?.country_code)} {profile?.username || "Guest"} {profile?.role === "admin" && "🛡️"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              ELO: <strong style={{ color: "#60a5fa" }}>{profile?.elo_rating ?? 1200}</strong> | W/L: {profile?.matches_won ?? 0}/{profile?.matches_played ?? 0}
            </div>
          </div>

          {profile?.role === "admin" && (
            <button
              onClick={() => setIsAdminOpen(true)}
              style={{
                padding: "6px 12px",
                background: "#d97706",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {t("app.admin")}
            </button>
          )}

          <button
            onClick={() => setIsAuthOpen(true)}
            style={{
              padding: "6px 12px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("app.account")}
          </button>
        </div>
      </header>

      {/* Main Lobby Dashboard: 3-Column Grid */}
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          display: "grid",
          gridTemplateColumns: "360px 1fr 340px",
          gap: "20px",
          alignItems: "stretch",
        }}
      >
        {/* Left Column: Game Modes & Match Setup */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", color: "#f59e0b" }}>
              🎮 Select Game Mode
            </h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
              {t("app.subtitle")}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* 1v1 AI Mode */}
            <button
              onClick={() => setMode("ai-1v1")}
              style={{
                padding: "14px 18px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                fontWeight: "bold",
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
              }}
            >
              🤖 1v1 vs AI (Single Player)
            </button>

            {/* 2v2 AI Mode (4 Players) */}
            <button
              onClick={() => setMode("ai-2v2")}
              style={{
                padding: "14px 18px",
                background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                fontWeight: "bold",
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(217, 119, 6, 0.4)",
              }}
            >
              👥 2v2 vs AI (4 Players - Partners)
            </button>

            {/* Local 4-Player Pass & Play */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#e2e8f0" }}>
                👥 Local 2v2 (Pass & Play 4 Seats)
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Seat:</span>
                <select
                  value={playerID}
                  onChange={(e) => setPlayerID(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: "1px solid rgba(255,255,255,0.2)",
                    fontSize: "0.75rem",
                  }}
                >
                  <option value="0">P0 (Team 0)</option>
                  <option value="1">P1 (Team 1)</option>
                  <option value="2">P2 (Team 0)</option>
                  <option value="3">P3 (Team 1)</option>
                </select>
              </div>
              <button
                onClick={() => setMode("local")}
                style={{
                  padding: "8px 14px",
                  background: "#059669",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Start 2v2 Local Match
              </button>
            </div>

            {/* Online Match */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#e2e8f0" }}>
                🌐 Online Server Match (1v1 / 2v2)
              </div>
              <input
                value={matchID}
                onChange={(e) => setMatchID(e.target.value)}
                placeholder="Match ID"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#0f172a",
                  color: "#f8fafc",
                  border: "1px solid rgba(255,255,255,0.2)",
                  width: "100%",
                  textAlign: "center",
                  fontSize: "0.8rem",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => setMode("online")}
                style={{
                  padding: "8px 14px",
                  background: "#d97706",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Connect to Server
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Global Lobby Chat */}
        <div style={{ minHeight: "560px" }}>
          <LobbyChat />
        </div>

        {/* Right Column: Weekly & All-Time Leaderboard */}
        <div style={{ minHeight: "560px" }}>
          <Leaderboard />
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <StorageProvider>
      <I18nProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </I18nProvider>
    </StorageProvider>
  );
}

const leaveBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  background: "rgba(15, 23, 42, 0.85)",
  color: "#94a3b8",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.85rem",
};
