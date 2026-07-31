import React, { useState } from "react";
import { useStorage } from "../storage/StorageContext.js";
import type { StorageProviderType } from "shared";
import { labelStyle, inputStyle, btnStyle } from "./adminStyles.js";

export function StorageSection() {
  const { storageConfig, saveStorageConfig } = useStorage();

  const [storageForm, setStorageForm] = useState(storageConfig);
  const [storageSaveMessage, setStorageSaveMessage] = useState<string | null>(null);

  function handleSaveStorage(e: React.FormEvent) {
    e.preventDefault();
    saveStorageConfig(storageForm);
    setStorageSaveMessage("✅ Object Storage Configuration saved successfully!");
    setTimeout(() => setStorageSaveMessage(null), 3000);
  }

  function loadPreset(provider: StorageProviderType) {
    if (provider === "cloudflare-r2") {
      setStorageForm({
        provider: "cloudflare-r2",
        endpointUrl: "https://<account-id>.r2.cloudflarestorage.com",
        bucketName: "truco-assets",
        publicCdnDomain: "https://pub-r2.truco.app",
        accessKeyId: "r2_access_key_demo",
        secretAccessKey: "r2_secret_key_demo",
        region: "auto",
        isEnabled: true,
      });
    } else if (provider === "aws-s3") {
      setStorageForm({
        provider: "aws-s3",
        endpointUrl: "https://s3.us-east-1.amazonaws.com",
        bucketName: "truco-s3-assets",
        publicCdnDomain: "https://truco-s3-assets.s3.amazonaws.com",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        region: "us-east-1",
        isEnabled: true,
      });
    } else if (provider === "supabase-storage") {
      setStorageForm({
        provider: "supabase-storage",
        endpointUrl: "https://<project-ref>.supabase.co/storage/v1",
        bucketName: "peligroso-storage",
        publicCdnDomain: "",
        accessKeyId: "",
        secretAccessKey: "",
        region: "auto",
        isEnabled: true,
      });
    }
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>📦 Object Storage</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "14px",
            padding: "14px 18px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Current Object Storage Status:</div>
            <div style={{ fontSize: "1rem", fontWeight: "bold", color: storageForm.isEnabled ? "#22c55e" : "#f59e0b" }}>
              {storageForm.isEnabled
                ? `⚡ Active: ${storageForm.provider.toUpperCase()} (${storageForm.bucketName})`
                : "🟢 Local Storage Fallback Mode Active"}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={() => loadPreset("cloudflare-r2")} style={btnStyle("#f59e0b")}>
              ⚡ Load Cloudflare R2 Preset
            </button>
            <button type="button" onClick={() => loadPreset("aws-s3")} style={btnStyle("#2563eb")}>
              📦 Load AWS S3 Preset
            </button>
            <button type="button" onClick={() => loadPreset("supabase-storage")} style={btnStyle("#059669")}>
              ⚡ Load Supabase Preset
            </button>
          </div>
        </div>

        {storageSaveMessage && (
          <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", color: "#86efac", fontSize: "0.9rem" }}>
            {storageSaveMessage}
          </div>
        )}

        <form onSubmit={handleSaveStorage} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Storage Provider</label>
            <select
              value={storageForm.provider}
              onChange={(e) => setStorageForm({ ...storageForm, provider: e.target.value as StorageProviderType })}
              style={inputStyle}
            >
              <option value="cloudflare-r2">⚡ Cloudflare R2 (Recommended)</option>
              <option value="aws-s3">📦 Amazon Web Services (AWS S3)</option>
              <option value="supabase-storage">⚡ Supabase Storage</option>
              <option value="custom-s3">🛠️ Custom S3 / MinIO Endpoint</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Enable Cloud Object Storage</label>
            <button
              type="button"
              onClick={() => setStorageForm({ ...storageForm, isEnabled: !storageForm.isEnabled })}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                background: storageForm.isEnabled ? "#059669" : "#475569",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {storageForm.isEnabled ? "ENABLED (Cloud CDN Active)" : "DISABLED (Local Fallback Active)"}
            </button>
          </div>

          <div>
            <label style={labelStyle}>S3 Endpoint URL</label>
            <input
              type="text"
              placeholder="https://<account-id>.r2.cloudflarestorage.com"
              value={storageForm.endpointUrl}
              onChange={(e) => setStorageForm({ ...storageForm, endpointUrl: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Bucket Name</label>
            <input
              type="text"
              placeholder="truco-assets"
              value={storageForm.bucketName}
              onChange={(e) => setStorageForm({ ...storageForm, bucketName: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Public CDN Domain / Public URL Prefix</label>
            <input
              type="text"
              placeholder="https://assets.truco.app"
              value={storageForm.publicCdnDomain}
              onChange={(e) => setStorageForm({ ...storageForm, publicCdnDomain: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Region</label>
            <input
              type="text"
              placeholder="auto"
              value={storageForm.region}
              onChange={(e) => setStorageForm({ ...storageForm, region: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Access Key ID / Client Key</label>
            <input
              type="text"
              placeholder="r2_access_key_..."
              value={storageForm.accessKeyId}
              onChange={(e) => setStorageForm({ ...storageForm, accessKeyId: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Secret Access Key</label>
            <input
              type="password"
              placeholder="••••••••••••••••••••"
              value={storageForm.secretAccessKey}
              onChange={(e) => setStorageForm({ ...storageForm, secretAccessKey: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: "span 2", marginTop: "10px" }}>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
              }}
            >
              💾 Save Object Storage Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
