# Admin Page Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `AdminPanel` modal with a routed, full-page `/admin` section (sidebar nav, five sub-routes, access-guarded), splitting the current 952-line monolithic component into one file per section.

**Architecture:** Add `react-router-dom`, scoped to two top-level routes: `/*` renders the existing `MainApp` untouched, `/admin/*` renders a new `AdminLayout` (sidebar + `<Outlet/>`) with nested routes for Users, Decks, i18n, Storage, and a new Payments placeholder. Each section becomes its own component under `packages/client/src/admin/`, reading data via the same hooks (`useAuth`, `useI18n`, `useStorage`) the old modal used directly — no prop drilling needed since routing replaces the modal's open/close prop contract.

**Tech Stack:** React 18, `react-router-dom` ^7.18.2, TypeScript, Vite. No test framework exists in this package (verified: no vitest/jest/testing-library anywhere in `packages/client`) — verification steps use `npx tsc --noEmit` (Vite's `esbuild` build does not type-check — this has already let two real crash bugs through this session) + `npm run build` + manual browser checks, per the approved spec's Testing section.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-31-admin-page-design.md`
- Payments section is a **placeholder only** in this plan — full Square integration is a separate future spec/plan.
- No changes to lobby/game navigation, state model, or visual redesign of section content — this is a structural move (modal → routed page, one file → six), not a redesign.
- `/admin/*` must redirect non-admins (`profile?.role !== "admin"`, including while `loading`) to `/`.
- Every task must leave `npx tsc --noEmit` (run from `packages/client`) clean of *new* errors — the six pre-existing benign narrowing errors (`AuthModal.tsx`, `LobbyChat.tsx`, `TrucoBoard.tsx:1025` `ctx.matchID`, `SocialPanel.tsx`) are known and out of scope; do not fix or worsen them.

---

### Task 1: Routing skeleton and Admin shell

**Files:**
- Modify: `packages/client/package.json` (add dependency)
- Modify: `packages/client/src/App.tsx` (wrap in router, split routes)
- Create: `packages/client/src/admin/AdminLayout.tsx`
- Create: `packages/client/src/admin/UsersSection.tsx` (stub)
- Create: `packages/client/src/admin/DecksSection.tsx` (stub)
- Create: `packages/client/src/admin/I18nSection.tsx` (stub)
- Create: `packages/client/src/admin/StorageSection.tsx` (stub)
- Create: `packages/client/src/admin/PaymentsSection.tsx` (real placeholder content — final for this plan)

**Interfaces:**
- Produces: `AdminLayout` (default export none — named export `AdminLayout`, no props, self-guards via `useAuth()`). Named exports `UsersSection`, `DecksSection`, `I18nSection`, `StorageSection`, `PaymentsSection` — all zero-prop components, each importing whatever hooks they need directly (no props passed from `AdminLayout`).
- Consumes: `useAuth()` from `../AuthContext.js` (needs `profile: UserProfile | null` and `loading: boolean`, both already exported per `AuthContext.tsx:78,107,487`).

- [ ] **Step 1: Add the dependency**

```bash
cd packages/client && npm install react-router-dom@^7.18.2
```

- [ ] **Step 2: Verify it installed**

Run: `cat packages/client/package.json | grep react-router-dom`
Expected: a line like `"react-router-dom": "^7.18.2",` under `dependencies`.

- [ ] **Step 3: Create the five section files as stubs**

`packages/client/src/admin/UsersSection.tsx`:

```tsx
import React from "react";

export function UsersSection() {
  return (
    <div>
      <h1 style={{ margin: "0 0 8px 0", color: "#f59e0b" }}>👥 Manage Users</h1>
      <p style={{ color: "#94a3b8" }}>Coming soon.</p>
    </div>
  );
}
```

`packages/client/src/admin/DecksSection.tsx`:

```tsx
import React from "react";

export function DecksSection() {
  return (
    <div>
      <h1 style={{ margin: "0 0 8px 0", color: "#f59e0b" }}>🎴 Card Deck Themes</h1>
      <p style={{ color: "#94a3b8" }}>Coming soon.</p>
    </div>
  );
}
```

`packages/client/src/admin/I18nSection.tsx`:

```tsx
import React from "react";

export function I18nSection() {
  return (
    <div>
      <h1 style={{ margin: "0 0 8px 0", color: "#f59e0b" }}>🌐 Translations & i18n</h1>
      <p style={{ color: "#94a3b8" }}>Coming soon.</p>
    </div>
  );
}
```

`packages/client/src/admin/StorageSection.tsx`:

```tsx
import React from "react";

export function StorageSection() {
  return (
    <div>
      <h1 style={{ margin: "0 0 8px 0", color: "#f59e0b" }}>📦 Object Storage</h1>
      <p style={{ color: "#94a3b8" }}>Coming soon.</p>
    </div>
  );
}
```

`packages/client/src/admin/PaymentsSection.tsx` (real content — this is the actual deliverable for this section in this plan, full Square integration is a separate future plan):

```tsx
import React from "react";

export function PaymentsSection() {
  return (
    <div>
      <h1 style={{ margin: "0 0 8px 0", color: "#f59e0b" }}>💳 Payments</h1>
      <p style={{ color: "#94a3b8", maxWidth: "480px", lineHeight: 1.6 }}>
        Square payment integration and the credits system are coming in a
        future update. This section will let admins configure Square
        credentials and view purchase/credit activity.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create the Admin layout shell**

`packages/client/src/admin/AdminLayout.tsx`:

```tsx
import React from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.js";

const SECTIONS = [
  { path: "users", label: "👥 Manage Users" },
  { path: "decks", label: "🎴 Card Deck Themes" },
  { path: "i18n", label: "🌐 Translations & i18n" },
  { path: "storage", label: "📦 Object Storage" },
  { path: "payments", label: "💳 Payments" },
];

export function AdminLayout() {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (profile?.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "radial-gradient(circle at top center, #0f172a 0%, #020617 100%)",
        color: "#f8fafc",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      <aside
        style={{
          width: "260px",
          flexShrink: 0,
          background: "rgba(15, 23, 42, 0.9)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#f59e0b",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🛡️ Admin Console
        </h2>

        {SECTIONS.map((s) => (
          <NavLink
            key={s.path}
            to={`/admin/${s.path}`}
            style={({ isActive }) => ({
              padding: "10px 14px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "0.85rem",
              background: isActive ? "#2563eb" : "transparent",
              color: isActive ? "#ffffff" : "#94a3b8",
            })}
          >
            {s.label}
          </NavLink>
        ))}

        <NavLink
          to="/"
          style={{
            marginTop: "auto",
            padding: "10px 14px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "0.85rem",
            color: "#f87171",
          }}
        >
          ⬅️ Back to Game
        </NavLink>
      </aside>

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Wire routing into App.tsx**

In `packages/client/src/App.tsx`, add these imports at the top (alongside the existing ones):

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./admin/AdminLayout.js";
import { UsersSection } from "./admin/UsersSection.js";
import { DecksSection } from "./admin/DecksSection.js";
import { I18nSection } from "./admin/I18nSection.js";
import { StorageSection } from "./admin/StorageSection.js";
import { PaymentsSection } from "./admin/PaymentsSection.js";
```

Replace the existing `export function App()` body (the `<StorageProvider><I18nProvider><AuthProvider><MainApp /></AuthProvider></I18nProvider></StorageProvider>` block) with:

```tsx
export function App() {
  return (
    <BrowserRouter>
      <StorageProvider>
        <I18nProvider>
          <AuthProvider>
            <Routes>
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<UsersSection />} />
                <Route path="decks" element={<DecksSection />} />
                <Route path="i18n" element={<I18nSection />} />
                <Route path="storage" element={<StorageSection />} />
                <Route path="payments" element={<PaymentsSection />} />
              </Route>
              <Route path="/*" element={<MainApp />} />
            </Routes>
          </AuthProvider>
        </I18nProvider>
      </StorageProvider>
    </BrowserRouter>
  );
}
```

Do not touch `MainApp` itself in this task — it keeps its own internal `mode` state exactly as-is.

- [ ] **Step 6: Type-check**

Run (from `packages/client`): `npx tsc --noEmit -p tsconfig.json`
Expected: only the six known pre-existing errors listed in Global Constraints — no new errors.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: succeeds, no errors.

- [ ] **Step 8: Manual verification**

Run `npm run dev` (from `packages/client`), open the app in a browser:
- Visiting `/` still shows the normal lobby.
- Visiting `/admin` while logged in as a non-admin (or logged out) redirects to `/`.
- Visiting `/admin` while logged in as an admin redirects to `/admin/users` and shows the sidebar with all 5 sections plus a "Back to Game" link.
- Clicking each sidebar link navigates correctly and highlights the active section; browser back/forward works.
- The old "Admin Console" header button (still present, still opens the old modal — untouched in this task) continues to work as before.

- [ ] **Step 9: Commit**

```bash
git add packages/client/package.json package-lock.json packages/client/src/App.tsx packages/client/src/admin
git commit -m "feat: add routed /admin shell with access guard and stub sections"
```

---

### Task 2: Users section

**Files:**
- Modify: `packages/client/src/admin/UsersSection.tsx` (replace stub with real content, extracted from `packages/client/src/AdminPanel.tsx:291-369`)

**Interfaces:**
- Consumes: `useAuth()` → `allUsers: UserProfile[]`, `toggleUserBan: (userId: string) => void`, `toggleUserRole: (userId: string) => void` (all already exported, `AuthContext.tsx:81,93,94`).
- Produces: no change to `UsersSection`'s export shape (still zero-prop).

- [ ] **Step 1: Replace the stub with the real extracted content**

`packages/client/src/admin/UsersSection.tsx`:

```tsx
import React, { useState } from "react";
import { useAuth } from "../AuthContext.js";
import { inputStyle } from "./adminStyles.js";

export function UsersSection() {
  const { allUsers, toggleUserBan, toggleUserRole } = useAuth();
  const [searchFilter, setSearchFilter] = useState("");

  const filteredUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h1 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>
        👥 Manage Users ({allUsers.length})
      </h1>

      <input
        type="text"
        placeholder="Search user..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        style={inputStyle}
      />

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "30px" }}>
            No users found.
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(15, 23, 42, 0.6)",
                border: u.is_banned ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "14px 18px",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold", fontSize: "1rem", color: u.is_banned ? "#f87171" : "#f1f5f9" }}>
                  {u.username} {u.role === "admin" && <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>[ADMIN]</span>}
                  {u.is_banned && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}> [BANNED]</span>}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                  ELO: {u.elo_rating} | Wins: {u.matches_won}/{u.matches_played} | Deck: {u.selected_deck_id}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => toggleUserRole(u.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: u.role === "admin" ? "#d97706" : "#475569",
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {u.role === "admin" ? "Demote" : "Make Admin"}
                </button>

                <button
                  onClick={() => toggleUserBan(u.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: u.is_banned ? "#059669" : "#dc2626",
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {u.is_banned ? "Unban" : "Ban User"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the shared style helper module**

This is used by every section (users now, decks/i18n/storage in later tasks) — extracted once here from `AdminPanel.tsx:925-952` rather than duplicated per file.

`packages/client/src/admin/adminStyles.ts`:

```ts
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
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json` (from `packages/client`)
Expected: only the six known pre-existing errors, no new ones.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Manual verification**

With `npm run dev` running, as an admin visit `/admin/users`:
- User list renders, matches what the old modal's Users tab showed.
- Search box filters by username.
- "Make Admin"/"Demote" and "Ban User"/"Unban" buttons work and reflect immediately (compare against the still-untouched old modal to confirm identical behavior).

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/admin/UsersSection.tsx packages/client/src/admin/adminStyles.ts
git commit -m "feat: extract Users admin section to its own routed page"
```

---

### Task 3: Decks section

**Files:**
- Modify: `packages/client/src/admin/DecksSection.tsx` (replace stub with real content, extracted from `packages/client/src/AdminPanel.tsx:1-134,372-635`)

**Interfaces:**
- Consumes: `useAuth()` → `decks: DeckTheme[]`, `createDeckTheme`, `updateDeckTheme`, `deleteDeckTheme` (`AuthContext.tsx:90-92`); `useStorage()` → `uploadAsset: (file: File, folder: "avatars" | "mats" | "decks") => Promise<string>` (`storage/StorageContext.tsx`); `labelStyle`, `inputStyle` from `./adminStyles.js` (produced in Task 2).
- Produces: no change to `DecksSection`'s export shape.

- [ ] **Step 1: Replace the stub with the real extracted content**

`packages/client/src/admin/DecksSection.tsx`:

```tsx
import React, { useState } from "react";
import { useAuth } from "../AuthContext.js";
import { useStorage } from "../storage/StorageContext.js";
import { labelStyle, inputStyle } from "./adminStyles.js";

const SUITS = ["espada", "basto", "oro", "copa"] as const;
const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const;

function parseCardIdFromFilename(filename: string): string | null {
  const clean = filename.toLowerCase().replace(/[^a-z0-9]/g, " ");
  for (const suit of ["espada", "basto", "oro", "copa"]) {
    if (clean.includes(suit)) {
      for (const rank of [12, 11, 10, 7, 6, 5, 4, 3, 2, 1]) {
        if (clean.includes(String(rank))) {
          return `${rank}-${suit}`;
        }
      }
    }
  }
  return null;
}

export function DecksSection() {
  const { decks, createDeckTheme, updateDeckTheme, deleteDeckTheme } = useAuth();
  const { uploadAsset } = useStorage();

  const [isUploading, setIsUploading] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [cardBackUrl, setCardBackUrl] = useState("");
  const [cardFaces, setCardFaces] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  async function handleSingleCardFaceUpload(cardId: string, file: File) {
    setUploadProgress(`Uploading ${cardId}...`);
    try {
      const url = await uploadAsset(file, "decks");
      setCardFaces((prev) => ({ ...prev, [cardId]: url }));
    } catch (err: any) {
      alert(`Failed to upload ${cardId}: ${err.message}`);
    } finally {
      setUploadProgress(null);
    }
  }

  async function handleBulkCardFacesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFaces: Record<string, string> = { ...cardFaces };
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cardId = parseCardIdFromFilename(file.name);
      if (cardId) {
        setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}...`);
        try {
          const url = await uploadAsset(file, "decks");
          newFaces[cardId] = url;
          count++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }
    }

    setCardFaces(newFaces);
    setIsUploading(false);
    setUploadProgress(null);
    alert(`Successfully uploaded ${count} card face images!`);
  }

  function handleSaveDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!deckName.trim()) return;

    if (editingDeckId) {
      updateDeckTheme(editingDeckId, {
        name: deckName,
        description: deckDesc || "Custom 40-Card Spanish Deck",
        cardBackUrl: cardBackUrl || "linear-gradient(135deg, #475569 0%, #0f172a 100%)",
        cardFaces: Object.keys(cardFaces).length > 0 ? cardFaces : undefined,
      });
    } else {
      createDeckTheme({
        name: deckName,
        description: deckDesc || "Custom 40-Card Spanish Deck",
        cardBackUrl: cardBackUrl || "linear-gradient(135deg, #475569 0%, #0f172a 100%)",
        cardFaces: Object.keys(cardFaces).length > 0 ? cardFaces : undefined,
      });
    }

    resetDeckForm();
  }

  function handleEditDeck(deck: any) {
    setEditingDeckId(deck.id);
    setDeckName(deck.name);
    setDeckDesc(deck.description);
    setCardBackUrl(deck.cardBackUrl);
    setCardFaces(deck.cardFaces || {});
  }

  function resetDeckForm() {
    setEditingDeckId(null);
    setDeckName("");
    setDeckDesc("");
    setCardBackUrl("");
    setCardFaces({});
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadAsset(file, "decks");
      setCardBackUrl(url);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>
        🎴 Card Deck Themes ({decks.length})
      </h1>

      <div style={{ display: "flex", gap: "20px" }}>
        <div
          style={{
            flex: 1,
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <h3 style={{ margin: 0, color: "#f59e0b", fontSize: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{editingDeckId ? `✏️ Edit Deck Theme (${deckName})` : "➕ Create 40-Card Spanish Deck Theme"}</span>
            {editingDeckId && (
              <button
                type="button"
                onClick={resetDeckForm}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#cbd5e1",
                  border: "none",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                ✕ Cancel Edit
              </button>
            )}
          </h3>
          <form onSubmit={handleSaveDeck} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Deck Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Cyberpunk Gold"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                placeholder="Futuristic glowing 40-card deck"
                value={deckDesc}
                onChange={(e) => setDeckDesc(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Card Back Image URL or Gradient CSS</label>
              <input
                type="text"
                placeholder="https://... or linear-gradient(...)"
                value={cardBackUrl}
                onChange={(e) => setCardBackUrl(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Or Upload Card Back Image</label>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ color: "#94a3b8", fontSize: "0.85rem" }} />
            </div>

            <div style={{ background: "rgba(0, 0, 0, 0.3)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(255,255,255,0.08)", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ ...labelStyle, margin: 0, color: "#f59e0b", fontSize: "0.9rem" }}>
                  🃏 Upload 40 Individual Card Face Images ({Object.keys(cardFaces).length}/40 Uploaded)
                </label>
              </div>

              <div style={{ background: "rgba(37, 99, 235, 0.15)", border: "1px dashed #3b82f6", borderRadius: "10px", padding: "10px", textAlign: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "0.8rem", color: "#93c5fd", fontWeight: "bold", marginBottom: "4px" }}>
                  ⚡ Bulk Auto-Upload (Multiple Files)
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBulkCardFacesUpload}
                  style={{ color: "#94a3b8", fontSize: "0.75rem" }}
                />
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                  Tip: Auto-maps filenames like <code>1-espada.png</code>, <code>7_oro.jpg</code>, <code>10copa.png</code>
                </div>
              </div>

              {uploadProgress && (
                <div style={{ padding: "6px 10px", borderRadius: "6px", background: "#d97706", color: "#fff", fontSize: "0.75rem", fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                  ⏳ {uploadProgress}
                </div>
              )}

              <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
                {SUITS.map((suit) => {
                  const suitIcon = suit === "espada" ? "⚔️" : suit === "basto" ? "🪵" : suit === "oro" ? "🪙" : "🍷";
                  return (
                    <div key={suit} style={{ background: "rgba(15, 23, 42, 0.5)", padding: "8px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#cbd5e1", textTransform: "capitalize", marginBottom: "6px" }}>
                        {suitIcon} {suit}s
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                        {RANKS.map((rank) => {
                          const cardId = `${rank}-${suit}`;
                          const customUrl = cardFaces[cardId];
                          return (
                            <div
                              key={cardId}
                              style={{
                                background: customUrl ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.04)",
                                border: customUrl ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                padding: "4px",
                                textAlign: "center",
                                fontSize: "0.7rem",
                              }}
                            >
                              <div style={{ fontWeight: "bold", color: customUrl ? "#4ade80" : "#94a3b8" }}>
                                {rank} {suitIcon}
                              </div>
                              {customUrl ? (
                                <div style={{ margin: "4px 0" }}>
                                  <img src={customUrl} alt={cardId} style={{ width: "32px", height: "48px", objectFit: "cover", borderRadius: "4px" }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = { ...cardFaces };
                                      delete next[cardId];
                                      setCardFaces(next);
                                    }}
                                    style={{ display: "block", width: "100%", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.6rem", cursor: "pointer", marginTop: "2px" }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <label style={{ display: "block", marginTop: "4px", background: "#2563eb", color: "#fff", padding: "2px 4px", borderRadius: "4px", fontSize: "0.6rem", cursor: "pointer" }}>
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleSingleCardFaceUpload(cardId, f);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: "8px",
                padding: "12px",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Save Deck Theme
            </button>
          </form>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ margin: "0 0 4px 0", color: "#e2e8f0", fontSize: "1.05rem" }}>
            Available Decks
          </h3>
          {decks.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "56px",
                  borderRadius: "6px",
                  background: d.cardBackUrl.startsWith("http") || d.cardBackUrl.startsWith("data:")
                    ? `url("${d.cardBackUrl}") center/cover`
                    : d.cardBackUrl,
                  border: "1px solid rgba(255,255,255,0.3)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{d.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {d.description} {d.cardFaces && `(${Object.keys(d.cardFaces).length}/40 Custom Faces)`}
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => handleEditDeck(d)}
                  style={{
                    padding: "4px 10px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit
                </button>

                {d.id.startsWith("deck-") && (
                  <button
                    onClick={() => deleteDeckTheme(d.id)}
                    style={{
                      padding: "4px 8px",
                      background: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json` (from `packages/client`)
Expected: only the six known pre-existing errors, no new ones. In particular, `isUploading` is written but not read here — same as the original `AdminPanel.tsx`, so this must not produce a new "unused variable" error (it didn't before; `tsconfig.base.json` does not have `noUnusedLocals` enabled — confirm this stays true).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Manual verification**

As an admin, visit `/admin/decks`:
- Existing decks list renders identically to the old modal's Decks tab.
- Create a new deck (name + description + gradient card back) and confirm it appears in the list.
- Edit an existing custom deck (one whose id starts with `deck-`), confirm the form pre-fills and Cancel Edit works.
- Delete a custom deck, confirm it's removed (built-in decks without the `deck-` prefix should have no Delete button, matching prior behavior).
- Upload a single card back image and a bulk set of card face images (if Supabase Storage is configured) and confirm they persist — this exercises the real upload path fixed earlier this session, so a regression here would be a meaningful signal.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/admin/DecksSection.tsx
git commit -m "feat: extract Decks admin section to its own routed page"
```

---

### Task 4: i18n section

**Files:**
- Modify: `packages/client/src/admin/I18nSection.tsx` (replace stub with real content, extracted from `packages/client/src/AdminPanel.tsx:638-723`)

**Interfaces:**
- Consumes: `useI18n()` → `translations`, `updateTranslationKey`, `addTranslationKey`, `addLanguage` (`i18n/I18nContext.tsx:7-12`); `inputStyle`, `tableInputStyle`, `btnStyle` from `./adminStyles.js`.
- Produces: no change to `I18nSection`'s export shape.

- [ ] **Step 1: Replace the stub with the real extracted content**

`packages/client/src/admin/I18nSection.tsx`:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json` (from `packages/client`)
Expected: only the six known pre-existing errors, no new ones.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Manual verification**

As an admin, visit `/admin/i18n`:
- Table of translation keys renders, matches the old modal's i18n tab.
- Search filters by key or value text.
- Editing a Spanish or English cell updates it live (check it reflects in the game UI by switching language in the lobby).
- Adding a new language and a new translation key both work.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/admin/I18nSection.tsx
git commit -m "feat: extract i18n admin section to its own routed page"
```

---

### Task 5: Storage section

**Files:**
- Modify: `packages/client/src/admin/StorageSection.tsx` (replace stub with real content, extracted from `packages/client/src/AdminPanel.tsx:164-206,726-893`)

**Interfaces:**
- Consumes: `useStorage()` → `storageConfig`, `saveStorageConfig` (`storage/StorageContext.tsx`); `StorageProviderType` from `"shared"`; `labelStyle`, `inputStyle`, `btnStyle` from `./adminStyles.js`.
- Produces: no change to `StorageSection`'s export shape.

- [ ] **Step 1: Replace the stub with the real extracted content**

`packages/client/src/admin/StorageSection.tsx`:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json` (from `packages/client`)
Expected: only the six known pre-existing errors, no new ones.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Manual verification**

As an admin, visit `/admin/storage`:
- Current status banner matches the old modal's Storage tab.
- Loading the Supabase preset populates the form with `provider: "supabase-storage"`, `bucketName: "peligroso-storage"` — do not "fix" this to look like it should say `bucketName: "truco-assets"` or similar; this must remain wired to whatever `StorageContext`'s actual `uploadAsset` branches on (confirmed `"supabase-storage"` earlier this session — this task only relocates the UI, it does not touch `StorageContext.tsx`).
- Saving the form shows the confirmation message and updates the "Current Object Storage Status" banner.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/admin/StorageSection.tsx
git commit -m "feat: extract Storage admin section to its own routed page"
```

---

### Task 6: Cut over — remove the old modal

**Files:**
- Delete: `packages/client/src/AdminPanel.tsx`
- Modify: `packages/client/src/App.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — this task only removes dead code and swaps one button's behavior.

- [ ] **Step 1: Delete the old modal file**

```bash
rm packages/client/src/AdminPanel.tsx
```

- [ ] **Step 2: Remove its import and usage from App.tsx**

In `packages/client/src/App.tsx`:

Remove this import line:
```tsx
import { AdminPanel } from "./AdminPanel.js";
```

Remove the `isAdminOpen` state line inside `MainApp`:
```tsx
const [isAdminOpen, setIsAdminOpen] = useState(false);
```

Remove the `<AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />` line near the bottom of `MainApp`'s JSX (next to `<AuthModal .../>`).

- [ ] **Step 3: Turn the header "Admin Console" button into a link**

Add this import to `App.tsx` (alongside the other `react-router-dom` imports from Task 1):

```tsx
import { Link } from "react-router-dom";
```

Replace the existing admin button block:

```tsx
{profile?.role === "admin" && (
  <button
    onClick={() => setIsAdminOpen(true)}
    style={{
      padding: "6px 12px",
      background: "#d97706",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      fontSize: "0.8rem",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    {t("app.admin")}
  </button>
)}
```

with:

```tsx
{profile?.role === "admin" && (
  <Link
    to="/admin"
    style={{
      padding: "6px 12px",
      background: "#d97706",
      color: "#ffffff",
      borderRadius: "8px",
      fontSize: "0.8rem",
      fontWeight: "bold",
      textDecoration: "none",
      display: "inline-block",
    }}
  >
    {t("app.admin")}
  </Link>
)}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json` (from `packages/client`)
Expected: only the six known pre-existing errors, no new ones, and no "cannot find module './AdminPanel.js'" error (confirms nothing else still imports the deleted file).

- [ ] **Step 5: Confirm nothing else references the deleted file**

Run: `grep -rn "AdminPanel" packages/client/src`
Expected: no output.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Full manual regression pass**

With `npm run dev` running:
- Header "Admin Console" button (admin users only) navigates to `/admin/users` instead of opening a modal.
- All 5 sections still work exactly as verified in Tasks 2-5.
- Non-admin users don't see the header button at all, and typing `/admin` in the URL bar redirects them to `/`.
- The rest of the app (lobby, matchmaking, starting/playing a match, chat, voice/video) is unaffected — spot-check at least starting an AI practice match end-to-end, since this task touches `App.tsx` which also contains all of that logic.

- [ ] **Step 8: Commit**

```bash
git add -A packages/client/src/AdminPanel.tsx packages/client/src/App.tsx
git commit -m "refactor: remove modal AdminPanel, admin is now the routed /admin page"
```

---

## Plan Self-Review

**Spec coverage:**
- Routing (BrowserRouter, `/*` vs `/admin/*` split) → Task 1. ✓
- Layout & sections (sidebar, one route per section, splitting the monolith) → Tasks 1-5. ✓
- Access control (redirect non-admins at the route level) → Task 1 (`AdminLayout`), verified in every task's manual check and finalized in Task 6. ✓
- Payments placeholder route/nav entry → Task 1. ✓
- "No visual redesign" constraint → every extraction task reproduces the original JSX/styles verbatim, only relocating them. ✓
- Testing section (manual + `tsc`/`build` clean) → every task. ✓

**Placeholder scan:** No TBD/TODO markers. The only intentional stub content (`UsersSection`/`DecksSection`/`I18nSection`/`StorageSection` in Task 1) is deliberately temporary scaffolding that Tasks 2-5 immediately replace with real code in this same plan — not a deferred requirement.

**Type consistency:** `useAuth()`, `useI18n()`, `useStorage()` member names cross-checked directly against their source files (`AuthContext.tsx`, `i18n/I18nContext.tsx`, `storage/StorageContext.tsx`) rather than assumed from memory. `adminStyles.ts`'s four exports (`tabStyle`, `btnStyle`, `labelStyle`, `inputStyle`, `tableInputStyle`) are consumed with matching names across Tasks 2, 4, 5 (`tabStyle` itself ends up unused post-refactor since the tab-button row is replaced by the sidebar — left exported for now since removing it is out of scope for this plan and it causes no error under this project's TS config).
