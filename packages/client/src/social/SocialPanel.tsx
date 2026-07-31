import React, { useState, useEffect, useRef } from "react";
import { GameLogMessage } from "shared";
import { VoiceManager, ParticipantVoiceState } from "./VoiceManager.js";
import { VideoManager } from "./VideoManager.js";
import { useAuth, getCountryFlag } from "../AuthContext.js";
import { useI18n } from "../i18n/I18nContext.js";
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  countryCode: string;
  role: "player" | "spectator";
  text: string;
  timestamp: string;
}

export function SocialPanel({
  myID,
  matchID = "demo-match",
  logs,
  onVideoStreamChange,
  onLeaveMatch,
}: {
  myID: string;
  matchID?: string;
  logs: GameLogMessage[];
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  onLeaveMatch?: () => void;
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const vm = voiceManagerRef.current;
    const vidMgr = videoManagerRef.current;

    // Fetch persisted game chat messages from Supabase Postgres
    if (isSupabaseConfigured && supabase) {
      supabase
        .from("game_chat_messages")
        .select("*")
        .eq("match_id", matchID)
        .order("created_at", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mapped: ChatMessage[] = data.map((msg: any) => ({
              id: msg.id,
              senderId: msg.sender_id,
              senderName: msg.username,
              countryCode: msg.country_code || "AR",
              role: msg.role || "player",
              text: msg.content,
              timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));
            setChatMessages(mapped);
          }
        });
    }

    return () => {
      vm.stop();
      vidMgr.stopCamera();
    };
    // onVideoStreamChange is not used inside this effect (only in handleToggleVideo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchID, myID]);

  useEffect(() => {
    if (isSupabaseConfigured && supabase && matchID) {
      const channel = supabase
        .channel(`game_chat_${matchID}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "game_chat_messages",
            filter: `match_id=eq.${matchID}`,
          },
          (payload) => {
            const row = payload.new as any;
            const newMsg: ChatMessage = {
              id: row.id,
              senderId: row.sender_id || "0",
              senderName: row.username,
              countryCode: row.country_code || "AR",
              role: (row.role as "player" | "spectator") || "player",
              text: row.content,
              timestamp: new Date(row.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [matchID]);

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

  const [muteAllSpectators, setMuteAllSpectators] = useState(true);

  function handleToggleMasterSpectatorMute() {
    const newMuteState = !muteAllSpectators;
    setMuteAllSpectators(newMuteState);
    voiceManagerRef.current.setMuteAllSpectators(newMuteState);
  }

  function toggleSpectatorSpeak(id: string) {
    setSpectators((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updatedCanSpeak = !s.canSpeak;
          voiceManagerRef.current.setSpectatorMuted(id, !updatedCanSpeak);
          return { ...s, canSpeak: updatedCanSpeak };
        }
        return s;
      })
    );
  }

  async function handleSendMessage(e?: React.FormEvent, textOverride?: string) {
    if (e) e.preventDefault();
    const msgText = textOverride || inputText;
    if (!msgText.trim()) return;

    const senderName = profile?.username || `Player ${myID}`;
    const countryCode = profile?.country_code || "AR";
    const content = msgText.trim();

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myID,
      senderName,
      countryCode,
      role: "player",
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    if (!textOverride) setInputText("");

    // Persist in-game message to Supabase Postgres
    if (isSupabaseConfigured && supabase) {
      await supabase.from("game_chat_messages").insert([
        {
          match_id: matchID,
          sender_id: myID,
          username: senderName,
          country_code: countryCode,
          role: "player",
          content: content,
        },
      ]);
    }
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
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Leave Match to Lobby Button */}
      <button
        onClick={() => {
          if (onLeaveMatch) onLeaveMatch();
          else window.location.reload();
        }}
        style={{
          width: "100%",
          padding: "10px 14px",
          marginBottom: "12px",
          background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
          color: "#ffffff",
          border: "none",
          borderRadius: "12px",
          fontWeight: "bold",
          fontSize: "0.85rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
        }}
      >
        <span>🚪</span> Leave Match to Lobby
      </button>

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

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
          {/* Mic Toggle Button */}
          <button
            onClick={handleToggleMic}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              background: !micActive ? "#334155" : isMicMuted ? "#dc2626" : "#059669",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "0.8rem",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {!micActive ? "Microphone: Off" : isMicMuted ? "Microphone: Muted" : "Microphone: Active"}
          </button>

          {/* Video Stream Button */}
          <button
            onClick={handleToggleVideo}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              background: isVideoActive ? "#059669" : "#d97706",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "0.8rem",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {isVideoActive ? "Camera Stream: Active" : "Camera Stream: Off"}
          </button>

          {/* Deafen Button */}
          <button
            onClick={handleToggleDeafen}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              background: isDeafened ? "#dc2626" : "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "0.8rem",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {isDeafened ? "Audio Output: Muted" : "Audio Output: Active"}
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

        {/* Spectator Recognition & Voice Management */}
        <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#f59e0b" }}>
              👥 Spectator Audio Controls
            </span>
            <button
              onClick={handleToggleMasterSpectatorMute}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                border: "none",
                background: muteAllSpectators ? "#dc2626" : "#059669",
                color: "#ffffff",
                fontSize: "0.68rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {muteAllSpectators ? "Mute Spectators: ON" : "Mute Spectators: OFF"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {spectators.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", background: "rgba(0,0,0,0.25)", padding: "4px 8px", borderRadius: "6px" }}>
                <span style={{ color: "#cbd5e1", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>👥</span> {s.name} <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>(Spectator)</span>
                </span>
                <button
                  onClick={() => toggleSpectatorSpeak(s.id)}
                  disabled={muteAllSpectators}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "none",
                    background: muteAllSpectators ? "#475569" : s.canSpeak ? "#059669" : "#dc2626",
                    color: "#ffffff",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    cursor: muteAllSpectators ? "not-allowed" : "pointer",
                    opacity: muteAllSpectators ? 0.6 : 1,
                  }}
                >
                  {muteAllSpectators ? "Muted" : s.canSpeak ? "Audio On" : "Audio Muted"}
                </button>
              </div>
            ))}
          </div>
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
                  <span style={{ fontWeight: "bold", color: msg.role === "player" ? "#60a5fa" : "#f472b6", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>{getCountryFlag(msg.countryCode)}</span>
                    <span>{msg.senderName}</span>
                    <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>[{msg.role.toUpperCase()}]</span>
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
          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px", width: "100%" }}>
            <input
              type="text"
              placeholder="Send message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
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
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "0.8rem",
                cursor: "pointer",
                flexShrink: 0,
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
