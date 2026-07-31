import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Client } from "boardgame.io/react";
import { Client as BoardClient } from "boardgame.io/client";
import { SocketIO, Local } from "boardgame.io/multiplayer";
import { TrucoGame, getBotMove } from "shared";
import { TrucoBoard } from "./TrucoBoard.js";
import { AuthModal } from "./AuthModal.js";
import { LobbyChat } from "./LobbyChat.js";
import { Leaderboard } from "./Leaderboard.js";
import { MatchmakingQueue } from "./MatchmakingQueue.js";
import { AuthProvider, useAuth, getCountryFlag } from "./AuthContext.js";
import { CreditsShopModal } from "./CreditsShopModal.js";
import { I18nProvider, useI18n } from "./i18n/I18nContext.js";
import { StorageProvider } from "./storage/StorageContext.js";
import { AdminLayout } from "./admin/AdminLayout.js";
import { UsersSection } from "./admin/UsersSection.js";
import { DecksSection } from "./admin/DecksSection.js";
import { I18nSection } from "./admin/I18nSection.js";
import { StorageSection } from "./admin/StorageSection.js";
import { PaymentsSection } from "./admin/PaymentsSection.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

// boardgame.io Client wrappers
// Local() transport lets a human-controlled client and headless bot
// client(s) share the same in-tab game state, each properly authorized
// only for their own playerID's moves - required for AI seats to work,
// and also what powers pass-and-play seat switching.
const PeligrosoClient1v1AI = Client({
  game: TrucoGame,
  numPlayers: 2,
  board: TrucoBoard,
  multiplayer: Local(),
  debug: false,
});

// Ranked 1v1 vs a real matched opponent - networked via the game server, not local-only.
const PeligrosoClientRanked1v1 = Client({
  game: TrucoGame,
  numPlayers: 2,
  board: TrucoBoard,
  multiplayer: SocketIO({ server: SERVER_URL }),
  debug: false,
});

const PeligrosoClient2v2AI = Client({
  game: TrucoGame,
  numPlayers: 4,
  board: TrucoBoard,
  multiplayer: Local(),
  debug: false,
});

/**
 * Drives one or more AI-controlled seats via headless (non-React)
 * boardgame.io clients sharing the same Local() bus as the human's
 * client. A dispatched move is always attributed to the dispatching
 * client's own playerID, so each bot seat needs its own client - a
 * single client cannot legally act as more than one player.
 */
function useAIBots(matchID: string, aiSeats: string[], numPlayers: number, active: boolean) {
  const { updateStats } = useAuth();
  const aiSeatsKey = aiSeats.join(",");

  useEffect(() => {
    if (!active || !aiSeatsKey) return;
    const seats = aiSeatsKey.split(",");

    const botClientMap = new Map(
      seats.map((pid) => [
        pid,
        BoardClient({
          game: TrucoGame,
          multiplayer: Local(),
          matchID,
          playerID: pid,
          numPlayers,
          debug: false,
        }),
      ])
    );
    botClientMap.forEach((c) => c.start());

    let isProcessing = false;
    let statsRecorded = false;
    const [firstClient] = botClientMap.values();

    const unsubscribe = firstClient.subscribe((state) => {
      if (!state) return;

      if (state.ctx.gameover && !statsRecorded) {
        statsRecorded = true;
        updateStats(state.ctx.gameover.winner === "0");
        return;
      }

      if (state.ctx.gameover || isProcessing) return;

      const currentPID = state.ctx.currentPlayer;
      const envidoResponder =
        state.G.currentEnvidoCall?.accepted === null ? state.G.currentEnvidoCall?.pendingResponderID : undefined;
      const trucoResponder =
        state.G.currentTrucoCall?.accepted === null ? state.G.currentTrucoCall?.pendingResponderID : undefined;

      const actingBotID =
        (envidoResponder && botClientMap.has(envidoResponder) && envidoResponder) ||
        (trucoResponder && botClientMap.has(trucoResponder) && trucoResponder) ||
        (botClientMap.has(currentPID) && currentPID) ||
        null;

      if (!actingBotID) return;

      const botMove = getBotMove(state.G, actingBotID);
      if (!botMove) return;

      const targetClient = botClientMap.get(actingBotID);
      if (!targetClient) return;

      isProcessing = true;
      setTimeout(() => {
        isProcessing = false;
        const currentState = targetClient.getState();
        if (!currentState || currentState.ctx.gameover) return;

        switch (botMove.type) {
          case "playCard":
            targetClient.moves.playCard(botMove.cardId);
            break;
          case "callEnvido":
            targetClient.moves.callEnvido(botMove.callType);
            break;
          case "respondEnvido":
            targetClient.moves.respondEnvido({
              accept: botMove.accept,
              raiseType: botMove.raiseType,
            });
            break;
          case "callTruco":
            targetClient.moves.callTruco(botMove.callType);
            break;
          case "respondTruco":
            targetClient.moves.respondTruco(botMove.accept);
            break;
          case "irseAlMazo":
            targetClient.moves.irseAlMazo();
            break;
        }
      }, 1000);
    });

    return () => {
      unsubscribe();
      botClientMap.forEach((c) => c.stop());
    };
  }, [matchID, active, numPlayers, aiSeatsKey, updateStats]);
}

function MainApp() {
  const { profile } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useI18n();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreditsShopOpen, setIsCreditsShopOpen] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);

  const [mode, setMode] = useState<"lobby" | "ranked-1v1" | "ai-1v1" | "ai-2v2" | "local">("lobby");
  const [playerID, setPlayerID] = useState<string>("0");
  const [activeMatchID, setActiveMatchID] = useState<string>("demo-match");

  useAIBots(activeMatchID, ["1"], 2, mode === "ai-1v1");
  useAIBots(activeMatchID, ["1", "2", "3"], 4, mode === "ai-2v2");

  const [activeSession, setActiveSession] = useState<{ matchID: string; playerID: string; mode: any } | null>(() => {
    try {
      const saved = localStorage.getItem("peligroso_active_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [onlineCount, setOnlineCount] = useState<number>(1);

  useEffect(() => {
    async function sendHeartbeat() {
      try {
        const res = await fetch(`${SERVER_URL}/api/presence/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile?.id || "guest" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.onlineCount) {
            setOnlineCount(data.onlineCount);
          }
        }
      } catch {
        setOnlineCount((prev) => (prev < 1 ? 1 : prev));
      }
    }

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  useEffect(() => {
    if (mode !== "lobby") {
      const session = { matchID: activeMatchID, playerID, mode, timestamp: Date.now() };
      localStorage.setItem("peligroso_active_session", JSON.stringify(session));
      setActiveSession(session);
    }
  }, [mode, activeMatchID, playerID]);

  function handleRejoinMatch() {
    if (activeSession) {
      setActiveMatchID(activeSession.matchID);
      setPlayerID(activeSession.playerID);
      setMode(activeSession.mode);
    }
  }

  function handleClearSession() {
    localStorage.removeItem("peligroso_active_session");
    setActiveSession(null);
  }

  function handleStartRankedQueue() {
    setIsQueueing(true);
  }

  function handleMatchFound(matchID: string, assignedID: string, opponentName: string) {
    setActiveMatchID(matchID);
    setPlayerID(assignedID);
    setIsQueueing(false);
    setMode("ranked-1v1");
  }

  if (mode !== "lobby") {
    return (
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#020617" }}>
        {mode === "ranked-1v1" ? (
          <PeligrosoClientRanked1v1 playerID={playerID} matchID={activeMatchID} onLeaveMatch={() => { handleClearSession(); setMode("lobby"); }} />
        ) : mode === "ai-1v1" ? (
          <PeligrosoClient1v1AI playerID={playerID} matchID={activeMatchID} onLeaveMatch={() => { handleClearSession(); setMode("lobby"); }} />
        ) : mode === "ai-2v2" ? (
          <PeligrosoClient2v2AI playerID={playerID} matchID={activeMatchID} onLeaveMatch={() => { handleClearSession(); setMode("lobby"); }} />
        ) : (
          <PeligrosoClient2v2AI playerID={playerID} matchID={activeMatchID} onLeaveMatch={() => { handleClearSession(); setMode("lobby"); }} />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top center, #0f172a 0%, #020617 100%)",
        color: "#f8fafc",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
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
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#f59e0b", letterSpacing: "1px" }}>
            {t("app.title")}
          </h1>

          {/* Live Online Users Badge (Registered + Guests) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "0.8rem",
              color: "#4ade80",
              fontWeight: "bold",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", display: "inline-block" }} />
            <span>{onlineCount} {onlineCount === 1 ? "Player" : "Players"} Online</span>
          </div>
        </div>

        {/* Right Header Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "right" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                overflow: "hidden",
                background: "#1e293b",
                border: "2px solid #f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.95rem",
                fontWeight: "bold",
                color: "#f59e0b",
                flexShrink: 0,
              }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (profile?.username || "G").charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#f59e0b" }}>
                {getCountryFlag(profile?.country_code, profile?.is_guest)} {profile?.username || "Guest"} {profile?.role === "admin" && "🛡️"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                ELO: <strong style={{ color: "#60a5fa" }}>{profile?.elo_rating ?? 1200}</strong> | W/L: {profile?.matches_won ?? 0}/{profile?.matches_played ?? 0}
              </div>
            </div>
          </div>

          {/* Credits Store Button */}
          <button
            onClick={() => setIsCreditsShopOpen(true)}
            style={{
              padding: "6px 14px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))",
              border: "1px solid #f59e0b",
              color: "#f59e0b",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)",
            }}
          >
            <span>💎</span> {(profile?.credits ?? 1000).toLocaleString()} Credits
          </button>

          {profile?.role === "admin" && (
            <Link
              to="/admin"
              style={{
                padding: "6px 12px",
                background: "#d97706",
                color: "#ffffff",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {t("app.admin")}
            </Link>
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

      {/* Credits Shop Modal */}
      {isCreditsShopOpen && <CreditsShopModal onClose={() => setIsCreditsShopOpen(false)} />}

      {/* Real-Time 1v1 Matchmaking Queue Overlay */}
      {isQueueing && (
        <MatchmakingQueue
          onMatchFound={handleMatchFound}
          onCancel={() => setIsQueueing(false)}
          onSwitchToAI={() => {
            setIsQueueing(false);
            setMode("ai-1v1");
          }}
        />
      )}

      {/* Active Session Reconnection Banner */}
      {activeSession && mode === "lobby" && (
        <div
          style={{
            width: "100%",
            maxWidth: "1280px",
            background: "linear-gradient(135deg, rgba(30, 58, 138, 0.95), rgba(30, 41, 59, 0.95))",
            backdropFilter: "blur(16px)",
            border: "2px solid #3b82f6",
            borderRadius: "16px",
            padding: "14px 24px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.6rem" }}>⚡</span>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#60a5fa" }}>
                {t("active_session.title", { id: activeSession.matchID })}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                {t("active_session.desc")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleRejoinMatch}
              style={{
                padding: "8px 18px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
              }}
            >
              {t("active_session.rejoin")}
            </button>
            <button
              onClick={handleClearSession}
              style={{
                padding: "8px 12px",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#fca5a5",
                border: "1px solid #ef4444",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {t("active_session.abandon")}
            </button>
          </div>
        </div>
      )}

      {/* Main Esports Lobby Dashboard: 3-Column Grid */}
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
        {/* Left Column: Match Center */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "bold" }}>
              MATCH CENTER
            </div>
            <h2 style={{ margin: "2px 0 0 0", fontSize: "1.25rem", color: "#f8fafc", fontWeight: "bold" }}>
              Competitive Arenas
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Primary Action: Ranked 1v1 Queue Card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                borderRadius: "16px",
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 8px 24px rgba(37, 99, 235, 0.2)",
              }}
            >
              <div>
                <span style={{ background: "#2563eb", color: "#ffffff", fontSize: "0.65rem", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  PRIMARY MODE
                </span>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#ffffff", marginTop: "6px" }}>
                  Ranked 1v1 Matchmaking
                </div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
                  Official ELO Rating Competitive Queue
                </div>
              </div>

              <button
                onClick={handleStartRankedQueue}
                style={{
                  padding: "12px 16px",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
                  letterSpacing: "0.5px",
                }}
              >
                ENTER QUEUE
              </button>
            </div>

            {/* Solo Practice vs AI */}
            <button
              onClick={() => {
                setActiveMatchID("demo-ai-match");
                setPlayerID("0");
                setMode("ai-1v1");
              }}
              style={{
                padding: "14px 18px",
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#f8fafc",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>1v1 Practice vs AI Bot</span>
              <span style={{ fontSize: "0.75rem", color: "#60a5fa" }}>SOLO →</span>
            </button>

            {/* 2v2 Team Match */}
            <button
              onClick={() => {
                setActiveMatchID("demo-2v2-match");
                setPlayerID("0");
                setMode("ai-2v2");
              }}
              style={{
                padding: "14px 18px",
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#f8fafc",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>2v2 Team Match (4 Players)</span>
              <span style={{ fontSize: "0.75rem", color: "#4ade80" }}>TEAMS →</span>
            </button>

            {/* Local Pass & Play Card */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "0.85rem", color: "#cbd5e1" }}>
                Local 2v2 Pass & Play
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Select Seat:</span>
                <select
                  value={playerID}
                  onChange={(e) => setPlayerID(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontSize: "0.75rem",
                  }}
                >
                  <option value="0">Seat P0 (Team 0)</option>
                  <option value="1">Seat P1 (Team 1)</option>
                  <option value="2">Seat P2 (Team 0)</option>
                  <option value="3">Seat P3 (Team 1)</option>
                </select>
              </div>
              <button
                onClick={() => setMode("local")}
                style={{
                  padding: "8px 12px",
                  background: "#334155",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Start Local Game
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column: Live Global Lobby Chat */}
        <div style={{ height: "640px" }}>
          <LobbyChat />
        </div>

        {/* Right Column: Player Profile & Global Standings */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Player Profile Card */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.8)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
              padding: "20px",
              boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>
                  PLAYER DOSSIER
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#60a5fa", marginTop: "2px" }}>
                  {getCountryFlag(profile?.country_code, profile?.is_guest)} {profile?.username || "Guest"}
                </div>
              </div>
              <span style={{ fontSize: "0.7rem", background: "rgba(245, 158, 11, 0.2)", border: "1px solid #f59e0b", color: "#f59e0b", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold" }}>
                {profile?.role === "admin" ? "ADMIN" : "PLAYER"}
              </span>
            </div>

            <div style={{ background: "rgba(30, 41, 59, 0.6)", borderRadius: "12px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>ELO Rating</div>
                <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#f59e0b", marginTop: "2px" }}>
                  {profile?.elo_rating ?? 1200}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>W / L Record</div>
                <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#4ade80", marginTop: "2px" }}>
                  {profile?.matches_won ?? 0} W / {((profile?.matches_played ?? 0) - (profile?.matches_won ?? 0))} L
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAuthOpen(true)}
              style={{
                padding: "10px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Account Customization
            </button>
          </div>

          {/* Global Leaderboard Standings */}
          <div style={{ flex: 1 }}>
            <Leaderboard />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <StorageProvider>
        <I18nProvider>
          <AuthProvider>
            <Routes>
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<UsersSection />} />
                <Route path="decks" element={<DecksSection />} />
                <Route path="i18n" element={<I18nSection />} />
                <Route path="storage" element={<StorageSection />} />
                <Route path="payments" element={<PaymentsSection />} />
              </Route>
              <Route path="/*" element={<MainApp />} />
            </Routes>
          </AuthProvider>
        </I18nProvider>
      </StorageProvider>
    </BrowserRouter>
  );
}
