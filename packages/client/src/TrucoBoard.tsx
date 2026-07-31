import React, { useState, useEffect } from "react";
import type { BoardProps } from "boardgame.io/react";
import {
  TrucoGameState,
  Card,
  getValidEnvidoRaises,
  calculateEnvido,
  EnvidoCallType,
  TrucoCallType,
  HandPhase,
} from "shared";
import { useAuth, PRESET_MATS } from "./AuthContext.js";
import { PointStakeMeter } from "./PointStakeMeter.js";
import { useI18n } from "./i18n/I18nContext.js";
import { SocialPanel } from "./social/SocialPanel.js";
import { VideoAvatar } from "./social/VideoAvatar.js";





const SUIT_ICONS: Record<string, string> = {
  espada: "⚔️",
  basto: "🪵",
  oro: "🪙",
  copa: "🍷",
};

const SUIT_COLORS: Record<string, string> = {
  espada: "#1e3a8a",
  basto: "#14532d",
  oro: "#78350f",
  copa: "#831843",
};

export function TrucoBoard({ G, ctx, moves, playerID }: BoardProps<TrucoGameState>) {
  const { profile, decks } = useAuth();
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [myVideoStream, setMyVideoStream] = useState<MediaStream | null>(null);


  const PHASE_DESCRIPTIONS: Record<HandPhase, string> = {
    PRIMERA: t("phase.primera_desc"),
    SEGUNDA: t("phase.segunda_desc"),
    TERCERA: t("phase.tercera_desc"),
  };

  const myID = playerID ?? "0";
  const opponentID = myID === "0" ? "1" : "0";
  const isMyTurn = ctx.currentPlayer === myID;
  const isGameOver = ctx.gameover !== undefined;

  const myHand = G.hands[myID] ?? [];
  const opponentCardsPlayed = G.tableCards[opponentID] ?? [];
  const myCardsPlayed = G.tableCards[myID] ?? [];

  const isMano = G.manoID === myID;
  const envidoPending = G.currentEnvidoCall && G.currentEnvidoCall.accepted === null;
  const trucoPending = G.currentTrucoCall && G.currentTrucoCall.accepted === null;

  const isEnvidoResponder = envidoPending && G.currentEnvidoCall?.pendingResponderID === myID;
  const isTrucoResponder = trucoPending && G.currentTrucoCall?.pendingResponderID === myID;

  // Valid Envido calls for current turn
  const envidoHistory = G.currentEnvidoCall?.history ?? [];
  const validEnvidoRaises = getValidEnvidoRaises(envidoHistory);

  // Truco state helper
  const trucoState = G.currentTrucoCall?.type;
  const nextTrucoCall: TrucoCallType | null =
    !trucoState ? "truco" : trucoState === "truco" ? "retruco" : trucoState === "retruco" ? "vale4" : null;

  const myEnvidoScore = calculateEnvido([...myHand, ...myCardsPlayed]);

  const canPlayCards = isMyTurn && !envidoPending && !trucoPending && !isGameOver;

  const activePlayerID = ctx.currentPlayer;

  const [handDelayCountdown, setHandDelayCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (G.handOver && !G.winner) {
      setHandDelayCountdown(3);
      const interval = setInterval(() => {
        setHandDelayCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      }, 1000);

      const timeout = setTimeout(() => {
        if (moves?.nextHand) moves.nextHand();
        setHandDelayCountdown(null);
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setHandDelayCountdown(null);
    }
  }, [G.handOver, G.handNumber, G.winner]);

  const player0MatUrl = profile?.custom_mat_url || PRESET_MATS[0].url;
  const player0MatOpacity = profile?.mat_opacity ?? 0.85;

  const player1MatUrl = PRESET_MATS[3].url; // Cyber Grid Arena for Player 1 / AI
  const player1MatOpacity = 0.85;

  const activeMatUrl = activePlayerID === "0" ? player0MatUrl : player1MatUrl;
  const activeMatOpacity = activePlayerID === "0" ? player0MatOpacity : player1MatOpacity;
  const activeMatOwnerName =
    activePlayerID === "0" ? profile?.username || "Player 0" : "Player 1 (AI)";

  const activeDeckTheme =
    decks.find((d) => d.id === profile?.selected_deck_id) || decks[0];

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
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* Top Header & Scoreboard */}
      <header
        style={{
          width: "100%",
          maxWidth: "1140px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          padding: "12px 24px",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#f59e0b", letterSpacing: "1px" }}>
            {t("app.title")}
          </h1>
          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Hand #{G.handNumber} — You are <strong>Player {myID}</strong> ({profile?.username || "Guest"}) {isMano && "🖐️ (Mano)"}
          </div>
        </div>

        {/* Scores */}
        <div style={{ display: "flex", gap: "20px" }}>
          <div
            style={{
              textAlign: "center",
              padding: "6px 16px",
              background: myID === "0" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              border: myID === "0" ? "1px solid #3b82f6" : "1px solid transparent",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>
              Team 0 {G.manoID === "0" && "🖐️"}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#60a5fa" }}>
              {G.scores["0"]} <span style={{ fontSize: "0.85rem", color: "#64748b" }}>/ 30</span>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "6px 16px",
              background: myID === "1" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              border: myID === "1" ? "1px solid #3b82f6" : "1px solid transparent",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>
              Team 1 {G.manoID === "1" && "🖐️"}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#f472b6" }}>
              {G.scores["1"]} <span style={{ fontSize: "0.85rem", color: "#64748b" }}>/ 30</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3-Second Hand Finalized Overlay Banner */}
      {G.handOver && !G.winner && (
        <div
          style={{
            position: "fixed",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2000,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            border: "2px solid #f59e0b",
            borderRadius: "24px",
            padding: "24px 36px",
            textAlign: "center",
            boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
            color: "#ffffff",
            minWidth: "340px",
          }}
        >
          <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#f59e0b", marginBottom: "8px" }}>
            🏁 Hand #{G.handNumber} Finalized!
          </div>
          <div style={{ fontSize: "0.95rem", color: "#e2e8f0", marginBottom: "16px" }}>
            {G.activeNotice?.title || "Hand Concluded"} — {G.activeNotice?.message || "Preparing next hand..."}
          </div>

          {/* 3-Second Countdown Progress Bar */}
          <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
            <div
              style={{
                height: "100%",
                width: `${((handDelayCountdown ?? 3) / 3) * 100}%`,
                background: "linear-gradient(90deg, #f59e0b, #3b82f6)",
                transition: "width 1s linear",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: "bold" }}>
              ⏳ Next hand in {handDelayCountdown ?? 3}s...
            </span>
            <button
              onClick={() => {
                if (moves?.nextHand) moves.nextHand();
                setHandDelayCountdown(null);
              }}
              style={{
                padding: "8px 16px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Next Hand Now ⏩
            </button>
          </div>
        </div>
      )}

      {/* Floating Active Event Notice (Atorado, Fold, Showdown) */}
      {G.activeNotice && !G.handOver && (
        <div
          key={G.activeNotice.id}
          style={{
            position: "fixed",
            top: "84px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "90%",
            maxWidth: "540px",
            background:
              G.activeNotice.type === "atorado"
                ? "linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(120, 53, 15, 0.98))"
                : G.activeNotice.type === "mazo"
                ? "linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(127, 29, 29, 0.98))"
                : G.activeNotice.type === "envido"
                ? "linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(30, 58, 138, 0.98))"
                : "linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(20, 83, 45, 0.98))",
            backdropFilter: "blur(16px)",
            border:
              G.activeNotice.type === "atorado"
                ? "2px solid #f59e0b"
                : G.activeNotice.type === "mazo"
                ? "2px solid #ef4444"
                : "2px solid #3b82f6",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            borderRadius: "20px",
            padding: "16px 24px",
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              marginBottom: "6px",
              color:
                G.activeNotice.type === "atorado"
                  ? "#f59e0b"
                  : G.activeNotice.type === "mazo"
                  ? "#f87171"
                  : "#60a5fa",
              letterSpacing: "0.5px",
            }}
          >
            {G.activeNotice.title}
          </div>
          <div style={{ fontSize: "0.95rem", lineHeight: "1.4", color: "#f1f5f9" }}>
            {G.activeNotice.message}
          </div>
        </div>
      )}

      {/* Main Game Layout: Left Sidebar + Arena Mat + Right Log Sidebar */}
      <div
        style={{
          width: "100%",
          maxWidth: "1140px",
          display: "grid",
          gridTemplateColumns: "220px 1fr 240px",
          gap: "16px",
          alignItems: "stretch",
        }}
      >
        {/* Left Sidebar: Hand Phase & Match State Tracker */}
        <aside
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Active Phase Badge */}
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold", marginBottom: "6px" }}>
              {t("phase.title")}
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "14px",
                fontWeight: "bold",
                fontSize: "0.9rem",
                textAlign: "center",
                background:
                  G.phase === "PRIMERA"
                    ? "rgba(59, 130, 246, 0.25)"
                    : G.phase === "SEGUNDA"
                    ? "rgba(234, 179, 8, 0.25)"
                    : "rgba(239, 68, 68, 0.25)",
                color:
                  G.phase === "PRIMERA"
                    ? "#60a5fa"
                    : G.phase === "SEGUNDA"
                    ? "#fde047"
                    : "#f87171",
                border: `1px solid ${
                  G.phase === "PRIMERA"
                    ? "#3b82f6"
                    : G.phase === "SEGUNDA"
                    ? "#eab308"
                    : "#ef4444"
                }`,
              }}
            >
              📍 {G.phase}
              <div style={{ fontSize: "0.75rem", fontWeight: "normal", marginTop: "2px", opacity: 0.9 }}>
                {PHASE_DESCRIPTIONS[G.phase]}
              </div>
            </div>
          </div>

          {/* 3-Phase Breakdown */}
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold", marginBottom: "8px" }}>
              {t("phase.breakdown")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(["PRIMERA", "SEGUNDA", "TERCERA"] as HandPhase[]).map((ph, i) => {
                const trick = G.tricks[i];
                const isCurrent = G.phase === ph;
                return (
                  <div
                    key={ph}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: isCurrent ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.03)",
                      border: isCurrent ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.06)",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: isCurrent ? "#60a5fa" : "#cbd5e1" }}>
                      {i + 1}. {ph}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                      {!trick
                        ? isCurrent
                          ? t("phase.in_progress")
                          : t("phase.pending")
                        : trick.winnerID === null
                        ? t("phase.tied")
                        : `🏆 Winner: Player ${trick.winnerID}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Deck Info */}
          <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>{t("stake.active_deck")}</div>
            <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f59e0b", marginTop: "2px" }}>
              🎴 {activeDeckTheme.name}
            </div>
          </div>
        </aside>

        {/* Center Arena Table Zone with Dynamic Custom Mat Background */}
        <main
          onDragOver={(e) => {
            if (canPlayCards) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setIsDragOver(true);
            }
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            setIsDragging(false);
            const cardId = e.dataTransfer.getData("text/plain");
            if (cardId && canPlayCards) {
              moves.playCard(cardId);
            }
          }}
          style={{
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            border: isDragOver
              ? "2px dashed #f59e0b"
              : isDragging
              ? "2px dashed #60a5fa"
              : "2px solid rgba(245, 158, 11, 0.3)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "560px",
            transition: "border 0.2s ease",
          }}
        >
          {/* Custom Mat Background Texture Layer with Smooth Dynamic Transition */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: activeMatUrl.startsWith("http") || activeMatUrl.startsWith("data:")
                ? `url("${activeMatUrl}") center/cover`
                : activeMatUrl,
              opacity: activeMatOpacity,
              transition: "background 0.5s ease-in-out, opacity 0.5s ease-in-out",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Active Battleground Mat Badge */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "16px",
              zIndex: 2,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(6px)",
              padding: "4px 10px",
              borderRadius: "10px",
              fontSize: "0.75rem",
              color: "#f59e0b",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              pointerEvents: "none",
            }}
          >
            {t("table.arena", { name: activeMatOwnerName })}
          </div>


          {/* Table Content Wrapper */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            {/* Dynamic Point Stake Meter Graphic */}
            <PointStakeMeter G={G} />

            {/* Drag Overlay Helper */}
            {isDragging && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: "20px",
                  background: "rgba(37, 99, 235, 0.2)",
                  backdropFilter: "blur(2px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    background: "#1e293b",
                    color: "#f59e0b",
                    padding: "12px 24px",
                    borderRadius: "16px",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    border: "2px solid #f59e0b",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  }}
                >
                  {t("table.drop_here")}
                </div>
              </div>
            )}

            {/* Active Turn Status Banner */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              {isGameOver ? (
                <div
                  style={{
                    background: "#166534",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "#fef08a",
                  }}
                >
                  🏆 Winner: Team {ctx.gameover.winner}!
                </div>
              ) : envidoPending ? (
                <div
                  style={{
                    background: "#854d0e",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    animation: "pulse 2s infinite",
                  }}
                >
                  📢 Envido Called! Pending response from Player {G.currentEnvidoCall?.pendingResponderID}
                </div>
              ) : trucoPending ? (
                <div
                  style={{
                    background: "#991b1b",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    animation: "pulse 2s infinite",
                  }}
                >
                  🔥 {G.currentTrucoCall?.type.toUpperCase()} Called! Pending response from Player {G.currentTrucoCall?.pendingResponderID}
                </div>
              ) : isMyTurn ? (
                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(37, 99, 235, 0.85)",
                    padding: "6px 16px",
                    borderRadius: "20px",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    border: "1px solid #60a5fa",
                    color: "#ffffff",
                  }}
                >
                  {t("table.your_turn", { id: myID })}
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(15, 23, 42, 0.7)",
                    padding: "6px 16px",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    color: "#94a3b8",
                  }}
                >
                  {t("table.waiting", { id: ctx.currentPlayer })}
                </div>
              )}
            </div>

            {/* Cards Played Table Zone (2-Player vs 4-Player 2v2) */}
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              {G.numPlayers === 4 ? (
                /* 4-Player 2v2 Table Grid */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                  {/* Top: Partner (Player 2) */}
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "8px 16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", width: "100%", maxWidth: "420px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: "bold", marginBottom: "4px" }}>
                      🤝 Partner (Player 2 - Team 0) Cards Played:
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", minHeight: "80px" }}>
                      {(G.tableCards["2"] || []).map((card, i) => (
                        <RenderCard key={`p2-${card.id}-${i}`} card={card} cardFaces={activeDeckTheme?.cardFaces} />
                      ))}
                    </div>
                  </div>

                  {/* Middle: Opponent 1 (Player 1) & Opponent 2 (Player 3) Side-by-Side */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%", maxWidth: "520px" }}>
                    <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ fontSize: "0.75rem", color: "#f472b6", fontWeight: "bold", marginBottom: "4px" }}>
                        ⚔️ Opponent (P1)
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px", minHeight: "80px" }}>
                        {(G.tableCards["1"] || []).map((card, i) => (
                          <RenderCard key={`p1-${card.id}-${i}`} card={card} cardFaces={activeDeckTheme?.cardFaces} />
                        ))}
                      </div>
                    </div>

                    <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ fontSize: "0.75rem", color: "#f472b6", fontWeight: "bold", marginBottom: "4px" }}>
                        ⚔️ Opponent (P3)
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px", minHeight: "80px" }}>
                        {(G.tableCards["3"] || []).map((card, i) => (
                          <RenderCard key={`p3-${card.id}-${i}`} card={card} cardFaces={activeDeckTheme?.cardFaces} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Your Played Cards (Player 0) */}
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "8px 16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", width: "100%", maxWidth: "420px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: "bold", marginBottom: "4px" }}>
                      🎴 Cards Played by You (Player 0):
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", minHeight: "80px" }}>
                      {(G.tableCards["0"] || []).map((card, i) => (
                        <RenderCard key={`p0-${card.id}-${i}`} card={card} cardFaces={activeDeckTheme?.cardFaces} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* 2-Player 1v1 Table */
                <>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                    <VideoAvatar
                      stream={null}
                      username={`Player ${opponentID}`}
                      size={52}
                      isCurrentTurn={ctx.currentPlayer === opponentID}
                    />
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "8px", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {t("table.opponent_cards", { id: opponentID })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "12px", minHeight: "100px", marginBottom: "16px" }}>
                    {opponentCardsPlayed.map((card, i) => (
                      <RenderCard key={`opp-played-${card.id}-${i}`} card={card} cardFaces={activeDeckTheme?.cardFaces} />
                    ))}
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "8px", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {t("table.your_cards")}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "12px", minHeight: "100px" }}>
                    {myCardsPlayed.map((card, i) => (
                      <RenderCard key={`my-played-${card.id}-${i}`} card={card} cardFaces={activeDeckTheme?.cardFaces} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Action Control Panel & My Video Avatar */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <VideoAvatar
                  stream={myVideoStream}
                  username={profile?.username || `Player ${myID}`}
                  avatarUrl={profile?.avatar_url}
                  size={56}
                  isCurrentTurn={isMyTurn}
                />
              </div>

              {/* Call Response Banner (if pending for user) */}
              {isEnvidoResponder && (
                <div style={{ marginBottom: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.9rem", color: "#fef08a", marginBottom: "8px" }}>
                    Envido called in PRIMERA! Choose your response:
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button style={btnStyle("#22c55e")} onClick={() => moves.respondEnvido({ accept: true })}>
                      {t("call.quiero")}
                    </button>
                    <button style={btnStyle("#ef4444")} onClick={() => moves.respondEnvido({ accept: false })}>
                      {t("call.no_quiero")}
                    </button>

                    {validEnvidoRaises.map((raise) => (
                      <button
                        key={raise}
                        style={btnStyle("#d97706")}
                        onClick={() => moves.respondEnvido({ accept: true, raiseType: raise })}
                      >
                        {raise === "envido" ? t("call.plus_envido") : raise === "real-envido" ? t("call.plus_real_envido") : t("call.plus_falta_envido")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTrucoResponder && (
                <div style={{ marginBottom: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.9rem", color: "#fef08a", marginBottom: "8px" }}>
                    {G.currentTrucoCall?.type.toUpperCase()} called! Respond:
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button style={btnStyle("#22c55e")} onClick={() => moves.respondTruco(true)}>
                      {t("call.quiero")}
                    </button>
                    <button style={btnStyle("#ef4444")} onClick={() => moves.respondTruco(false)}>
                      {t("call.no_quiero")}
                    </button>

                    {G.currentTrucoCall?.type === "truco" && (
                      <button style={btnStyle("#d97706")} onClick={() => moves.callTruco("retruco")}>
                        {t("call.retruco")}
                      </button>
                    )}
                    {G.currentTrucoCall?.type === "retruco" && (
                      <button style={btnStyle("#dc2626")} onClick={() => moves.callTruco("vale4")}>
                        {t("call.vale4")}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Standard Calls (when on turn) */}
              {!envidoPending && !trucoPending && (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "16px", flexWrap: "wrap" }}>
                  {G.phase === "PRIMERA" && !G.envidoResolved && (
                    <>
                      <button
                        disabled={!isMyTurn}
                        style={btnStyle("#2563eb", !isMyTurn)}
                        onClick={() => moves.callEnvido("envido")}
                      >
                        {t("call.envido")}
                      </button>
                      <button
                        disabled={!isMyTurn}
                        style={btnStyle("#d97706", !isMyTurn)}
                        onClick={() => moves.callEnvido("real-envido")}
                      >
                        {t("call.real_envido")}
                      </button>
                      <button
                        disabled={!isMyTurn}
                        style={btnStyle("#7c3aed", !isMyTurn)}
                        onClick={() => moves.callEnvido("falta-envido")}
                      >
                        {t("call.falta_envido")}
                      </button>
                    </>
                  )}

                  {nextTrucoCall && (
                    <button
                      disabled={!isMyTurn}
                      style={btnStyle("#dc2626", !isMyTurn)}
                      onClick={() => moves.callTruco(nextTrucoCall)}
                    >
                      {nextTrucoCall === "truco"
                        ? t("call.truco")
                        : nextTrucoCall === "retruco"
                        ? t("call.retruco")
                        : t("call.vale4")}
                    </button>
                  )}

                  <button style={btnStyle("#475569")} onClick={() => moves.irseAlMazo()}>
                    {t("call.mazo")}
                  </button>
                </div>
              )}

              {/* My Cards Hand (HTML5 Draggable) */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "8px" }}>
                  {t("table.your_hand", { score: myEnvidoScore })}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                  {myHand.map((card) => (
                    <div
                      key={card.id}
                      draggable={canPlayCards}
                      onDragStart={(e) => {
                        if (!canPlayCards) return;
                        e.dataTransfer.setData("text/plain", card.id);
                        e.dataTransfer.effectAllowed = "move";
                        setIsDragging(true);
                      }}
                      onDragEnd={() => setIsDragging(false)}
                      onClick={() => canPlayCards && moves.playCard(card.id)}
                      style={{
                        cursor: canPlayCards ? "grab" : "not-allowed",
                        transition: "transform 0.15s ease",
                        opacity: canPlayCards ? 1 : 0.7,
                      }}
                      onMouseEnter={(e) => {
                        if (canPlayCards) {
                          e.currentTarget.style.transform = "translateY(-8px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <RenderCard card={card} isPlayable={canPlayCards} cardFaces={activeDeckTheme?.cardFaces} />
                    </div>
                  ))}
                  {myHand.length === 0 && (
                    <div style={{ color: "#64748b", fontStyle: "italic" }}>No cards in hand</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: In-Game Chat & WebRTC Voice/Video Panel */}
        <SocialPanel
          myID={myID}
          matchID={ctx.matchID || "demo-match"}
          logs={G.logs}
          onVideoStreamChange={(stream) => setMyVideoStream(stream)}
        />
      </div>
    </div>
  );
}

function RenderCard({
  card,
  isPlayable = false,
  cardFaces,
}: {
  card: Card;
  isPlayable?: boolean;
  cardFaces?: Record<string, string>;
}) {
  const customFaceUrl = cardFaces?.[card.id];

  if (customFaceUrl) {
    return (
      <div
        style={{
          width: "70px",
          height: "105px",
          borderRadius: "10px",
          border: isPlayable ? "2px solid #3b82f6" : "1px solid #cbd5e1",
          boxShadow: isPlayable ? "0 4px 12px rgba(59, 130, 246, 0.4)" : "0 4px 8px rgba(0,0,0,0.3)",
          overflow: "hidden",
          boxSizing: "border-box",
          userSelect: "none",
          background: "#000",
        }}
      >
        <img
          src={customFaceUrl}
          alt={`${card.rank} de ${card.suit}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  const icon = SUIT_ICONS[card.suit] || "🃏";
  const color = SUIT_COLORS[card.suit] || "#000";

  return (
    <div
      style={{
        width: "70px",
        height: "105px",
        background: "#ffffff",
        borderRadius: "10px",
        border: isPlayable ? "2px solid #3b82f6" : "1px solid #cbd5e1",
        boxShadow: isPlayable ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "0 4px 8px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "6px",
        boxSizing: "border-box",
        userSelect: "none",
        color,
      }}
    >
      <div style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "left" }}>
        {card.rank}
      </div>
      <div style={{ fontSize: "1.6rem", textAlign: "center" }}>{icon}</div>
      <div style={{ fontSize: "0.7rem", textTransform: "capitalize", textAlign: "right", fontWeight: 600 }}>
        {card.suit}
      </div>
    </div>
  );
}

function btnStyle(bg: string, disabled: boolean = false): React.CSSProperties {
  return {
    background: disabled ? "rgba(100, 116, 139, 0.3)" : bg,
    color: disabled ? "#94a3b8" : "#ffffff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "0.85rem",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 2px 6px rgba(0,0,0,0.2)",
    transition: "all 0.15s ease",
  };
}
