import React, { useState, useEffect } from "react";
import { Client as BoardClient } from "boardgame.io/client";
import { Client } from "boardgame.io/react";
import { SocketIO, Local } from "boardgame.io/multiplayer";
import { TrucoGame, getBotMove } from "shared";
import { TrucoBoard } from "./TrucoBoard.js";
import { AuthProvider, useAuth } from "./AuthContext.js";
import { AuthModal } from "./AuthModal.js";
import { AdminPanel } from "./AdminPanel.js";
import { I18nProvider, useI18n } from "./i18n/I18nContext.js";
import { StorageProvider } from "./storage/StorageContext.js";


const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

// Online Client
const OnlineTrucoClient = Client({
  game: TrucoGame,
  board: TrucoBoard,
  multiplayer: SocketIO({ server: SERVER_URL }),
  debug: false,
});

// Pass & Play Local Client
const LocalTrucoClient = Client({
  game: TrucoGame,
  board: TrucoBoard,
  multiplayer: Local(),
  debug: false,
});

// AI Single-Player Container
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

      // Match finished -> record stats
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

type GameMode = "ai" | "local" | "online" | null;

function MainApp() {
  const { profile } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useI18n();

  const [mode, setMode] = useState<GameMode>(null);
  const [matchID, setMatchID] = useState("demo-match");
  const [playerID, setPlayerID] = useState("0");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  if (mode === "ai") {
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

  if (mode === "local") {
    return (
      <div>
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 1000 }}>
          <button onClick={() => setMode(null)} style={leaveBtnStyle}>
            {t("app.leave")}
          </button>
        </div>
        <LocalTrucoClient matchID="local-match" playerID={playerID} />
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
        justifyContent: "center",
        padding: "24px",
        position: "relative",
      }}
    >
      {/* Top Profile & Language Selector Header Bar */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(8px)",
          padding: "8px 16px",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Language Selector Dropdown */}
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

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#f59e0b" }}>
            👤 {profile?.username || "Guest"} {profile?.role === "admin" && "🛡️"}
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

      {/* Lobby Menu */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 8px 0", fontSize: "2rem", color: "#f59e0b" }}>
          {t("app.title")}
        </h1>
        <p style={{ margin: "0 0 28px 0", color: "#94a3b8", fontSize: "0.95rem" }}>
          {t("app.subtitle")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Play Against AI */}
          <button
            onClick={() => setMode("ai")}
            style={{
              padding: "16px 24px",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              fontWeight: "bold",
              fontSize: "1.05rem",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
              transition: "transform 0.15s ease",
            }}
          >
            {t("mode.ai")}
          </button>

          {/* Local 2-Player */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#e2e8f0" }}>
              {t("mode.local")}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{t("mode.select_seat")}</span>
              <select
                value={playerID}
                onChange={(e) => setPlayerID(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "#0f172a",
                  color: "#f8fafc",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <option value="0">Player 0</option>
                <option value="1">Player 1</option>
              </select>
            </div>
            <button
              onClick={() => setMode("local")}
              style={{
                padding: "10px 18px",
                background: "#059669",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {t("mode.start_local")}
            </button>
          </div>

          {/* Online Match */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#e2e8f0" }}>
              {t("mode.online")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
              <input
                value={matchID}
                onChange={(e) => setMatchID(e.target.value)}
                placeholder={t("mode.match_id")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#0f172a",
                  color: "#f8fafc",
                  border: "1px solid rgba(255,255,255,0.2)",
                  width: "80%",
                  textAlign: "center",
                }}
              />
            </div>
            <button
              onClick={() => setMode("online")}
              style={{
                padding: "10px 18px",
                background: "#d97706",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {t("mode.connect_server")}
            </button>
          </div>
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
