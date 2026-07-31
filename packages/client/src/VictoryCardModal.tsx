import React, { useState, useEffect } from "react";
import { getCountryFlag } from "./AuthContext.js";

interface VictoryCardModalProps {
  winnerName: string;
  winnerAvatar?: string;
  countryCode?: string;
  eloRating?: number;
  victoryImageUrl?: string;
  victoryYoutubeUrl?: string;
  victoryQuote?: string;
  onClose: () => void;
}

function parseYoutubeVideoId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function VictoryCardModal({
  winnerName,
  winnerAvatar,
  countryCode = "AR",
  eloRating = 1200,
  victoryImageUrl,
  victoryYoutubeUrl,
  victoryQuote = "GG WP! ¡El Rey del Truco!",
  onClose,
}: VictoryCardModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const videoId = parseYoutubeVideoId(victoryYoutubeUrl);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(2, 6, 23, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Hidden YouTube Audio/Video Embed (Auto-plays for 10 seconds) */}
      {videoId && secondsLeft > 0 && (
        <iframe
          width="1"
          height="1"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&start=0&controls=0&mute=0&enablejsapi=1`}
          title="Victory Anthem"
          allow="autoplay; encrypted-media"
          style={{ opacity: 0, pointerEvents: "none", position: "absolute" }}
        />
      )}

      {/* CS2 MVP Showcase Card Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
          border: "2px solid #f59e0b",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(245, 158, 11, 0.35), 0 0 30px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            zIndex: 10,
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            fontSize: "0.9rem",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Card Header Banner */}
        <div
          style={{
            background: "linear-gradient(90deg, #d97706 0%, #b45309 50%, #78350f 100%)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.3rem" }}>🏆</span>
            <span style={{ color: "#ffffff", fontWeight: 900, fontSize: "1.05rem", letterSpacing: "1px", textTransform: "uppercase" }}>
              MATCH MVP — VICTORY CARD
            </span>
          </div>

          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#fde047",
            }}
          >
            🎵 10s Anthem Active ({secondsLeft}s)
          </div>
        </div>

        {/* Card Body & Media */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Winner Profile Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #f59e0b",
                boxShadow: "0 0 15px rgba(245, 158, 11, 0.5)",
                background: "#0f172a",
                flexShrink: 0,
              }}
            >
              {winnerAvatar ? (
                <img src={winnerAvatar} alt={winnerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#f59e0b", fontSize: "1.5rem" }}>
                  {winnerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{getCountryFlag(countryCode)}</span>
                <span>{winnerName}</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "2px" }}>
                MATCH WINNER | ELO Rating: <strong style={{ color: "#60a5fa" }}>{eloRating}</strong>
              </div>
            </div>
          </div>

          {/* Victory Showcase Image / Banner */}
          {victoryImageUrl && (
            <div
              style={{
                width: "100%",
                maxHeight: "220px",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                background: "#000000",
              }}
            >
              <img
                src={victoryImageUrl}
                alt="Victory Banner"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* Victory Quote Motto */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              borderLeft: "4px solid #f59e0b",
              borderRadius: "8px",
              padding: "12px 16px",
              fontStyle: "italic",
              color: "#fef08a",
              fontSize: "0.95rem",
              textAlign: "center",
            }}
          >
            "{victoryQuote}"
          </div>
        </div>

        {/* 10-Second Countdown Progress Bar */}
        <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.1)" }}>
          <div
            style={{
              height: "100%",
              width: `${(secondsLeft / 10) * 100}%`,
              background: "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
              transition: "width 1s linear",
            }}
          />
        </div>

        {/* Bottom Action Footer */}
        <div style={{ padding: "14px 20px", background: "rgba(15, 23, 42, 0.9)", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "10px",
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Dismiss Victory Showcase
          </button>
        </div>
      </div>
    </div>
  );
}
