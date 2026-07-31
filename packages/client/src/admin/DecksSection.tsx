import React, { useState } from "react";
import { useAuth } from "../AuthContext.js";
import { useStorage } from "../storage/StorageContext.js";
import { labelStyle, inputStyle } from "./adminStyles.js";

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

export function DecksSection() {
  const { decks, createDeckTheme, updateDeckTheme, deleteDeckTheme } = useAuth();
  const { uploadAsset } = useStorage();

  const [isUploading, setIsUploading] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [cardBackUrl, setCardBackUrl] = useState("");
  const [cardFaces, setCardFaces] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

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

  function handleSaveDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!deckName.trim()) return;

    if (editingDeckId) {
      updateDeckTheme(editingDeckId, {
        name: deckName,
        description: deckDesc || "Custom 40-Card Spanish Deck",
        cardBackUrl: cardBackUrl || "linear-gradient(135deg, #475569 0%, #0f172a 100%)",
        cardFaces: Object.keys(cardFaces).length > 0 ? cardFaces : undefined,
      });
    } else {
      createDeckTheme({
        name: deckName,
        description: deckDesc || "Custom 40-Card Spanish Deck",
        cardBackUrl: cardBackUrl || "linear-gradient(135deg, #475569 0%, #0f172a 100%)",
        cardFaces: Object.keys(cardFaces).length > 0 ? cardFaces : undefined,
      });
    }

    resetDeckForm();
  }

  function handleEditDeck(deck: any) {
    setEditingDeckId(deck.id);
    setDeckName(deck.name);
    setDeckDesc(deck.description);
    setCardBackUrl(deck.cardBackUrl);
    setCardFaces(deck.cardFaces || {});
  }

  function resetDeckForm() {
    setEditingDeckId(null);
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

  return (
    <div>
      <h1 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>
        🎴 Card Deck Themes ({decks.length})
      </h1>

      <div style={{ display: "flex", gap: "20px" }}>
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
          <h3 style={{ margin: 0, color: "#f59e0b", fontSize: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{editingDeckId ? `✏️ Edit Deck Theme (${deckName})` : "➕ Create 40-Card Spanish Deck Theme"}</span>
            {editingDeckId && (
              <button
                type="button"
                onClick={resetDeckForm}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#cbd5e1",
                  border: "none",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                ✕ Cancel Edit
              </button>
            )}
          </h3>
          <form onSubmit={handleSaveDeck} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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

            <div style={{ background: "rgba(0, 0, 0, 0.3)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(255,255,255,0.08)", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ ...labelStyle, margin: 0, color: "#f59e0b", fontSize: "0.9rem" }}>
                  🃏 Upload 40 Individual Card Face Images ({Object.keys(cardFaces).length}/40 Uploaded)
                </label>
              </div>

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

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
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
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {d.description} {d.cardFaces && `(${Object.keys(d.cardFaces).length}/40 Custom Faces)`}
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => handleEditDeck(d)}
                  style={{
                    padding: "4px 10px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit
                </button>

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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
