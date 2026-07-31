import React, { useState } from "react";
import { useI18n } from "../i18n/I18nContext.js";
import { inputStyle, tableInputStyle, btnStyle } from "./adminStyles.js";

export function I18nSection() {
  const { translations, updateTranslationKey, addTranslationKey, addLanguage } = useI18n();

  const [i18nSearch, setI18nSearch] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newEs, setNewEs] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newLangCode, setNewLangCode] = useState("");

  function handleAddTranslation(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim()) return;
    addTranslationKey(newKey.trim(), newEs.trim(), newEn.trim());
    setNewKey("");
    setNewEs("");
    setNewEn("");
  }

  function handleAddLanguage(e: React.FormEvent) {
    e.preventDefault();
    if (!newLangCode.trim()) return;
    addLanguage(newLangCode.trim());
    setNewLangCode("");
  }

  const allI18nKeys = Array.from(
    new Set([...Object.keys(translations.es || {}), ...Object.keys(translations.en || {})])
  ).filter(
    (k) =>
      k.toLowerCase().includes(i18nSearch.toLowerCase()) ||
      (translations.es?.[k] || "").toLowerCase().includes(i18nSearch.toLowerCase()) ||
      (translations.en?.[k] || "").toLowerCase().includes(i18nSearch.toLowerCase())
  );

  return (
    <div>
      <h1 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>🌐 Translations & i18n</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <form onSubmit={handleAddLanguage} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="New Lang (e.g. pt)"
              value={newLangCode}
              onChange={(e) => setNewLangCode(e.target.value)}
              style={{ ...inputStyle, width: "140px" }}
            />
            <button type="submit" style={btnStyle("#2563eb")}>+ Add Lang</button>
          </form>

          <form onSubmit={handleAddTranslation} style={{ display: "flex", gap: "8px", flex: 1 }}>
            <input
              type="text"
              placeholder="Key (e.g. call.truco)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="text"
              placeholder="Spanish (es)"
              value={newEs}
              onChange={(e) => setNewEs(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="text"
              placeholder="English (en)"
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" style={btnStyle("#059669")}>+ Add Key</button>
          </form>
        </div>

        <input
          type="text"
          placeholder="Search translation keys or text..."
          value={i18nSearch}
          onChange={(e) => setI18nSearch(e.target.value)}
          style={inputStyle}
        />

        <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "16px", padding: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#f59e0b", textAlign: "left" }}>
                <th style={{ padding: "8px" }}>Translation Key</th>
                <th style={{ padding: "8px" }}>🇪🇸 Spanish (es)</th>
                <th style={{ padding: "8px" }}>🇬🇧 English (en)</th>
              </tr>
            </thead>
            <tbody>
              {allI18nKeys.map((k) => (
                <tr key={k} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "8px", fontWeight: "bold", color: "#60a5fa", fontFamily: "monospace" }}>
                    {k}
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="text"
                      value={translations.es?.[k] || ""}
                      onChange={(e) => updateTranslationKey("es", k, e.target.value)}
                      style={tableInputStyle}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="text"
                      value={translations.en?.[k] || ""}
                      onChange={(e) => updateTranslationKey("en", k, e.target.value)}
                      style={tableInputStyle}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
