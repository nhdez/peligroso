import React, { useState } from "react";
import { useAuth } from "./AuthContext.js";
import { useI18n } from "./i18n/I18nContext.js";
import { useStorage } from "./storage/StorageContext.js";
import type { StorageProviderType } from "shared";

export function AdminPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { allUsers, decks, createDeckTheme, deleteDeckTheme, toggleUserBan, toggleUserRole } = useAuth();
  const { translations, updateTranslationKey, addTranslationKey, addLanguage, availableLanguages } = useI18n();
  const { storageConfig, saveStorageConfig, uploadAsset } = useStorage();
  const [isUploading, setIsUploading] = useState(false);

  const [tab, setTab] = useState<"users" | "decks" | "i18n" | "storage">("users");

  // New deck form state
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [cardBackUrl, setCardBackUrl] = useState("");
  const [cardFaces, setCardFaces] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // i18n search & form state
  const [i18nSearch, setI18nSearch] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newEs, setNewEs] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newLangCode, setNewLangCode] = useState("");

  // Object Storage form state
  const [storageForm, setStorageForm] = useState(storageConfig);
  const [storageSaveMessage, setStorageSaveMessage] = useState<string | null>(null);

  const SUITS = ["espada", "basto", "oro", "copa"] as const;
  const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const;

  function parseCardIdFromFilename(filename: string): string | null {
    const clean = filename.toLowerCase().replace(/[^a-z0-9]/g, " ");
    for (const suit of ["espada", "basto", "oro", "copa"]) {
      if (clean.includes(suit)) {
        for (const rank of [12, 11, 10, 7, 6, 5, 4, 3, 2, 1]) {
          if (clean.includes(String(rank))) {
            return `${rank}-${suit}`;
          }
        }
      }
    }
    return null;
  }

  async function handleSingleCardFaceUpload(cardId: string, file: File) {
    setUploadProgress(`Uploading ${cardId}...`);
    try {
      const url = await uploadAsset(file, "decks");
      setCardFaces((prev) => ({ ...prev, [cardId]: url }));
    } catch (err: any) {
      alert(`Failed to upload ${cardId}: ${err.message}`);
    } finally {
      setUploadProgress(null);
    }
  }

  async function handleBulkCardFacesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFaces: Record<string, string> = { ...cardFaces };
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cardId = parseCardIdFromFilename(file.name);
      if (cardId) {
        setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}...`);
        try {
          const url = await uploadAsset(file, "decks");
          newFaces[cardId] = url;
          count++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }
    }

    setCardFaces(newFaces);
    setIsUploading(false);
    setUploadProgress(null);
    alert(`Successfully uploaded ${count} card face images!`);
  }

  if (!isOpen) return null;

  function handleCreateDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!deckName.trim()) return;

    createDeckTheme({
      name: deckName,
      description: deckDesc || "Custom 40-Card Spanish Deck",
      cardBackUrl: cardBackUrl || "linear-gradient(135deg, #475569 0%, #0f172a 100%)",
      cardFaces: Object.keys(cardFaces).length > 0 ? cardFaces : undefined,
    });

    setDeckName("");
    setDeckDesc("");
    setCardBackUrl("");
    setCardFaces({});
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadAsset(file, "decks");
      setCardBackUrl(url);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  function handleAddTranslation(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim()) return;
    addTranslationKey(newKey.trim(), newEs.trim(), newEn.trim());
    setNewKey("");
    setNewEs("");
    setNewEn("");
  }

  function handleAddLanguage(e: React.FormEvent) {
    e.preventDefault();
    if (!newLangCode.trim()) return;
    addLanguage(newLangCode.trim());
    setNewLangCode("");
  }

  function handleSaveStorage(e: React.FormEvent) {
    e.preventDefault();
    saveStorageConfig(storageForm);
    setStorageSaveMessage("✅ Object Storage Configuration saved successfully!");
    setTimeout(() => setStorageSaveMessage(null), 3000);
  }

  function loadPreset(provider: StorageProviderType) {
    if (provider === "cloudflare-r2") {
      setStorageForm({
        provider: "cloudflare-r2",
        endpointUrl: "https://<account-id>.r2.cloudflarestorage.com",
        bucketName: "truco-assets",
        publicCdnDomain: "https://pub-r2.truco.app",
        accessKeyId: "r2_access_key_demo",
        secretAccessKey: "r2_secret_key_demo",
        region: "auto",
        isEnabled: true,
      });
    } else if (provider === "aws-s3") {
      setStorageForm({
        provider: "aws-s3",
        endpointUrl: "https://s3.us-east-1.amazonaws.com",
        bucketName: "truco-s3-assets",
        publicCdnDomain: "https://truco-s3-assets.s3.amazonaws.com",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        region: "us-east-1",
        isEnabled: true,
      });
    } else if (provider === "supabase-storage") {
      setStorageForm({
        provider: "supabase-storage",
        endpointUrl: "https://<project-ref>.supabase.co/storage/v1",
        bucketName: "peligroso-storage",
        publicCdnDomain: "",
        accessKeyId: "",
        secretAccessKey: "",
        region: "auto",
        isEnabled: true,
      });
    }
  }

  const filteredUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const allI18nKeys = Array.from(
    new Set([...Object.keys(translations.es || {}), ...Object.keys(translations.en || {})])
  ).filter(
    (k) =>
      k.toLowerCase().includes(i18nSearch.toLowerCase()) ||
      (translations.es?.[k] || "").toLowerCase().includes(i18nSearch.toLowerCase()) ||
      (translations.en?.[k] || "").toLowerCase().includes(i18nSearch.toLowerCase())
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2500,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "940px",
          height: "88vh",
          background: "rgba(30, 41, 59, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
          color: "#f8fafc",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "1.3rem",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h2 style={{ margin: "0 0 16px 0", color: "#f59e0b", display: "flex", alignItems: "center", gap: "10px" }}>
          🛡️ Admin Management Console
        </h2>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button onClick={() => setTab("users")} style={tabStyle(tab === "users")}>
            👥 Manage Users ({allUsers.length})
          </button>
          <button onClick={() => setTab("decks")} style={tabStyle(tab === "decks")}>
            🎴 Card Deck Themes ({decks.length})
          </button>
          <button onClick={() => setTab("i18n")} style={tabStyle(tab === "i18n")}>
            🌐 Translations & i18n
          </button>
          <button onClick={() => setTab("storage")} style={tabStyle(tab === "storage")}>
            📦 Object Storage ({storageConfig.isEnabled ? "Active" : "Local Fallback"})
          </button>
        </div>

        {/* Tab 1: User Management */}
        {tab === "users" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
        )}

        {/* Tab 2: Deck Management */}
        {tab === "decks" && (
          <div style={{ flex: 1, display: "flex", gap: "20px", overflow: "hidden" }}>
            <div
              style={{
                flex: 1,
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <h3 style={{ margin: 0, color: "#f59e0b", fontSize: "1.1rem" }}>
                ➕ Create 40-Card Spanish Deck Theme
              </h3>
              <form onSubmit={handleCreateDeck} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Deck Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyberpunk Gold"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <input
                    type="text"
                    placeholder="Futuristic glowing 40-card deck"
                    value={deckDesc}
                    onChange={(e) => setDeckDesc(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Card Back Image URL or Gradient CSS</label>
                  <input
                    type="text"
                    placeholder="https://... or linear-gradient(...)"
                    value={cardBackUrl}
                    onChange={(e) => setCardBackUrl(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Or Upload Card Back Image</label>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ color: "#94a3b8", fontSize: "0.85rem" }} />
                </div>

                {/* 40-Card Front Face Image Manager */}
                <div style={{ background: "rgba(0, 0, 0, 0.3)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(255,255,255,0.08)", marginTop: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ ...labelStyle, margin: 0, color: "#f59e0b", fontSize: "0.9rem" }}>
                      🃏 Upload 40 Individual Card Face Images ({Object.keys(cardFaces).length}/40 Uploaded)
                    </label>
                  </div>

                  {/* Bulk Upload Button */}
                  <div style={{ background: "rgba(37, 99, 235, 0.15)", border: "1px dashed #3b82f6", borderRadius: "10px", padding: "10px", textAlign: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.8rem", color: "#93c5fd", fontWeight: "bold", marginBottom: "4px" }}>
                      ⚡ Bulk Auto-Upload (Multiple Files)
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleBulkCardFacesUpload}
                      style={{ color: "#94a3b8", fontSize: "0.75rem" }}
                    />
                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                      Tip: Auto-maps filenames like <code>1-espada.png</code>, <code>7_oro.jpg</code>, <code>10copa.png</code>
                    </div>
                  </div>

                  {uploadProgress && (
                    <div style={{ padding: "6px 10px", borderRadius: "6px", background: "#d97706", color: "#fff", fontSize: "0.75rem", fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                      ⏳ {uploadProgress}
                    </div>
                  )}

                  {/* 40-Card Suit Matrix Grid */}
                  <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
                    {SUITS.map((suit) => {
                      const suitIcon = suit === "espada" ? "⚔️" : suit === "basto" ? "🪵" : suit === "oro" ? "🪙" : "🍷";
                      return (
                        <div key={suit} style={{ background: "rgba(15, 23, 42, 0.5)", padding: "8px", borderRadius: "10px" }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#cbd5e1", textTransform: "capitalize", marginBottom: "6px" }}>
                            {suitIcon} {suit}s
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                            {RANKS.map((rank) => {
                              const cardId = `${rank}-${suit}`;
                              const customUrl = cardFaces[cardId];
                              return (
                                <div
                                  key={cardId}
                                  style={{
                                    background: customUrl ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.04)",
                                    border: customUrl ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    padding: "4px",
                                    textAlign: "center",
                                    fontSize: "0.7rem",
                                  }}
                                >
                                  <div style={{ fontWeight: "bold", color: customUrl ? "#4ade80" : "#94a3b8" }}>
                                    {rank} {suitIcon}
                                  </div>
                                  {customUrl ? (
                                    <div style={{ margin: "4px 0" }}>
                                      <img src={customUrl} alt={cardId} style={{ width: "32px", height: "48px", objectFit: "cover", borderRadius: "4px" }} />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = { ...cardFaces };
                                          delete next[cardId];
                                          setCardFaces(next);
                                        }}
                                        style={{ display: "block", width: "100%", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.6rem", cursor: "pointer", marginTop: "2px" }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <label style={{ display: "block", marginTop: "4px", background: "#2563eb", color: "#fff", padding: "2px 4px", borderRadius: "4px", fontSize: "0.6rem", cursor: "pointer" }}>
                                      Upload
                                      <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) handleSingleCardFaceUpload(cardId, f);
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: "8px",
                    padding: "12px",
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Save Deck Theme
                </button>
              </form>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              <h3 style={{ margin: "0 0 4px 0", color: "#e2e8f0", fontSize: "1.05rem" }}>
                Available Decks
              </h3>
              {decks.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "56px",
                      borderRadius: "6px",
                      background: d.cardBackUrl.startsWith("http") || d.cardBackUrl.startsWith("data:")
                        ? `url("${d.cardBackUrl}") center/cover`
                        : d.cardBackUrl,
                      border: "1px solid rgba(255,255,255,0.3)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{d.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{d.description}</div>
                  </div>
                  {d.id.startsWith("deck-") && (
                    <button
                      onClick={() => deleteDeckTheme(d.id)}
                      style={{
                        padding: "4px 8px",
                        background: "#dc2626",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: i18n Translation Management */}
        {tab === "i18n" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <form onSubmit={handleAddLanguage} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="New Lang (e.g. pt)"
                  value={newLangCode}
                  onChange={(e) => setNewLangCode(e.target.value)}
                  style={{ ...inputStyle, width: "140px" }}
                />
                <button type="submit" style={btnStyle("#2563eb")}>+ Add Lang</button>
              </form>

              <form onSubmit={handleAddTranslation} style={{ display: "flex", gap: "8px", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Key (e.g. call.truco)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Spanish (es)"
                  value={newEs}
                  onChange={(e) => setNewEs(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="English (en)"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button type="submit" style={btnStyle("#059669")}>+ Add Key</button>
              </form>
            </div>

            <input
              type="text"
              placeholder="Search translation keys or text..."
              value={i18nSearch}
              onChange={(e) => setI18nSearch(e.target.value)}
              style={inputStyle}
            />

            <div style={{ flex: 1, overflowY: "auto", background: "rgba(15, 23, 42, 0.6)", borderRadius: "16px", padding: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#f59e0b", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Translation Key</th>
                    <th style={{ padding: "8px" }}>🇪🇸 Spanish (es)</th>
                    <th style={{ padding: "8px" }}>🇬🇧 English (en)</th>
                  </tr>
                </thead>
                <tbody>
                  {allI18nKeys.map((k) => (
                    <tr key={k} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px", fontWeight: "bold", color: "#60a5fa", fontFamily: "monospace" }}>
                        {k}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="text"
                          value={translations.es?.[k] || ""}
                          onChange={(e) => updateTranslationKey("es", k, e.target.value)}
                          style={tableInputStyle}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="text"
                          value={translations.en?.[k] || ""}
                          onChange={(e) => updateTranslationKey("en", k, e.target.value)}
                          style={tableInputStyle}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Object Storage Console (Cloudflare R2, AWS S3, Supabase) */}
        {tab === "storage" && (
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Storage Status & Preset Loader Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: "14px",
                padding: "14px 18px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Current Object Storage Status:</div>
                <div style={{ fontSize: "1rem", fontWeight: "bold", color: storageForm.isEnabled ? "#22c55e" : "#f59e0b" }}>
                  {storageForm.isEnabled
                    ? `⚡ Active: ${storageForm.provider.toUpperCase()} (${storageForm.bucketName})`
                    : "🟢 Local Storage Fallback Mode Active"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => loadPreset("cloudflare-r2")} style={btnStyle("#f59e0b")}>
                  ⚡ Load Cloudflare R2 Preset
                </button>
                <button type="button" onClick={() => loadPreset("aws-s3")} style={btnStyle("#2563eb")}>
                  📦 Load AWS S3 Preset
                </button>
                <button type="button" onClick={() => loadPreset("supabase-storage")} style={btnStyle("#059669")}>
                  ⚡ Load Supabase Preset
                </button>
              </div>
            </div>

            {storageSaveMessage && (
              <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", color: "#86efac", fontSize: "0.9rem" }}>
                {storageSaveMessage}
              </div>
            )}

            {/* Storage Config Form */}
            <form onSubmit={handleSaveStorage} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Provider Selection */}
              <div>
                <label style={labelStyle}>Storage Provider</label>
                <select
                  value={storageForm.provider}
                  onChange={(e) => setStorageForm({ ...storageForm, provider: e.target.value as StorageProviderType })}
                  style={inputStyle}
                >
                  <option value="cloudflare-r2">⚡ Cloudflare R2 (Recommended)</option>
                  <option value="aws-s3">📦 Amazon Web Services (AWS S3)</option>
                  <option value="supabase-storage">⚡ Supabase Storage</option>
                  <option value="custom-s3">🛠️ Custom S3 / MinIO Endpoint</option>
                </select>
              </div>

              {/* Status Toggle */}
              <div>
                <label style={labelStyle}>Enable Cloud Object Storage</label>
                <button
                  type="button"
                  onClick={() => setStorageForm({ ...storageForm, isEnabled: !storageForm.isEnabled })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: storageForm.isEnabled ? "#059669" : "#475569",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {storageForm.isEnabled ? "ENABLED (Cloud CDN Active)" : "DISABLED (Local Fallback Active)"}
                </button>
              </div>

              <div>
                <label style={labelStyle}>S3 Endpoint URL</label>
                <input
                  type="text"
                  placeholder="https://<account-id>.r2.cloudflarestorage.com"
                  value={storageForm.endpointUrl}
                  onChange={(e) => setStorageForm({ ...storageForm, endpointUrl: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Bucket Name</label>
                <input
                  type="text"
                  placeholder="truco-assets"
                  value={storageForm.bucketName}
                  onChange={(e) => setStorageForm({ ...storageForm, bucketName: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Public CDN Domain / Public URL Prefix</label>
                <input
                  type="text"
                  placeholder="https://assets.truco.app"
                  value={storageForm.publicCdnDomain}
                  onChange={(e) => setStorageForm({ ...storageForm, publicCdnDomain: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Region</label>
                <input
                  type="text"
                  placeholder="auto"
                  value={storageForm.region}
                  onChange={(e) => setStorageForm({ ...storageForm, region: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Access Key ID / Client Key</label>
                <input
                  type="text"
                  placeholder="r2_access_key_..."
                  value={storageForm.accessKeyId}
                  onChange={(e) => setStorageForm({ ...storageForm, accessKeyId: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Secret Access Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••"
                  value={storageForm.secretAccessKey}
                  onChange={(e) => setStorageForm({ ...storageForm, secretAccessKey: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "span 2", marginTop: "10px" }}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                  }}
                >
                  💾 Save Object Storage Configuration
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 18px",
    borderRadius: "12px",
    border: "none",
    background: active ? "#2563eb" : "rgba(255,255,255,0.05)",
    color: active ? "#ffffff" : "#94a3b8",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.85rem",
  };
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "0.8rem",
    cursor: "pointer",
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
  padding: "8px 12px",
  borderRadius: "8px",
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  fontSize: "0.85rem",
  boxSizing: "border-box",
};

const tableInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: "6px",
  background: "rgba(15, 23, 42, 0.8)",
  color: "#f8fafc",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  fontSize: "0.8rem",
};
