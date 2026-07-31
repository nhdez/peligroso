const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

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
    let pollInterval: any = null;
    let channel: any = null;
    let isMatched = false;

    async function initQueue() {
      const myId = profile?.id || `guest-${Math.random().toString(36).substring(2, 7)}`;
      const myName = profile?.username || "Guest Player";

      // 1. Try Server Matchmaking Queue API First
      try {
        const res = await fetch(`${SERVER_URL}/api/matchmaking/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: myId, userName: myName }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "paired" && data.roomId) {
            isMatched = true;
            setStatusMessage(`Opponent found! Connecting to ${data.opponentName || "Player 1"}...`);
            setTimeout(() => {
              onMatchFound(data.roomId, data.assignedPlayerId, data.opponentName || "Player 1");
            }, 800);
            return;
          } else if (data.status === "waiting" && data.roomId) {
            setCreatedRoomId(data.roomId);
            setStatusMessage("Waiting for an opponent to join...");

            // Poll server for paired status every 1.5 seconds
            pollInterval = setInterval(async () => {
              if (isMatched) return;
              try {
                const checkRes = await fetch(`${SERVER_URL}/api/matchmaking/status/${data.roomId}`);
                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  if (checkData.status === "paired" && !isMatched) {
                    isMatched = true;
                    clearInterval(pollInterval);
                    setStatusMessage(`Opponent found! Match starting against ${checkData.player2Name || "Player 2"}...`);
                    setTimeout(() => {
                      onMatchFound(data.roomId, "0", checkData.player2Name || "Player 2");
                    }, 800);
                  }
                }
              } catch (e) {
                console.error("Queue poll error:", e);
              }
            }, 1500);
          }
        }
      } catch (serverErr) {
        console.warn("Server matchmaking fallback to Supabase:", serverErr);
      }

      // 2. Supabase Dual Sync Backup
      if (isSupabaseConfigured && supabase && !isMatched) {
        try {
          const { data: existingRooms, error } = await supabase
            .from("matchmaking_queue")
            .select("*")
            .eq("status", "waiting")
            .neq("player1_id", myId)
            .order("created_at", { ascending: true })
            .limit(1);

          if (existingRooms && existingRooms.length > 0 && !error && !isMatched) {
            const openRoom = existingRooms[0];
            isMatched = true;
            setStatusMessage(`Opponent found! Connecting to ${openRoom.player1_name}...`);

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
            }, 800);
            return;
          }

          if (!createdRoomId) {
            const newRoomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            setCreatedRoomId(newRoomId);

            await supabase.from("matchmaking_queue").insert([
              {
                room_id: newRoomId,
                player1_id: myId,
                player1_name: myName,
                status: "waiting",
              },
            ]);

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
                  if (updated.status === "paired" && !isMatched) {
                    isMatched = true;
                    setStatusMessage(`Opponent found! Match starting against ${updated.player2_name || "Player 2"}...`);
                    setTimeout(() => {
                      onMatchFound(newRoomId, "0", updated.player2_name || "Player 2");
                    }, 800);
                  }
                }
              )
              .subscribe();
          }
        } catch (err) {
          console.error("Supabase matchmaking error:", err);
        }
      }
    }

    initQueue();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  async function handleCancel() {
    if (createdRoomId) {
      try {
        await fetch(`${SERVER_URL}/api/matchmaking/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: createdRoomId }),
        });
      } catch {}

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from("matchmaking_queue")
          .update({ status: "cancelled" })
          .eq("room_id", createdRoomId);
      }
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
