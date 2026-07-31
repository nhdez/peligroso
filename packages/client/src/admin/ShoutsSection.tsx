import React, { useState } from "react";
import { useAuth, CallType, AudioShout } from "../AuthContext.js";
import { useStorage } from "../storage/StorageContext.js";

const CALL_TYPES: { type: CallType; label: string }[] = [
  { type: "envido", label: "Envido (2 Pts)" },
  { type: "real_envido", label: "Real Envido (3 Pts)" },
  { type: "falta_envido", label: "Falta Envido (Game Pts)" },
  { type: "truco", label: "Truco (2 Pts)" },
  { type: "retruco", label: "Re-Truco (3 Pts)" },
  { type: "vale4", label: "Vale 4 (4 Pts)" },
  { type: "quiero", label: "Quiero (Accept)" },
  { type: "no_quiero", label: "No Quiero (Decline)" },
  { type: "mazo", label: "Me Voy al Mazo (Fold)" },
];

export function ShoutsSection() {
  const { shouts, createAudioShout, updateAudioShout, deleteAudioShout, playShoutAudio } = useAuth();
  const { uploadAsset } = useStorage();

  const [selectedCallType, setSelectedCallType] = useState<CallType | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [callType, setCallType] = useState<CallType>("truco");
  const [title, setTitle] = useState("");
  const [mp3Url, setMp3Url] = useState("");
  const [packName, setPackName] = useState("Custom Voice Pack");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const filteredShouts = selectedCallType === "all"
    ? shouts
    : shouts.filter((s) => s.callType === selectedCallType);

  async function handleAudioFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);

    try {
      const url = await uploadAsset(file, "shouts");
      setMp3Url(url);
      setUploadStatus(`Successfully uploaded ${file.name}!`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message || "Error"}`);
    } finally {
      setIsUploading(false);
    }
  }

  function handleSaveShout(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !mp3Url) return;

    if (editingId) {
      updateAudioShout(editingId, { callType, title, mp3Url, packName });
      setEditingId(null);
    } else {
      createAudioShout({ callType, title, mp3Url, packName });
    }

    // Reset Form
    setTitle("");
    setMp3Url("");
    setUploadStatus(null);
  }

  function handleEditShout(shout: AudioShout) {
    setEditingId(shout.id);
    setCallType(shout.callType);
    setTitle(shout.title);
    setMp3Url(shout.mp3Url);
    setPackName(shout.packName || "Custom Voice Pack");
  }

  return (
    <div style={{ color: "#f8fafc" }}>
      <h1 style={{ margin: "0 0 8px 0", color: "#f59e0b", fontSize: "1.6rem" }}>
        📢 Audio Shouts (Gritos) Management
      </h1>
      <p style={{ color: "#94a3b8", maxWidth: "600px", lineHeight: 1.5, marginBottom: "24px" }}>
        Configure custom MP3 audio shouts played during matches when players make game calls (Envido, Truco, Re-Truco, Mazo, etc.).
      </p>

      {/* Add / Edit Form Card */}
      <div
        style={{
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "28px",
          maxWidth: "650px",
        }}
      >
        <h3 style={{ margin: "0 0 14px 0", color: "#60a5fa", fontSize: "1.1rem" }}>
          {editingId ? "Edit Audio Shout MP3" : "Add New Audio Shout MP3"}
        </h3>

        {uploadStatus && (
          <div style={{ background: "rgba(59, 130, 246, 0.2)", border: "1px solid #3b82f6", color: "#60a5fa", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "14px" }}>
            {uploadStatus}
          </div>
        )}

        <form onSubmit={handleSaveShout} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                Game Call Type:
              </label>
              <select
                value={callType}
                onChange={(e) => setCallType(e.target.value as CallType)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#0f172a",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                }}
              >
                {CALL_TYPES.map((c) => (
                  <option key={c.type} value={c.type}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                Voice Pack / Collection Name:
              </label>
              <input
                type="text"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Classic Argentine Gritos"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#0f172a",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              Audio Title / Name:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TRUCO Fuerte Grito #1"
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontSize: "0.85rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              MP3 Audio URL:
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="url"
                value={mp3Url}
                onChange={(e) => setMp3Url(e.target.value)}
                placeholder="https://example.com/audio/truco.mp3"
                required
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#0f172a",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                }}
              />
              <label
                style={{
                  padding: "10px 14px",
                  background: "rgba(59, 130, 246, 0.2)",
                  border: "1px solid #3b82f6",
                  color: "#60a5fa",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                {isUploading ? "Uploading..." : "Upload MP3"}
                <input
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/ogg,audio/wav"
                  onChange={handleAudioFileUpload}
                  style={{ display: "none" }}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Inline Audio Preview */}
          {mp3Url && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(15, 23, 42, 0.6)", padding: "10px", borderRadius: "8px" }}>
              <audio controls src={mp3Url} style={{ flex: 1, height: "36px" }} />
              <button
                type="button"
                onClick={() => playShoutAudio(callType)}
                style={{
                  padding: "6px 12px",
                  background: "#f59e0b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                ▶ Test Play
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setMp3Url("");
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isUploading}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: "bold",
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              {editingId ? "Save Changes" : "Save Audio Shout"}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs & Audio Shouts List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.1rem" }}>
            Configured Audio Shouts ({filteredShouts.length})
          </h3>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedCallType("all")}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "none",
                background: selectedCallType === "all" ? "#2563eb" : "rgba(255,255,255,0.06)",
                color: selectedCallType === "all" ? "#ffffff" : "#94a3b8",
                fontWeight: "bold",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              All Shouts
            </button>
            {CALL_TYPES.map((c) => (
              <button
                key={c.type}
                onClick={() => setSelectedCallType(c.type)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "none",
                  background: selectedCallType === c.type ? "#2563eb" : "rgba(255,255,255,0.06)",
                  color: selectedCallType === c.type ? "#ffffff" : "#94a3b8",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {c.type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Shouts Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "rgba(30, 41, 59, 0.8)", textAlign: "left", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px" }}>Call Type</th>
              <th style={{ padding: "12px 16px" }}>Shout Title</th>
              <th style={{ padding: "12px 16px" }}>Voice Pack</th>
              <th style={{ padding: "12px 16px" }}>Audio Player</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShouts.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", fontSize: "0.85rem" }}>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: "#2563eb", color: "#ffffff", padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase" }}>
                    {s.callType}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#f8fafc", fontWeight: "bold" }}>{s.title}</td>
                <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{s.packName || "Default Pack"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <audio controls src={s.mp3Url} style={{ height: "30px", width: "200px" }} />
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button
                    onClick={() => handleEditShout(s)}
                    style={{
                      padding: "4px 8px",
                      marginRight: "6px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#60a5fa",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAudioShout(s.id)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "rgba(239,68,68,0.2)",
                      border: "1px solid #ef4444",
                      color: "#fca5a5",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
