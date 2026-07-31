import React, { createContext, useContext, useState, useEffect } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { DeckTheme } from "shared";
import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRY_LIST: CountryInfo[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
];

export function getCountryFlag(code?: string): string {
  const found = COUNTRY_LIST.find((c) => c.code === code);
  return found ? found.flag : "🇦🇷";
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  elo_rating: number;
  matches_played: number;
  matches_won: number;
  is_guest: boolean;
  role: "user" | "admin";
  is_banned: boolean;
  selected_deck_id: string;
  custom_mat_url: string;
  mat_opacity: number;
  country_code: string;
  avatar_url?: string;
  victory_image_url?: string;
  victory_youtube_url?: string;
  victory_quote?: string;
}

export const PRESET_DECKS: DeckTheme[] = [
  {
    id: "classic-gold",
    name: "Classic Spanish Gold",
    description: "Standard traditional 40-card Spanish deck",
    cardBackUrl: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  },
  {
    id: "royal-crimson",
    name: "Royal Crimson Deck",
    description: "Deep red velvet card backs with golden filigree",
    cardBackUrl: "linear-gradient(135deg, #881337 0%, #4c0519 100%)",
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon Deck",
    description: "Futuristic dark blue with glowing cyan border",
    cardBackUrl: "linear-gradient(135deg, #0369a1 0%, #0f172a 100%)",
  },
];

export const PRESET_MATS = [
  { id: "felt", name: "Classic Green Felt", url: "linear-gradient(135deg, #0f5132 0%, #083320 100%)" },
  { id: "slate", name: "Midnight Slate", url: "linear-gradient(135deg, #1e293b 0%, #020617 100%)" },
  { id: "wood", name: "Royal Mahogany", url: "linear-gradient(135deg, #451a03 0%, #1c0a00 100%)" },
  { id: "cyber", name: "Cyber Grid Arena", url: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" },
];

interface AuthContextType {
  user: User | { id: string; email?: string } | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  decks: DeckTheme[];
  allUsers: UserProfile[];
  signIn: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUp: (email: string, pass: string, username: string) => Promise<{ error: string | null }>;
  signInAsGuest: (username?: string) => void;
  signOut: () => Promise<void>;
  updateStats: (won: boolean) => void;
  updateCustomization: (deckId: string, matUrl: string, opacity: number) => Promise<void>;
  updateCountry: (countryCode: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  createDeckTheme: (theme: Omit<DeckTheme, "id">) => void;
  updateDeckTheme: (id: string, theme: Omit<DeckTheme, "id">) => void;
  deleteDeckTheme: (id: string) => void;
  toggleUserBan: (userId: string) => void;
  toggleUserRole: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = "truco_guest_profile";
const DECKS_STORAGE_KEY = "truco_custom_decks";
const USERS_STORAGE_KEY = "truco_all_users_list";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | { id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [decks, setDecks] = useState<DeckTheme[]>(() => {
    const saved = localStorage.getItem(DECKS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return PRESET_DECKS;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: "bot-1",
        username: "ElGaucho_AR",
        display_name: "ElGaucho_AR",
        elo_rating: 1450,
        matches_played: 28,
        matches_won: 20,
        is_guest: false,
        role: "user",
        is_banned: false,
        selected_deck_id: "classic-gold",
        custom_mat_url: PRESET_MATS[0].url,
        mat_opacity: 0.85,
        country_code: "AR",
      },
      {
        id: "bot-2",
        username: "ElMate_UY",
        display_name: "ElMate_UY",
        elo_rating: 1390,
        matches_played: 22,
        matches_won: 15,
        is_guest: false,
        role: "user",
        is_banned: false,
        selected_deck_id: "royal-crimson",
        custom_mat_url: PRESET_MATS[1].url,
        mat_opacity: 0.85,
        country_code: "UY",
      },
      {
        id: "bot-3",
        username: "TrucoMaster_ES",
        display_name: "TrucoMaster_ES",
        elo_rating: 1310,
        matches_played: 18,
        matches_won: 11,
        is_guest: false,
        role: "user",
        is_banned: false,
        selected_deck_id: "cyber-neon",
        custom_mat_url: PRESET_MATS[3].url,
        mat_opacity: 0.85,
        country_code: "ES",
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Initialize Auth state
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchOrCreateSupabaseProfile(session.user);
        else setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchOrCreateSupabaseProfile(session.user);
        else setProfile(null);
      });

      return () => subscription.unsubscribe();
    } else {
      // Local Guest Profile fallback
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          setUser({ id: parsed.id });
        } catch {
          createGuestProfile("Player_1");
        }
      } else {
        createGuestProfile("Player_1");
      }
      setLoading(false);
    }
  }, []);

  function createGuestProfile(name: string = "Player_1") {
    const guestProf: UserProfile = {
      id: `guest-${Math.random().toString(36).substring(2, 9)}`,
      username: name,
      display_name: name,
      elo_rating: 1200,
      matches_played: 0,
      matches_won: 0,
      is_guest: true,
      role: "admin", // Admin by default in guest mode for testing
      is_banned: false,
      selected_deck_id: "classic-gold",
      custom_mat_url: PRESET_MATS[0].url,
      mat_opacity: 0.85,
      country_code: "AR",
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestProf));
    setProfile(guestProf);
    setUser({ id: guestProf.id });
    setAllUsers((prev) => [...prev.filter((u) => u.id !== guestProf.id), guestProf]);
  }

  async function fetchOrCreateSupabaseProfile(user: User) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          id: data.id,
          username: data.username || user.email?.split("@")[0] || "Player",
          display_name: data.display_name || data.username || "Player",
          elo_rating: data.elo_rating ?? 1200,
          matches_played: data.matches_played ?? 0,
          matches_won: data.matches_won ?? 0,
          is_guest: false,
          role: data.role || "user",
          is_banned: data.is_banned ?? false,
          selected_deck_id: (data.selected_deck_id === "classic-spanish" ? "classic-gold" : data.selected_deck_id) || "classic-gold",
          custom_mat_url: data.custom_mat_url || PRESET_MATS[0].url,
          mat_opacity: data.mat_opacity ?? 0.85,
          country_code: data.country_code || "AR",
          avatar_url: data.avatar_url || "",
        });
      } else if (error && error.code === "PGRST116") {
        const username = user.email?.split("@")[0] || `user_${user.id.slice(0, 6)}`;
        const newProf: UserProfile = {
          id: user.id,
          username,
          display_name: username,
          elo_rating: 1200,
          matches_played: 0,
          matches_won: 0,
          is_guest: false,
          role: "user",
          is_banned: false,
          selected_deck_id: "classic-gold",
          custom_mat_url: PRESET_MATS[0].url,
          mat_opacity: 0.85,
          country_code: "AR",
        };
        await supabase.from("profiles").insert([newProf]);
        setProfile(newProf);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, pass: string) {
    if (!supabase) return { error: "Supabase credentials not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error: error?.message || null };
  }

  async function signUp(email: string, pass: string, username: string) {
    if (!supabase) return { error: "Supabase credentials not configured." };
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { username } },
    });
    if (data.user && !error) {
      const newProf: UserProfile = {
        id: data.user.id,
        username,
        display_name: username,
        elo_rating: 1200,
        matches_played: 0,
        matches_won: 0,
        is_guest: false,
        role: "user",
        is_banned: false,
        selected_deck_id: "classic-gold",
        custom_mat_url: PRESET_MATS[0].url,
        mat_opacity: 0.85,
        country_code: "AR",
      };
      await supabase.from("profiles").insert([newProf]);
      setProfile(newProf);
    }
    return { error: error?.message || null };
  }

  function signInAsGuest(username?: string) {
    createGuestProfile(username || `Player_${Math.floor(Math.random() * 1000)}`);
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setSession(null);
    setUser(null);
    setProfile(null);
    createGuestProfile();
  }

  function updateStats(won: boolean) {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      matches_played: profile.matches_played + 1,
      matches_won: profile.matches_won + (won ? 1 : 0),
      elo_rating: profile.elo_rating + (won ? 15 : -10),
    };
    setProfile(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

    if (profile.is_guest) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    } else if (supabase && profile.id) {
      supabase.from("profiles").update({
        matches_played: updated.matches_played,
        matches_won: updated.matches_won,
        elo_rating: updated.elo_rating,
      }).eq("id", profile.id);
    }
  }

  async function persistProfile(updated: UserProfile) {
    setProfile(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

    if (updated.is_guest) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    } else if (isSupabaseConfigured && supabase && updated.id) {
      const { error } = await supabase.from("profiles").update({
        selected_deck_id: updated.selected_deck_id,
        custom_mat_url: updated.custom_mat_url,
        mat_opacity: updated.mat_opacity,
        country_code: updated.country_code,
        avatar_url: updated.avatar_url || "",
        display_name: updated.display_name,
      }).eq("id", updated.id);

      if (error) console.error("Error committing profile to Supabase:", error);
    }
  }

  async function updateCustomization(deckId: string, matUrl: string, opacity: number) {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      selected_deck_id: deckId,
      custom_mat_url: matUrl,
      mat_opacity: opacity,
    };
    await persistProfile(updated);
  }

  async function updateCountry(countryCode: string) {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      country_code: countryCode,
    };
    await persistProfile(updated);
  }

  async function updateAvatar(avatarUrl: string) {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      avatar_url: avatarUrl,
    };
    await persistProfile(updated);
  }

  async function updateVictoryShowcase(image: string, youtube: string, quote: string) {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      victory_image_url: image,
      victory_youtube_url: youtube,
      victory_quote: quote,
    };
    await persistProfile(updated);
  }

  async function createDeckTheme(theme: Omit<DeckTheme, "id">) {
    const id = `deck-${Date.now()}`;
    const newTheme: DeckTheme = {
      ...theme,
      id,
    };
    setDecks((prev) => [...prev, newTheme]);

    if (isSupabaseConfigured && supabase) {
      await supabase.from("deck_themes").upsert([
        {
          id,
          name: theme.name,
          description: theme.description,
          card_back_url: theme.cardBackUrl,
          card_faces: theme.cardFaces || {},
        },
      ]);
    }
  }

  async function updateDeckTheme(id: string, theme: Omit<DeckTheme, "id">) {
    const updatedTheme: DeckTheme = {
      ...theme,
      id,
    };
    setDecks((prev) => prev.map((d) => (d.id === id ? updatedTheme : d)));

    if (isSupabaseConfigured && supabase) {
      await supabase.from("deck_themes").upsert([
        {
          id,
          name: theme.name,
          description: theme.description,
          card_back_url: theme.cardBackUrl,
          card_faces: theme.cardFaces || {},
        },
      ]);
    }
  }

  async function deleteDeckTheme(id: string) {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("deck_themes").delete().eq("id", id);
    }
  }

  function toggleUserBan(userId: string) {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_banned: !u.is_banned } : u))
    );
    if (profile?.id === userId) {
      setProfile((prev) => (prev ? { ...prev, is_banned: !prev.is_banned } : null));
    }
  }

  function toggleUserRole(userId: string) {
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: u.role === "admin" ? "user" : "admin" } : u
      )
    );
    if (profile?.id === userId) {
      setProfile((prev) =>
        prev ? { ...prev, role: prev.role === "admin" ? "user" : "admin" } : null
      );
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        decks,
        allUsers,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        updateStats,
        updateCustomization,
        updateCountry,
        updateAvatar,
        updateVictoryShowcase,
        createDeckTheme,
        updateDeckTheme,
        deleteDeckTheme,
        toggleUserBan,
        toggleUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
