import React, { useState, useEffect } from "react";
import { SuerteDeReyesState } from "shared";
import { RenderCard } from "./TrucoBoard.js";

interface SuerteDeReyesModalProps {
  suerteDeReyes: SuerteDeReyesState;
  cardFaces?: Record<string, string>;
  onComplete: () => void;
}

export function SuerteDeReyesModal({
  suerteDeReyes,
  cardFaces,
  onComplete,
}: SuerteDeReyesModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const history = suerteDeReyes.history || [];
  const currentStep = history[stepIndex];
  const winnerID = suerteDeReyes.winnerID;

  useEffect(() => {
    if (history.length === 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < history.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsFinished(true);
          return prev;
        }
      });
    }, 650);

    return () => clearInterval(interval);
  }, [history, onComplete]);

  // Auto-finish delay after King is drawn
  useEffect(() => {
    if (isFinished) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isFinished, onComplete]);

  // Separate cards drawn by player
  const cardsByPlayer: Record<string, any[]> = { "0": [], "1": [] };
  for (let i = 0; i <= stepIndex && i < history.length; i++) {
    const step = history[i];
    if (!cardsByPlayer[step.playerID]) cardsByPlayer[step.playerID] = [];
    cardsByPlayer[step.playerID].push(step);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(2, 6, 23, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      {/* Header Badge */}
      <div
        style={{
          background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
          padding: "8px 24px",
          borderRadius: "20px",
          boxShadow: "0 0 30px rgba(245, 158, 11, 0.5)",
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "1.2rem",
          letterSpacing: "1px",
          marginBottom: "16px",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span>👑</span> Suerte de Reyes <span>👑</span>
      </div>

      <div style={{ color: "#cbd5e1", fontSize: "0.9rem", marginBottom: "24px", textAlign: "center" }}>
        Drawing cards face-up... Whoever gets the first <strong>King (12)</strong> shuffles and deals!
      </div>

      {/* Main Card Dealing Table Stage */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: "800px",
          marginBottom: "32px",
        }}
      >
        {/* Player 0 Column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{ fontWeight: "bold", color: "#60a5fa", fontSize: "0.95rem" }}>
            Player 0
          </div>
          <div style={{ display: "flex", gap: "-12px", minHeight: "150px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {(cardsByPlayer["0"] || []).map((step, idx) => (
              <div
                key={`p0-${idx}`}
                style={{
                  transform: step.isKing ? "scale(1.15)" : "none",
                  boxShadow: step.isKing ? "0 0 25px #f59e0b" : "none",
                  borderRadius: "10px",
                  transition: "all 0.3s ease",
                }}
              >
                <RenderCard card={step.card} cardFaces={cardFaces} width={85} height={128} />
              </div>
            ))}
          </div>
        </div>

        {/* Deck Center Indicator */}
        <div
          style={{
            width: "80px",
            height: "120px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            border: "2px dashed rgba(255, 255, 255, 0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: "0.75rem",
            fontWeight: "bold",
          }}
        >
          <span>🎴</span>
          <span>DECK</span>
        </div>

        {/* Player 1 Column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{ fontWeight: "bold", color: "#f87171", fontSize: "0.95rem" }}>
            Player 1
          </div>
          <div style={{ display: "flex", gap: "-12px", minHeight: "150px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {(cardsByPlayer["1"] || []).map((step, idx) => (
              <div
                key={`p1-${idx}`}
                style={{
                  transform: step.isKing ? "scale(1.15)" : "none",
                  boxShadow: step.isKing ? "0 0 25px #f59e0b" : "none",
                  borderRadius: "10px",
                  transition: "all 0.3s ease",
                }}
              >
                <RenderCard card={step.card} cardFaces={cardFaces} width={85} height={128} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Winner Announcement Banner */}
      {isFinished && currentStep && (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "2px solid #f59e0b",
            borderRadius: "16px",
            padding: "16px 28px",
            textAlign: "center",
            boxShadow: "0 10px 40px rgba(245, 158, 11, 0.4)",
            animation: "pulse 1.5s infinite",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#fde047", marginBottom: "4px" }}>
            👑 ¡SUERTE DE REYES RESOLVED!
          </div>
          <div style={{ fontSize: "0.95rem", color: "#ffffff" }}>
            Player <strong>{winnerID}</strong> drew the <strong>{currentStep.card.rank} de {currentStep.card.suit}</strong>!
          </div>
          <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>
            Player {winnerID} will shuffle and deal Hand #1.
          </div>
        </div>
      )}

      {/* Skip / Start Button */}
      <button
        onClick={onComplete}
        style={{
          padding: "10px 24px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "0.9rem",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
        }}
      >
        {isFinished ? "⚡ Begin Game" : "⏩ Skip Ritual"}
      </button>
    </div>
  );
}
