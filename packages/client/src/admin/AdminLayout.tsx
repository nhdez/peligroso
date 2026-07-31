import React from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.js";

const SECTIONS = [
  { path: "users", label: "👥 Manage Users" },
  { path: "decks", label: "🎴 Card Deck Themes" },
  { path: "i18n", label: "🌐 Translations & i18n" },
  { path: "storage", label: "📦 Object Storage" },
  { path: "payments", label: "💳 Payments" },
];

export function AdminLayout() {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (profile?.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "radial-gradient(circle at top center, #0f172a 0%, #020617 100%)",
        color: "#f8fafc",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      <aside
        style={{
          width: "260px",
          flexShrink: 0,
          background: "rgba(15, 23, 42, 0.9)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#f59e0b",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🛡️ Admin Console
        </h2>

        {SECTIONS.map((s) => (
          <NavLink
            key={s.path}
            to={`/admin/${s.path}`}
            style={({ isActive }) => ({
              padding: "10px 14px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "0.85rem",
              background: isActive ? "#2563eb" : "transparent",
              color: isActive ? "#ffffff" : "#94a3b8",
            })}
          >
            {s.label}
          </NavLink>
        ))}

        <NavLink
          to="/"
          style={{
            marginTop: "auto",
            padding: "10px 14px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "0.85rem",
            color: "#f87171",
          }}
        >
          ⬅️ Back to Game
        </NavLink>
      </aside>

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
