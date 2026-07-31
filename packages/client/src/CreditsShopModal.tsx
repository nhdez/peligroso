import React, { useState } from "react";
import { useAuth } from "./AuthContext.js";
import { useI18n } from "./i18n/I18nContext.js";

interface CreditPackage {
  id: string;
  name: string;
  usdAmount: number;
  credits: number;
  bonus: number;
  badge?: string;
}

const PRESET_PACKAGES: CreditPackage[] = [
  { id: "pack-1", name: "Starter Pack", usdAmount: 1, credits: 1000, bonus: 0 },
  { id: "pack-5", name: "Pro Pack", usdAmount: 5, credits: 5000, bonus: 0 },
  { id: "pack-10", name: "Popular Pack", usdAmount: 10, credits: 11000, bonus: 1000, badge: "BEST VALUE (+10%)" },
  { id: "pack-25", name: "Whale Pack", usdAmount: 25, credits: 28000, bonus: 3000, badge: "MEGA BONUS (+12%)" },
];

export function CreditsShopModal({ onClose }: { onClose: () => void }) {
  const { profile, addCredits } = useAuth();
  const { t } = useI18n();

  const [selectedPack, setSelectedPack] = useState<CreditPackage | null>(PRESET_PACKAGES[1]);
  const [customUsd, setCustomUsd] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate final credits and USD
  const usdVal = customUsd !== "" ? Math.max(1, parseFloat(customUsd) || 0) : (selectedPack?.usdAmount ?? 5);
  const totalCredits = customUsd !== "" ? Math.floor(usdVal * 1000) : (selectedPack?.credits ?? 5000);

  // Handle Square Checkout process
  async function handleSquareCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (usdVal <= 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Simulate Square Payment processing token delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 1400));

      // Grant credits to user profile
      await addCredits(totalCredits);

      setSuccessMessage(`Success! Purchased ${totalCredits.toLocaleString()} credits for $${usdVal.toFixed(2)} USD via Square.`);
      setCustomUsd("");
    } catch (err: any) {
      setErrorMessage(err?.message || "Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "520px",
          padding: "24px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
          color: "#f8fafc",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>
              COMPETITIVE STORE
            </div>
            <h2 style={{ margin: "2px 0 0 0", fontSize: "1.4rem", color: "#f8fafc", fontWeight: "bold" }}>
              Credits Store
            </h2>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
              Conversion Rate: <strong>$1.00 USD = 1,000 Credits</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#94a3b8",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1.1rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Current Balance Card */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))",
            borderRadius: "14px",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>
              Your Current Balance
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f59e0b", marginTop: "2px" }}>
              {(profile?.credits ?? 1000).toLocaleString()} <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Credits</span>
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#60a5fa", background: "rgba(37, 99, 235, 0.2)", padding: "4px 10px", borderRadius: "8px" }}>
            {profile?.username || "Guest"}
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid #22c55e",
              color: "#4ade80",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid #ef4444",
              color: "#f87171",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Preset Packages Grid */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: "bold", marginBottom: "10px" }}>
            Select a Credit Package:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {PRESET_PACKAGES.map((pack) => {
              const isSelected = customUsd === "" && selectedPack?.id === pack.id;
              return (
                <div
                  key={pack.id}
                  onClick={() => {
                    setSelectedPack(pack);
                    setCustomUsd("");
                  }}
                  style={{
                    background: isSelected ? "rgba(59, 130, 246, 0.25)" : "rgba(255, 255, 255, 0.03)",
                    border: isSelected ? "2px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                  }}
                >
                  {pack.badge && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "8px",
                        background: "#d97706",
                        color: "#ffffff",
                        fontSize: "0.6rem",
                        padding: "1px 6px",
                        borderRadius: "6px",
                        fontWeight: "bold",
                      }}
                    >
                      {pack.badge}
                    </span>
                  )}
                  <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: isSelected ? "#60a5fa" : "#f1f5f9" }}>
                    {pack.name}
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#f59e0b", margin: "4px 0" }}>
                    {pack.credits.toLocaleString()} Credits
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    ${pack.usdAmount.toFixed(2)} USD
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Amount Form */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: "bold", marginBottom: "6px" }}>
            Or Enter Custom USD Amount:
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: "bold" }}>
                $
              </span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="10"
                value={customUsd}
                onChange={(e) => setCustomUsd(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 28px",
                  borderRadius: "10px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: customUsd !== "" ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#f59e0b", fontWeight: "bold" }}>
              = {totalCredits.toLocaleString()} Credits
            </div>
          </div>
        </div>

        {/* Square Payment Form Section */}
        <form onSubmit={handleSquareCheckout}>
          <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "14px", padding: "14px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "18px" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
              <span>Square Payment Checkout</span>
              <span style={{ color: "#22c55e" }}>🔒 256-Bit SSL Encrypted</span>
            </div>

            {/* Card Input preview matching Square Web Payments SDK container */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="text"
                readOnly
                value="•••• •••• •••• 4242 (Square Test Card)"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isProcessing || usdVal <= 0}
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: "12px",
                background: isProcessing ? "#475569" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none",
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "0.95rem",
                cursor: isProcessing ? "not-allowed" : "pointer",
                boxShadow: isProcessing ? "none" : "0 4px 16px rgba(37, 99, 235, 0.4)",
              }}
            >
              {isProcessing ? "Processing Square Payment..." : `Pay $${usdVal.toFixed(2)} USD via Square`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
