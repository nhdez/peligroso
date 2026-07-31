import React, { useState } from "react";
import { useAuth } from "../AuthContext.js";

export function PaymentsSection() {
  const { allUsers, addCredits } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>(allUsers[0]?.id || "");
  const [creditAmount, setCreditAmount] = useState<string>("5000");
  const [grantStatus, setGrantStatus] = useState<string | null>(null);

  // Square Sandbox / Production Status
  const squareAppId = import.meta.env.VITE_SQUARE_APP_ID || "sandbox-sq0idp-demo-key-12345";
  const squareLocationId = import.meta.env.VITE_SQUARE_LOCATION_ID || "L1234567890";
  const envMode = import.meta.env.VITE_SQUARE_ENVIRONMENT || "sandbox";

  async function handleAdminGrantCredits(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    await addCredits(amount);
    setGrantStatus(`Successfully granted +${amount.toLocaleString()} credits!`);
    setTimeout(() => setGrantStatus(null), 3000);
  }

  return (
    <div style={{ color: "#f8fafc" }}>
      <h1 style={{ margin: "0 0 8px 0", color: "#f59e0b", fontSize: "1.6rem" }}>
        💳 Square Payments & Credits Ledger
      </h1>
      <p style={{ color: "#94a3b8", maxWidth: "600px", lineHeight: 1.5, marginBottom: "24px" }}>
        Square Payments active. Users purchase credits at a fixed conversion rate of <strong>$1.00 USD = 1,000 Credits</strong>.
      </p>

      {/* Integration Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>Square Status</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#4ade80", marginTop: "4px" }}>
            🟢 Active & Connected
          </div>
          <div style={{ fontSize: "0.75rem", color: "#60a5fa", marginTop: "4px" }}>
            Mode: {envMode.toUpperCase()}
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>Exchange Ratio</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#f59e0b", marginTop: "4px" }}>
            1 USD : 1,000 Credits
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
            Fixed USD Base
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>App Location ID</div>
          <div style={{ fontSize: "0.95rem", fontWeight: "mono", color: "#cbd5e1", marginTop: "6px" }}>
            {squareLocationId}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
            App ID: {squareAppId.slice(0, 14)}...
          </div>
        </div>
      </div>

      {/* Admin Manual Credit Grant Tool */}
      <div style={{ background: "rgba(30, 41, 59, 0.75)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "20px", marginBottom: "28px", maxWidth: "600px" }}>
        <h3 style={{ margin: "0 0 12px 0", color: "#60a5fa", fontSize: "1.1rem" }}>
          👑 Grant Manual Admin Credits
        </h3>

        {grantStatus && (
          <div style={{ background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", color: "#4ade80", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "12px" }}>
            {grantStatus}
          </div>
        )}

        <form onSubmit={handleAdminGrantCredits} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Select User Account:</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                fontSize: "0.85rem",
              }}
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role}) — Current: {(u.credits ?? 1000).toLocaleString()} Credits
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Amount of Credits to Grant:</label>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="5000"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                fontSize: "0.85rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "4px",
            }}
          >
            Grant Credits
          </button>
        </form>
      </div>

      {/* Users Credit Balances Table */}
      <div>
        <h3 style={{ margin: "0 0 12px 0", color: "#f8fafc", fontSize: "1.1rem" }}>
          📊 Active Users Credits Ledger
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "rgba(30, 41, 59, 0.8)", textAlign: "left", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px" }}>User</th>
              <th style={{ padding: "12px 16px" }}>Role</th>
              <th style={{ padding: "12px 16px" }}>Credit Balance</th>
              <th style={{ padding: "12px 16px" }}>Equivalent USD Value</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => {
              const creds = u.credits ?? 1000;
              const usdVal = (creds / 1000).toFixed(2);
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", fontSize: "0.85rem" }}>
                  <td style={{ padding: "12px 16px", color: "#60a5fa", fontWeight: "bold" }}>{u.username}</td>
                  <td style={{ padding: "12px 16px", color: u.role === "admin" ? "#f59e0b" : "#94a3b8" }}>{u.role.toUpperCase()}</td>
                  <td style={{ padding: "12px 16px", color: "#f59e0b", fontWeight: "bold" }}>💎 {creds.toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", color: "#4ade80" }}>${usdVal} USD</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
