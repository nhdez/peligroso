import React, { useState } from "react";
import { useAuth } from "../AuthContext.js";
import { inputStyle } from "./adminStyles.js";

export function UsersSection() {
  const { allUsers, toggleUserBan, toggleUserRole } = useAuth();
  const [searchFilter, setSearchFilter] = useState("");

  const filteredUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h1 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>
        👥 Manage Users ({allUsers.length})
      </h1>

      <input
        type="text"
        placeholder="Search user..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        style={inputStyle}
      />

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "30px" }}>
            No users found.
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(15, 23, 42, 0.6)",
                border: u.is_banned ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "14px 18px",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold", fontSize: "1rem", color: u.is_banned ? "#f87171" : "#f1f5f9" }}>
                  {u.username} {u.role === "admin" && <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>[ADMIN]</span>}
                  {u.is_banned && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}> [BANNED]</span>}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                  ELO: {u.elo_rating} | Wins: {u.matches_won}/{u.matches_played} | Deck: {u.selected_deck_id}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => toggleUserRole(u.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: u.role === "admin" ? "#d97706" : "#475569",
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {u.role === "admin" ? "Demote" : "Make Admin"}
                </button>

                <button
                  onClick={() => toggleUserBan(u.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: u.is_banned ? "#059669" : "#dc2626",
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {u.is_banned ? "Unban" : "Ban User"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
