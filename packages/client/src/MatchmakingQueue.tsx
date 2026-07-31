import React, { useState, useEffect } from "react";
import { useAuth, getCountryFlag } from "./AuthContext.js";
import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

interface MatchmakingQueueProps {
  onMatchFound: (matchID: string, assignedPlayerID: string, opponentName: string) => void;
  onCancel: () => void;
  onSwitchToAI: () => void;
}

export function MatchmakingQueue({ onMatchFound, onCancel, onSwitchToAI }: MatchmakingQueueProps) {
  const { profile } = useAuth();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Entering 1v1 Ranked Matchmaking Pool...");
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let channel: any = null;

    async function initQueue() {
      const myId = profile?.id || `guest-${Math.random().toString(36).substring(2, 7)}`;
      const myName = profile?.username || "Guest Player";

      if (isSupabaseConfigured && supabase) {
        try {
          // 1. Check if there is an existing waiting room from another player
          const { data: existingRooms, error } = await supabase
            .from("matchmaking_queue")
            .select("*")
            .eq("status", "waiting")
            .neq("player1_id", myId)
            .order("created_at", { ascending: true })
            .limit(1);

          if (existingRooms && existingRooms.length > 0 && !error) {
            const openRoom = existingRooms[0];
            setStatusMessage(`Opponent found! Connecting to ${openRoom.player1_name}...`);

            // Pair with this open room
            await supabase
              .from("matchmaking_queue")
              .update({
                status: "paired",
                player2_id: myId,
                player2_name: myName,
              })
              .eq("room_id", openRoom.room_id);

            setTimeout(() => {
              onMatchFound(openRoom.room_id, "1", openRoom.player1_name);
            }, 1000);
            return;
          }

          // 2. If no open room, create a new room and wait as Player 1
          const newRoomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          setCreatedRoomId(newRoomId);
          setStatusMessage("Waiting for an opponent to join...");

          await supabase.from("matchmaking_queue").insert([
            {
              room_id: newRoomId,
              player1_id: myId,
              player1_name: myName,
              status: "waiting",
            },
          ]);

          // Listen for Player 2 joining this room
          channel = supabase
            .channel(`matchmaking_${newRoomId}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "matchmaking_queue",
                filter: `room_id=eq.${newRoomId}`,
              },
              (payload) => {
                const updated = payload.new as any;
                if (updated.status === "paired") {
                  setStatusMessage(`Opponent found! Match starting against ${updated.player2_name || "Player 2"}...`);
                  setTimeout(() => {
                    onMatchFound(newRoomId, "0", updated.player2_name || "Player 2");
                  }, 1000);
                }
              }
            )
            .subscribe();
        } catch (err) {
          console.error("Matchmaking error:", err);
          setStatusMessage("Matchmaking server delay. Searching...");
        }
      } else {
        // Fallback for local guest testing mode without live Supabase credentials
        setStatusMessage("Searching local player pool...");
      }
    }

    initQueue();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  async function handleCancel() {
    if (createdRoomId && isSupabaseConfigured && supabase) {
      await supabase
        .from("matchmaking_queue")
        .update({ status: "cancelled" })
        .eq("room_id", createdRoomId);
    }
    onCancel();
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2200,
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "rgba(30, 41, 59, 0.9)",
          border: "2px solid #f59e0b",
          borderRadius: "28px",
          padding: "36px 28px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
          textAlign: "center",
          color: "#ffffff",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Radar Scanner Animation */}
        <div style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto 24px auto" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "50%",
              border: "2px solid #f59e0b",
              opacity: 0.3,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "15px",
              left: "15px",
              right: "15px",
              bottom: "15px",
              borderRadius: "50%",
              border: "2px dashed #f59e0b",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              fontSize: "1.4rem",
              lineHeight: "100px",
              fontWeight: "bold",
              color: "#f59e0b",
              letterSpacing: "2px",
            }}
          >
            1v1
          </div>
        </div>

        <h2 style={{ margin: "0 0 8px 0", color: "#f59e0b", fontSize: "1.4rem", fontWeight: "bold" }}>
          1v1 Ranked Matchmaking
        </h2>

        <div style={{ fontSize: "0.95rem", color: "#e2e8f0", marginBottom: "16px" }}>
          {statusMessage}
        </div>

        {/* Queue Elapsed Timer */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "14px",
            padding: "12px",
            marginBottom: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold", marginBottom: "4px" }}>
            Search Time Elapsed
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#60a5fa", fontFamily: "monospace" }}>
            {formatTimer(elapsedSeconds)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "4px" }}>
            {getCountryFlag(profile?.country_code, profile?.is_guest)} {profile?.username || "Player"} in Match Pool
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={onSwitchToAI}
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Play vs AI Bot Immediately
          </button>

          <button
            onClick={handleCancel}
            style={{
              padding: "10px",
              background: "rgba(239, 68, 68, 0.2)",
              color: "#fca5a5",
              border: "1px solid #ef4444",
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Cancel Search & Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
