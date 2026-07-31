import React, { useState, useEffect } from "react";
import { Client } from "boardgame.io/react";
import { TrucoGame } from "shared";
import { TrucoBoard } from "./TrucoBoard.js";
import { AuthModal } from "./AuthModal.js";
import { AdminPanel } from "./AdminPanel.js";
import { LobbyChat } from "./LobbyChat.js";
import { Leaderboard } from "./Leaderboard.js";
import { MatchmakingQueue } from "./MatchmakingQueue.js";
import { AuthProvider, useAuth, getCountryFlag } from "./AuthContext.js";
import { I18nProvider, useI18n } from "./i18n/I18nContext.js";
import { StorageProvider } from "./storage/StorageContext.js";

// boardgame.io Client wrappers
const PeligrosoClient1v1AI = Client({
  game: TrucoGame,
  numPlayers: 2,
  board: TrucoBoard,
  debug: false,
});

const PeligrosoClient2v2AI = Client({
  game: TrucoGame,
  numPlayers: 4,
  board: TrucoBoard,
  debug: false,
});

function MainApp() {
  const { profile } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useI18n();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);

  const [mode, setMode] = useState<"lobby" | "ranked-1v1" | "ai-1v1" | "ai-2v2" | "local">("lobby");
  const [playerID, setPlayerID] = useState<string>("0");
  const [activeMatchID, setActiveMatchID] = useState<string>("demo-match");

  const [activeSession, setActiveSession] = useState<{ matchID: string; playerID: string; mode: any } | null>(() => {
    try {
      const saved = localStorage.getItem("peligroso_active_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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
        {mode === "ranked-1v1" || mode === "ai-1v1" ? (
          <PeligrosoClient1v1AI playerID={playerID} matchID={activeMatchID} onLeaveMatch={() => { handleClearSession(); setMode("lobby"); }} />
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
                {getCountryFlag(profile?.country_code)} {profile?.username || "Guest"} {profile?.role === "admin" && "🛡️"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                ELO: <strong style={{ color: "#60a5fa" }}>{profile?.elo_rating ?? 1200}</strong> | W/L: {profile?.matches_won ?? 0}/{profile?.matches_played ?? 0}
              </div>
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
                Active Match In Progress! (Match #{activeSession.matchID})
              </div>
              <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                You were disconnected or refreshed. Click rejoin below to return to your game.
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
              ⚡ Rejoin Match Now
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
              Abandon Session ❌
            </button>
          </div>
        </div>
      )}

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
              {/* 1v1 Multiplayer Matchmaking Queue (Primary Mode) */}
              <button
                onClick={handleStartRankedQueue}
                style={{
                  padding: "16px 18px",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  fontWeight: "bold",
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(245, 158, 11, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                ⚔️ Play 1v1 vs Real Player (Queue)
              </button>

              {/* 1v1 AI Solo Practice Mode */}
              <button
                onClick={() => {
                  setActiveMatchID("demo-ai-match");
                  setPlayerID("0");
                  setMode("ai-1v1");
                }}
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
                🤖 Practice 1v1 vs AI Bot (Solo)
              </button>

              {/* 2v2 AI Mode (4 Players) */}
              <button
                onClick={() => {
                  setActiveMatchID("demo-2v2-match");
                  setPlayerID("0");
                  setMode("ai-2v2");
                }}
                style={{
                  padding: "14px 18px",
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.4)",
                }}
              >
                👥 2v2 Team Match (4 Players)
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
                  👥 Local 2v2 (Pass & Play Seats)
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
                    background: "#475569",
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
            </div>

            {/* Leaderboard Preview Card */}
            <Leaderboard />
          </div>

          {/* Middle Column: Live Global Lobby Chat */}
          <div style={{ height: "640px" }}>
            <LobbyChat />
          </div>

          {/* Right Column: Player Profile & Quick Customization */}
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
              <h3 style={{ margin: "0 0 4px 0", color: "#f59e0b", fontSize: "1.1rem" }}>
                👤 Your Player Profile
              </h3>
              <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                {profile?.is_guest ? "Logged in as Guest" : "Authenticated Player"}
              </div>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "#1e293b",
                  border: "2px solid #f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  color: "#f59e0b",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (profile?.username || "G").charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#60a5fa" }}>
                  {getCountryFlag(profile?.country_code)} {profile?.username || "Guest"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                  ELO Rating: <strong style={{ color: "#f59e0b" }}>{profile?.elo_rating ?? 1200}</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Matches Won: {profile?.matches_won ?? 0} / {profile?.matches_played ?? 0}
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
              🎨 Customize Deck, Mat & Flag
            </button>
          </div>
        </div>

      {/* Modals */}
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
