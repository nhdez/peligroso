// Spanish 40-card deck (8s, 9s, 10s removed), used for Truco Argentino.
export type Suit = "espada" | "basto" | "oro" | "copa";
export const SUITS: Suit[] = ["espada", "basto", "oro", "copa"];

// Ranks present in the 40-card Spanish deck.
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g. "1-espada"
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}-${suit}` });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Truco card power ranking (sin flor), highest first.
 * Index in this array = strength (higher index number returned = stronger card).
 * We return a numeric rank so ties are easy to compare.
 */
const TRUCO_ORDER: string[] = [
  "1-espada", // ancho de espada
  "1-basto", // ancho de basto
  "7-espada",
  "7-oro",
  "3-espada",
  "3-basto",
  "3-oro",
  "3-copa",
  "2-espada",
  "2-basto",
  "2-oro",
  "2-copa",
  "1-oro", // ancho falso
  "1-copa", // ancho falso
  "12-espada",
  "12-basto",
  "12-oro",
  "12-copa",
  "11-espada",
  "11-basto",
  "11-oro",
  "11-copa",
  "10-espada",
  "10-basto",
  "10-oro",
  "10-copa",
  "7-basto", // siete falso
  "7-copa", // siete falso
  "6-espada",
  "6-basto",
  "6-oro",
  "6-copa",
  "5-espada",
  "5-basto",
  "5-oro",
  "5-copa",
  "4-espada",
  "4-basto",
  "4-oro",
  "4-copa",
];

const TRUCO_STRENGTH: Record<string, number> = {};
TRUCO_ORDER.forEach((id, idx) => {
  // Earlier in the list = stronger. Convert to a strength score where higher = stronger.
  TRUCO_STRENGTH[id] = TRUCO_ORDER.length - idx;
});

export function trucoStrength(card: Card): number {
  const s = TRUCO_STRENGTH[card.id];
  if (s === undefined) throw new Error(`Unknown card id ${card.id}`);
  return s;
}

/** Card's face value for Envido purposes (face cards count as 0). */
export function envidoValue(card: Card): number {
  return card.rank <= 7 ? card.rank : 0;
}
