import React, { useState, useEffect, useRef } from "react";
import { useAuth, getCountryFlag } from "./AuthContext.js";
import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

export interface LobbyMessage {
  id: string;
  senderName: string;
  countryCode: string;
  role: "admin" | "user";
  text: string;
  timestamp: string;
}

export function LobbyChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch messages from Supabase Postgres on mount & subscribe to Realtime updates
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Initial Fetch
      supabase
        .from("lobby_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50)
        .then(({ data, error }) => {
          if (data && data.length > 0 && !error) {
            const formatted: LobbyMessage[] = data.map((row: any) => ({
              id: row.id,
              senderName: row.username,
              countryCode: row.country_code || "AR",
              role: row.role || "user",
              text: row.content,
              timestamp: new Date(row.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }));
            setMessages(formatted);
          }
        });

      // 2. Realtime Channel Subscription
      const channel = supabase
        .channel("lobby_messages_channel")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "lobby_messages" },
          (payload) => {
            const row = payload.new as any;
            const newMsg: LobbyMessage = {
              id: row.id,
              senderName: row.username,
              countryCode: row.country_code || "AR",
              role: row.role || "user",
              text: row.content,
              timestamp: new Date(row.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
            setMessages((prev) => {
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
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(e?: React.FormEvent, textOverride?: string) {
    if (e) e.preventDefault();
    const text = textOverride || inputText;
    if (!text.trim()) return;

    const senderName = profile?.username || "Guest";
    const countryCode = profile?.country_code || "AR";
    const role = profile?.role || "user";
    const content = text.trim();

    const localMsg: LobbyMessage = {
      id: `lmsg-${Date.now()}`,
      senderName,
      countryCode,
      role,
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, localMsg]);
    if (!textOverride) setInputText("");

    // Persist to Supabase Postgres database
    if (isSupabaseConfigured && supabase) {
      await supabase.from("lobby_messages").insert([
        {
          sender_id: profile?.id || null,
          username: senderName,
          country_code: countryCode,
          role: role,
          content: content,
        },
      ]);
    }
  }

  const QUICK_EMOJIS = ["🃏", "🔥", "👏", "😜", "👑", "💥"];

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
      <h3 style={{ margin: "0 0 14px 0", color: "#f59e0b", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
        💬 Global Lobby Chat
      </h3>

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              background: "rgba(15, 23, 42, 0.5)",
              borderRadius: "10px",
              padding: "8px 12px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{getCountryFlag(m.countryCode)}</span>
                <span style={{ fontWeight: "bold", color: "#60a5fa" }}>{m.senderName}</span>
                {m.role === "admin" && (
                  <span style={{ background: "#d97706", color: "#ffffff", fontSize: "0.6rem", padding: "1px 4px", borderRadius: "4px", fontWeight: "bold" }}>
                    ADMIN
                  </span>
                )}
              </div>
              <span>{m.timestamp}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#f1f5f9" }}>{m.text}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Emoji Bar */}
      <div style={{ display: "flex", gap: "6px", margin: "10px 0 6px 0", justifyContent: "center" }}>
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
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "6px" }}>
        <input
          type="text"
          placeholder="Type a lobby message..."
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
            padding: "8px 14px",
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
  );
}
