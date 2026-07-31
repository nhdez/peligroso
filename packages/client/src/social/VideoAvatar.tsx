import React, { useEffect, useRef } from "react";

export interface VideoAvatarProps {
  stream: MediaStream | null;
  username: string;
  avatarUrl?: string;
  size?: number;
  isCurrentTurn?: boolean;
}

export function VideoAvatar({
  stream,
  username,
  avatarUrl,
  size = 56,
  isCurrentTurn = false,
}: VideoAvatarProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isLive = Boolean(stream);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        position: "relative",
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          overflow: "hidden",
          border: isLive
            ? "2px solid #22c55e"
            : isCurrentTurn
            ? "2px solid #f59e0b"
            : "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: isLive
            ? "0 0 14px rgba(34, 197, 94, 0.6)"
            : isCurrentTurn
            ? "0 0 14px rgba(245, 158, 11, 0.4)"
            : "none",
          position: "relative",
          background: "#0f172a",
          flexShrink: 0,
        }}
      >
        {isLive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)", // Mirror mode for webcam
            }}
          />
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${size * 0.4}px`,
              fontWeight: "bold",
              color: "#f59e0b",
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Live Video Indicator Badge */}
        {isLive && (
          <span
            style={{
              position: "absolute",
              bottom: "2px",
              right: "2px",
              background: "#22c55e",
              color: "#ffffff",
              fontSize: "0.55rem",
              fontWeight: "bold",
              padding: "1px 4px",
              borderRadius: "4px",
              textTransform: "uppercase",
              boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            LIVE
          </span>
        )}
      </div>

      {/* Username Display */}
      <div>
        <div style={{ fontWeight: "bold", fontSize: "0.85rem", color: isCurrentTurn ? "#f59e0b" : "#f1f5f9" }}>
          {username}
        </div>
        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
          {isLive ? "📷 Live Stream" : "👤 Avatar"}
        </div>
      </div>
    </div>
  );
}
