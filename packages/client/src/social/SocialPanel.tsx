import React, { useState, useEffect, useRef } from "react";
import { GameLogMessage } from "shared";
import { VoiceManager, ParticipantVoiceState } from "./VoiceManager.js";
import { VideoManager } from "./VideoManager.js";
import { useAuth } from "../AuthContext.js";
import { useI18n } from "../i18n/I18nContext.js";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: "player" | "spectator";
  text: string;
  timestamp: string;
}

export function SocialPanel({
  myID,
  logs,
  onVideoStreamChange,
}: {
  myID: string;
  logs: GameLogMessage[];
  onVideoStreamChange?: (stream: MediaStream | null) => void;
}) {
  const { profile } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"chat" | "logs">("chat");

  // Voice & Video State
  const voiceManagerRef = useRef<VoiceManager>(new VoiceManager());
  const videoManagerRef = useRef<VideoManager>(new VideoManager());

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [speakingLevel, setSpeakingLevel] = useState(0);

  const [isVideoActive, setIsVideoActive] = useState(false);

  // Spectators List & Voice Permissions
  const [spectators, setSpectators] = useState<ParticipantVoiceState[]>([
    {
      id: "spec-1",
      name: "Spectator 1 (Guest)",
      role: "spectator",
      isMuted: true,
      isDeafened: false,
      speakingLevel: 0,
      canSpeak: false,
    },
  ]);

  // Chat Messages State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      senderId: "0",
      senderName: "Player 0",
      role: "player",
      text: "¡Buenas! ¡Suerte y que gane el mejor! 🃏",
      timestamp: "12:00",
    },
    {
      id: "m-2",
      senderId: "1",
      senderName: "Player 1 (AI)",
      role: "player",
      text: "¡A ver qué sale! 🔥",
      timestamp: "12:01",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, logs]);

  async function handleToggleMic() {
    const vm = voiceManagerRef.current;
    if (!micActive) {
      const ok = await vm.startMicrophone();
      if (ok) {
        setMicActive(true);
        vm.onLevelUpdate = (lvl) => setSpeakingLevel(lvl);
      }
    } else {
      const muted = vm.toggleMic();
      setIsMicMuted(muted);
    }
  }

  async function handleToggleVideo() {
    const vm = videoManagerRef.current;
    if (!isVideoActive) {
      const stream = await vm.startCamera();
      if (stream) {
        setIsVideoActive(true);
        if (onVideoStreamChange) onVideoStreamChange(stream);
      }
    } else {
      vm.stopCamera();
      setIsVideoActive(false);
      if (onVideoStreamChange) onVideoStreamChange(null);
    }
  }

  function handleToggleDeafen() {
    const vm = voiceManagerRef.current;
    const deaf = vm.toggleDeafen();
    setIsDeafened(deaf);
  }

  function toggleSpectatorSpeak(id: string) {
    setSpectators((prev) =>
      prev.map((s) => (s.id === id ? { ...s, canSpeak: !s.canSpeak } : s))
    );
  }

  function handleSendMessage(e?: React.FormEvent, textOverride?: string) {
    if (e) e.preventDefault();
    const msgText = textOverride || inputText;
    if (!msgText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myID,
      senderName: profile?.username || `Player ${myID}`,
      role: "player",
      text: msgText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    if (!textOverride) setInputText("");
  }

  const QUICK_EMOJIS = ["🃏", "🔥", "👏", "😜", "👑", "💥"];

  return (
    <aside
      style={{
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        height: "560px",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Voice & Video Communication Controls */}
      <div
        style={{
          background: "rgba(30, 41, 59, 0.8)",
          borderRadius: "14px",
          padding: "12px",
          marginBottom: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#f59e0b", marginBottom: "8px", textTransform: "uppercase" }}>
          🎙️ Voice & Video Controls
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
          {/* Mic Toggle Button */}
          <button
            onClick={handleToggleMic}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "8px",
              border: "none",
              background: !micActive
                ? "#475569"
                : isMicMuted
                ? "#dc2626"
                : "#059669",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "0.7rem",
              cursor: "pointer",
            }}
          >
            {!micActive ? "🎙️ Mic" : isMicMuted ? "🔇 Muted" : "🎤 Active"}
          </button>

          {/* Video Avatar Button */}
          <button
            onClick={handleToggleVideo}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "8px",
              border: "none",
              background: isVideoActive ? "#059669" : "#d97706",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "0.7rem",
              cursor: "pointer",
            }}
          >
            {isVideoActive ? "📷 Live Cam" : "📷 Start Cam"}
          </button>

          {/* Deafen Button */}
          <button
            onClick={handleToggleDeafen}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "8px",
              border: "none",
              background: isDeafened ? "#dc2626" : "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "0.7rem",
              cursor: "pointer",
            }}
          >
            {isDeafened ? "🔇 Deaf" : "🔊 Audio On"}
          </button>
        </div>

        {/* Animated Speaking Level Indicator */}
        {micActive && !isMicMuted && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Voice Level:</span>
            <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${speakingLevel}%`,
                  background: "#22c55e",
                  boxShadow: "0 0 8px #22c55e",
                  transition: "width 0.05s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Spectators Voice Permission Controls */}
        <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "4px" }}>
            Spectator Voice Access (Default Muted):
          </div>
          {spectators.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
              <span style={{ color: "#cbd5e1" }}>👥 {s.name}</span>
              <button
                onClick={() => toggleSpectatorSpeak(s.id)}
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  border: "none",
                  background: s.canSpeak ? "#059669" : "#475569",
                  color: "#ffffff",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {s.canSpeak ? "🎙️ Allowed" : "🔇 Muted"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Navigation Tabs (Live Chat vs Game Logs) */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            flex: 1,
            padding: "6px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "chat" ? "#2563eb" : "rgba(255,255,255,0.05)",
            color: activeTab === "chat" ? "#ffffff" : "#94a3b8",
            fontWeight: "bold",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          💬 Live Chat
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          style={{
            flex: 1,
            padding: "6px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "logs" ? "#2563eb" : "rgba(255,255,255,0.05)",
            color: activeTab === "logs" ? "#ffffff" : "#94a3b8",
            fontWeight: "bold",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          📜 Game Logs
        </button>
      </div>

      {/* Tab 1: Live Text Chat */}
      {activeTab === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Chat Feed */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  background: msg.senderId === myID ? "rgba(37, 99, 235, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  border: msg.senderId === myID ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#94a3b8", marginBottom: "2px" }}>
                  <span style={{ fontWeight: "bold", color: msg.role === "player" ? "#60a5fa" : "#f472b6" }}>
                    {msg.senderName} <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>[{msg.role.toUpperCase()}]</span>
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#f1f5f9" }}>{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Emoji Reaction Bar */}
          <div style={{ display: "flex", gap: "4px", margin: "8px 0", justifyContent: "center" }}>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendMessage(undefined, emoji)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "transform 0.1s ease",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "6px" }}>
            <input
              type="text"
              placeholder="Send message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontSize: "0.8rem",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Game History Logs */}
      {activeTab === "logs" && (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                fontSize: "0.8rem",
                padding: "6px 10px",
                background: "rgba(255, 255, 255, 0.04)",
                borderRadius: "8px",
                borderLeft: log.text.includes("won")
                  ? "3px solid #22c55e"
                  : log.text.includes("Phase")
                  ? "3px solid #3b82f6"
                  : log.text.includes("called")
                  ? "3px solid #f59e0b"
                  : "3px solid #64748b",
                color: "#cbd5e1",
              }}
            >
              {log.text}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
