import React, { useState } from "react";
import { useAuth, getCountryFlag } from "./AuthContext.js";

export function Leaderboard() {
  const { allUsers } = useAuth();
  const [tab, setTab] = useState<"allTime" | "weekly">("allTime");

  // Sort users by ELO or Weekly wins
  const sortedUsers = [...allUsers].sort((a, b) => {
    if (tab === "allTime") {
      return b.elo_rating - a.elo_rating;
    } else {
      return b.matches_won - a.matches_won;
    }
  });

  return (
    <div
      style={{
        background: "rgba(30, 41, 59, 0.75)",
        backdropFilter: "blur(12px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Title & Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, color: "#f59e0b", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          🏆 Leaderboard
        </h3>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setTab("allTime")}
            style={{
              padding: "4px 10px",
              borderRadius: "8px",
              border: "none",
              background: tab === "allTime" ? "#2563eb" : "rgba(255,255,255,0.06)",
              color: tab === "allTime" ? "#ffffff" : "#94a3b8",
              fontWeight: "bold",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            All-Time ELO
          </button>
          <button
            onClick={() => setTab("weekly")}
            style={{
              padding: "4px 10px",
              borderRadius: "8px",
              border: "none",
              background: tab === "weekly" ? "#d97706" : "rgba(255,255,255,0.06)",
              color: tab === "weekly" ? "#ffffff" : "#94a3b8",
              fontWeight: "bold",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            🔥 Weekly
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {sortedUsers.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "20px", fontSize: "0.85rem" }}>
            No player rankings yet.
          </div>
        ) : (
          sortedUsers.map((u, idx) => {
            const winRate =
              u.matches_played > 0
                ? Math.round((u.matches_won / u.matches_played) * 100)
                : 0;
            const rankBadge =
              idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;

            return (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background:
                    idx === 0
                      ? "linear-gradient(90deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.6))"
                      : "rgba(15, 23, 42, 0.5)",
                  border:
                    idx === 0
                      ? "1px solid rgba(245, 158, 11, 0.4)"
                      : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "8px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1rem", fontWeight: "bold", width: "24px" }}>
                    {rankBadge}
                  </span>
                  <span style={{ fontSize: "1.2rem" }} title={u.country_code || "AR"}>
                    {getCountryFlag(u.country_code)}
                  </span>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "0.85rem", color: "#f8fafc" }}>
                      {u.username} {u.role === "admin" && <span style={{ color: "#f59e0b", fontSize: "0.7rem" }}>🛡️</span>}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                      {u.matches_won}W / {u.matches_played}P ({winRate}% Win Rate)
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#60a5fa" }}>
                    {u.elo_rating} <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>ELO</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
