import type { CSSProperties } from "react";

export function tabStyle(active: boolean): CSSProperties {
  return {
    padding: "10px 18px",
    borderRadius: "12px",
    border: "none",
    background: active ? "#2563eb" : "rgba(255,255,255,0.05)",
    color: active ? "#ffffff" : "#94a3b8",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.85rem",
  };
}

export function btnStyle(bg: string): CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "0.8rem",
    cursor: "pointer",
  };
}

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  color: "#cbd5e1",
  marginBottom: "4px",
  fontWeight: 600,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "8px",
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  fontSize: "0.85rem",
  boxSizing: "border-box",
};

export const tableInputStyle: CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: "6px",
  background: "rgba(15, 23, 42, 0.8)",
  color: "#f8fafc",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  fontSize: "0.8rem",
};
