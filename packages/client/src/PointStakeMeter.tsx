import React from "react";
import {
  TrucoGameState,
  getAcceptedEnvidoPoints,
  getDeclinedEnvidoPoints,
  getAcceptedTrucoPoints,
  getDeclinedTrucoPoints,
} from "shared";
import { useI18n } from "./i18n/I18nContext.js";

const CALL_LABELS: Record<string, { label: string; pts: string }> = {
  envido: { label: "Envido", pts: "+2" },
  "real-envido": { label: "Real Envido", pts: "+3" },
  "falta-envido": { label: "Falta Envido", pts: "Falta" },
  truco: { label: "Truco", pts: "2 Pts" },
  retruco: { label: "Re-Truco", pts: "3 Pts" },
  vale4: { label: "Vale 4", pts: "4 Pts" },
};

export function PointStakeMeter({ G }: { G: TrucoGameState }) {
  const { t } = useI18n();

  const envidoCall = G.currentEnvidoCall;
  const trucoCall = G.currentTrucoCall;

  // Calculate Envido stakes
  let envidoAcceptedPts = 0;
  let envidoDeclinedPts = 0;

  if (envidoCall) {
    envidoAcceptedPts = getAcceptedEnvidoPoints(envidoCall.history, G.scores);
    envidoDeclinedPts = getDeclinedEnvidoPoints(envidoCall.history);
  }

  // Calculate Truco stakes
  let trucoAcceptedPts = 1;
  let trucoDeclinedPts = 1;

  if (trucoCall) {
    trucoAcceptedPts = getAcceptedTrucoPoints(trucoCall.type);
    trucoDeclinedPts = getDeclinedTrucoPoints(trucoCall.type);
  }

  const isCallActive = Boolean(envidoCall || trucoCall);
  const activeAcceptedPts = envidoCall ? envidoAcceptedPts : trucoAcceptedPts;
  const activeDeclinedPts = envidoCall ? envidoDeclinedPts : trucoDeclinedPts;

  // Meter percentage (out of 15 pts max scale)
  const fillPercentage = Math.min(100, Math.max(10, (activeAcceptedPts / 15) * 100));

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "460px",
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
        padding: "10px 16px",
        boxSizing: "border-box",
        margin: "12px auto 8px auto",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header Title & Call History Pills */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {t("stake.title")}
        </div>

        {/* Active Call History Pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {envidoCall?.history.map((call, idx) => {
            const info = CALL_LABELS[call] || { label: call, pts: "" };
            return (
              <span
                key={`envido-${idx}`}
                style={{
                  background: "rgba(245, 158, 11, 0.2)",
                  color: "#fde047",
                  border: "1px solid #f59e0b",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {info.label} ({info.pts})
              </span>
            );
          })}

          {trucoCall && (
            <span
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                color: "#fca5a5",
                border: "1px solid #ef4444",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "0.75rem",
                fontWeight: "bold",
              }}
            >
              {CALL_LABELS[trucoCall.type]?.label || trucoCall.type}
            </span>
          )}

          {!isCallActive && (
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
              {t("stake.base")}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Stakes Counters: Quiero vs No Quiero */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        {/* Accept (Quiero) Stakes */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>🔥</span>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>
              {t("stake.quiero")}
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#f59e0b" }}>
              {activeAcceptedPts} <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "#cbd5e1" }}>PTS</span>
            </div>
          </div>
        </div>

        {/* Decline (No Quiero) Stakes */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", textAlign: "right" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>
              {t("stake.no_quiero")}
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#60a5fa" }}>
              {activeDeclinedPts} <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "#cbd5e1" }}>PTS</span>
            </div>
          </div>
          <span style={{ fontSize: "1.2rem" }}>🛡️</span>
        </div>
      </div>

      {/* Animated Stake Progress Bar */}
      <div
        style={{
          width: "100%",
          height: "8px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${fillPercentage}%`,
            background: envidoCall
              ? "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)"
              : trucoCall
              ? "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)"
              : "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: "4px",
            transition: "width 0.4s ease-out, background 0.4s ease",
            boxShadow: "0 0 10px rgba(245, 158, 11, 0.5)",
          }}
        />
      </div>
    </div>
  );
}
