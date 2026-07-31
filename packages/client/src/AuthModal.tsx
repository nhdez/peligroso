import React, { useState } from "react";
import { useAuth, PRESET_MATS, COUNTRY_LIST } from "./AuthContext.js";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn, signUp, signInAsGuest, isConfigured, profile, decks, updateCustomization, updateCountry } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup" | "customization" | "guest">("customization");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Customization state
  const [selectedDeck, setSelectedDeck] = useState(profile?.selected_deck_id || "classic-gold");
  const [matUrl, setMatUrl] = useState(profile?.custom_mat_url || PRESET_MATS[0].url);
  const [matOpacity, setMatOpacity] = useState(profile?.mat_opacity ?? 0.85);
  const [selectedCountry, setSelectedCountry] = useState(profile?.country_code || "AR");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === "signin") {
      const res = await signIn(email, password);
      if (res.error) setError(res.error);
      else onClose();
    } else if (tab === "signup") {
      if (!username.trim()) {
        setError("Username is required");
        setLoading(false);
        return;
      }
      const res = await signUp(email, password, username);
      if (res.error) setError(res.error);
      else onClose();
    } else if (tab === "customization") {
      updateCustomization(selectedDeck, matUrl, matOpacity);
      updateCountry(selectedCountry);
      onClose();
    } else {
      signInAsGuest(username || undefined);
      onClose();
    }
    setLoading(false);
  }

  function handleMatFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMatUrl(`url("${reader.result}") center/cover`);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "rgba(30, 41, 59, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
          color: "#f8fafc",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "1.2rem",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h2 style={{ margin: "0 0 16px 0", color: "#f59e0b", textAlign: "center" }}>
          🔑 Account & Customization
        </h2>

        {/* Tab Selection */}
        <div
          style={{
            display: "flex",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "20px",
          }}
        >
          <button onClick={() => setTab("customization")} style={tabBtnStyle(tab === "customization")}>
            🎨 Profile & Customization
          </button>
          <button onClick={() => setTab("signin")} style={tabBtnStyle(tab === "signin")}>
            Sign In
          </button>
          <button onClick={() => setTab("signup")} style={tabBtnStyle(tab === "signup")}>
            Sign Up
          </button>
          <button onClick={() => setTab("guest")} style={tabBtnStyle(tab === "guest")}>
            Guest
          </button>
        </div>

        {!isConfigured && (tab === "signin" || tab === "signup") && (
          <div
            style={{
              padding: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid #f59e0b",
              borderRadius: "10px",
              fontSize: "0.8rem",
              color: "#fef08a",
              marginBottom: "16px",
            }}
          >
            ⚠️ Supabase environment variables not configured yet. You can use <strong>Guest Mode</strong> locally!
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px",
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid #ef4444",
              borderRadius: "10px",
              fontSize: "0.85rem",
              color: "#fca5a5",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {tab === "customization" && (
            <>
              {/* Select Country */}
              <div>
                <label style={labelStyle}>🌍 Select Country (Flag Badge)</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  style={inputStyle}
                >
                  {COUNTRY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Deck Theme */}
              <div>
                <label style={labelStyle}>🎴 Select Card Deck Theme</label>
                <select
                  value={selectedDeck}
                  onChange={(e) => setSelectedDeck(e.target.value)}
                  style={inputStyle}
                >
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.description})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Battleground Mat */}
              <div>
                <label style={labelStyle}>🏟️ Battleground Mat Texture</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  {PRESET_MATS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMatUrl(m.url)}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: matUrl === m.url ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.15)",
                        background: m.url,
                        color: "#ffffff",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                      }}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Custom Mat Image */}
              <div>
                <label style={labelStyle}>🖼️ Or Upload Custom Arena Mat Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMatFileUpload}
                  style={{ color: "#94a3b8", fontSize: "0.85rem" }}
                />
              </div>

              {/* Mat Opacity Slider */}
              <div>
                <label style={labelStyle}>
                  🌗 Mat Surface Opacity ({Math.round(matOpacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={matOpacity}
                  onChange={(e) => setMatOpacity(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#f59e0b" }}
                />
              </div>
            </>
          )}

          {tab === "signup" && (
            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="TrucoMaster99"
                style={inputStyle}
              />
            </div>
          )}

          {tab === "guest" && (
            <div>
              <label style={labelStyle}>Guest Display Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Guest_Player"
                style={inputStyle}
              />
            </div>
          )}

          {(tab === "signin" || tab === "signup") && (
            <>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@example.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "12px",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Processing..."
              : tab === "customization"
              ? "Save Customizations"
              : tab === "signin"
              ? "Sign In"
              : tab === "signup"
              ? "Create Account"
              : "Continue as Guest"}
          </button>
        </form>
      </div>
    </div>
  );
}

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "8px 4px",
    border: "none",
    borderRadius: "8px",
    background: active ? "#2563eb" : "transparent",
    color: active ? "#ffffff" : "#94a3b8",
    fontWeight: "bold",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "all 0.15s ease",
  };
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  color: "#cbd5e1",
  marginBottom: "4px",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  fontSize: "0.9rem",
  boxSizing: "border-box",
};
