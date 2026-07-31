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

export function getCountryFlag(code?: string, isGuest?: boolean): string {
  if (isGuest || !code || code === "NONE" || code === "GUEST" || code.trim() === "") return "";
  const found = COUNTRY_LIST.find((c) => c.code === code);
  return found ? found.flag : "";
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

export type CallType =
  | "envido"
  | "real_envido"
  | "falta_envido"
  | "truco"
  | "retruco"
  | "vale4"
  | "quiero"
  | "no_quiero"
  | "mazo";

export interface AudioShout {
  id: string;
  callType: CallType;
  title: string;
  mp3Url: string;
  packName?: string;
}

export const PRESET_SHOUTS: AudioShout[] = [
  { id: "shout-envido-1", callType: "envido", title: "Grito Envido Tradicional", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_cheer.ogg", packName: "Classic Argentine Gritos" },
  { id: "shout-real-envido-1", callType: "real_envido", title: "Real Envido Fuerte", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_yell.ogg", packName: "Classic Argentine Gritos" },
  { id: "shout-falta-envido-1", callType: "falta_envido", title: "Falta Envido Explosivo", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_screaming_shout.ogg", packName: "Classic Argentine Gritos" },
  { id: "shout-truco-1", callType: "truco", title: "TRUCO Clasico", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_hey.ogg", packName: "Classic Argentine Gritos" },
  { id: "shout-retruco-1", callType: "retruco", title: "RE-TRUCO", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_yell.ogg", packName: "Classic Argentine Gritos" },
  { id: "shout-vale4-1", callType: "vale4", title: "VALE 4", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_cheer.ogg", packName: "Classic Argentine Gritos" },
  { id: "shout-quiero-1", callType: "quiero", title: "Quiero", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_laughter.ogg", packName: "Classic Argentine Gritos" },
  { id: "shout-no-quiero-1", callType: "no_quiero", title: "No Quiero", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_sigh.ogg", packName: "Classic Argentine Gritos" },
  { id: "shout-mazo-1", callType: "mazo", title: "Me voy al mazo", mp3Url: "https://actions.google.com/sounds/v1/human_voices/male_sigh.ogg", packName: "Classic Argentine Gritos" },
];

export interface AuthContextType {
  user: User | { id: string; email?: string } | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  decks: DeckTheme[];
  shouts: AudioShout[];
  allUsers: UserProfile[];
  signIn: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUp: (email: string, pass: string, username: string) => Promise<{ error: string | null }>;
  signInAsGuest: (username?: string) => void;
  signOut: () => Promise<void>;
  updateStats: (won: boolean, isVsAI?: boolean, opponentElo?: number) => void;
  updateCustomization: (deckId: string, matUrl: string, opacity: number) => Promise<void>;
  updateCountry: (countryCode: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  updateVictoryShowcase: (image: string, youtube: string, quote: string) => Promise<void>;
  addCredits: (amount: number) => Promise<void>;
  createDeckTheme: (theme: Omit<DeckTheme, "id">) => void;
  updateDeckTheme: (id: string, theme: Omit<DeckTheme, "id">) => void;
  deleteDeckTheme: (id: string) => void;
  createAudioShout: (shout: Omit<AudioShout, "id">) => void;
  updateAudioShout: (id: string, shout: Omit<AudioShout, "id">) => void;
  deleteAudioShout: (id: string) => void;
  playShoutAudio: (callType: CallType) => void;
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
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((u: UserProfile) => u && u.id && !u.id.startsWith("bot-"));
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Initialize Auth state & load global player standings
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Load real profiles for Global Leaderboard
      supabase
        .from("profiles")
        .select("*")
        .order("elo_rating", { ascending: false })
        .then(({ data, error }) => {
          if (data && data.length > 0 && !error) {
            const formatted: UserProfile[] = data.map((d: any) => ({
              id: d.id,
              username: d.username || "Player",
              display_name: d.display_name || d.username || "Player",
              elo_rating: d.elo_rating ?? 1200,
              matches_played: d.matches_played ?? 0,
              matches_won: d.matches_won ?? 0,
              is_guest: false,
              role: d.role || "user",
              is_banned: d.is_banned ?? false,
              selected_deck_id: d.selected_deck_id || "classic-gold",
              custom_mat_url: d.custom_mat_url || PRESET_MATS[0].url,
              mat_opacity: d.mat_opacity ?? 0.85,
              country_code: d.country_code || "",
              credits: d.credits ?? 1000,
            }));
            setAllUsers(formatted);
          }
        });

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
      country_code: "",
      credits: 1000,
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
          credits: data.credits ?? 1000,
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
          credits: 1000,
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

  function updateStats(won: boolean, isVsAI: boolean = false, opponentElo: number = 1200) {
    // CRITICAL: AI matches DO NOT count for rating or win/loss records!
    if (isVsAI || !profile) return;

    // Standard ELO System Calculation (K=32)
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (opponentElo - profile.elo_rating) / 400));
    const actual = won ? 1 : 0;
    const eloDelta = Math.round(K * (actual - expected));
    const newElo = Math.max(100, profile.elo_rating + eloDelta);

    const updated: UserProfile = {
      ...profile,
      matches_played: profile.matches_played + 1,
      matches_won: profile.matches_won + (won ? 1 : 0),
      elo_rating: newElo,
    };

    setProfile(updated);
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === updated.id);
      return exists
        ? prev.map((u) => (u.id === updated.id ? updated : u))
        : [...prev, updated];
    });

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

  async function addCredits(amount: number) {
    if (!profile) return;
    const newCredits = (profile.credits || 0) + amount;
    const updated: UserProfile = {
      ...profile,
      credits: newCredits,
    };
    setProfile(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

    if (updated.is_guest) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    } else if (isSupabaseConfigured && supabase && updated.id) {
      await supabase.from("profiles").update({ credits: newCredits }).eq("id", updated.id);
    }
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

  const SHOUTS_STORAGE_KEY = "truco_custom_audio_shouts";

  const [shouts, setShouts] = useState<AudioShout[]>(() => {
    const saved = localStorage.getItem(SHOUTS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return PRESET_SHOUTS;
  });

  useEffect(() => {
    localStorage.setItem(SHOUTS_STORAGE_KEY, JSON.stringify(shouts));
  }, [shouts]);

  function createAudioShout(shout: Omit<AudioShout, "id">) {
    const newShout: AudioShout = {
      ...shout,
      id: `shout-${Date.now()}`,
    };
    setShouts((prev) => [...prev, newShout]);

    if (isSupabaseConfigured && supabase) {
      supabase.from("audio_shouts").upsert([newShout]);
    }
  }

  function updateAudioShout(id: string, shout: Omit<AudioShout, "id">) {
    const updated: AudioShout = { ...shout, id };
    setShouts((prev) => prev.map((s) => (s.id === id ? updated : s)));

    if (isSupabaseConfigured && supabase) {
      supabase.from("audio_shouts").upsert([updated]);
    }
  }

  function deleteAudioShout(id: string) {
    setShouts((prev) => prev.filter((s) => s.id !== id));
    if (isSupabaseConfigured && supabase) {
      supabase.from("audio_shouts").delete().eq("id", id);
    }
  }

  function playShoutAudio(callType: CallType) {
    const matching = shouts.filter((s) => s.callType === callType);
    if (matching.length === 0) return;
    const chosen = matching[Math.floor(Math.random() * matching.length)];
    if (chosen?.mp3Url) {
      try {
        const audio = new Audio(chosen.mp3Url);
        audio.volume = 0.85;
        audio.play().catch(() => {});
      } catch (e) {
        console.error("Audio playback error:", e);
      }
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
        shouts,
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
        addCredits,
        createDeckTheme,
        updateDeckTheme,
        deleteDeckTheme,
        createAudioShout,
        updateAudioShout,
        deleteAudioShout,
        playShoutAudio,
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
