import { Card, envidoValue, trucoStrength } from "./deck.js";

export const WINNING_SCORE = 30;

export type EnvidoCallType = "envido" | "real-envido" | "falta-envido";
export type TrucoCallType = "truco" | "retruco" | "vale4";

/**
 * Best Envido value from a hand of cards (usually 3 cards).
 * Two or more cards of the same suit: sum of the two highest same-suit values + 20.
 * Otherwise: the single highest-value card (0 to 7).
 */
export function calculateEnvido(hand: Card[]): number {
  if (!hand || hand.length === 0) return 0;
  
  const bySuit: Record<string, Card[]> = {};
  for (const c of hand) {
    bySuit[c.suit] = bySuit[c.suit] || [];
    bySuit[c.suit].push(c);
  }

  let best = 0;
  for (const suit of Object.keys(bySuit)) {
    const cards = bySuit[suit];
    if (cards.length >= 2) {
      const values = cards.map(envidoValue).sort((a, b) => b - a);
      const combo = values[0] + values[1] + 20;
      best = Math.max(best, combo);
    }
  }

  if (best === 0) {
    best = Math.max(...hand.map(envidoValue));
  }

  return best;
}

/** Returns valid raise options given the history of Envido calls in current hand. */
export function getValidEnvidoRaises(history: EnvidoCallType[]): EnvidoCallType[] {
  if (history.length === 0) {
    return ["envido", "real-envido", "falta-envido"];
  }

  const lastCall = history[history.length - 1];
  if (lastCall === "falta-envido") return [];

  const envidoCount = history.filter((c) => c === "envido").length;
  const realEnvidoCount = history.filter((c) => c === "real-envido").length;

  const valid: EnvidoCallType[] = [];
  if (envidoCount < 2 && realEnvidoCount === 0) {
    valid.push("envido");
  }
  if (realEnvidoCount < 2) {
    valid.push("real-envido");
  }
  valid.push("falta-envido");

  return valid;
}

/** Points awarded when an Envido call chain is accepted ("Quiero"). */
export function getAcceptedEnvidoPoints(
  history: EnvidoCallType[],
  scores: Record<string, number>
): number {
  if (history.includes("falta-envido")) {
    const leadingScore = Math.max(scores["0"] ?? 0, scores["1"] ?? 0);
    return Math.max(1, WINNING_SCORE - leadingScore);
  }

  let total = 0;
  for (const call of history) {
    if (call === "envido") total += 2;
    else if (call === "real-envido") total += 3;
  }
  return total;
}

/** Points awarded when an Envido call chain is declined ("No Quiero"). */
export function getDeclinedEnvidoPoints(history: EnvidoCallType[]): number {
  if (history.length <= 1) return 1;

  // Sum of all accepted calls before the last rejected raise
  const acceptedHistory = history.slice(0, -1);
  let total = 0;
  for (const call of acceptedHistory) {
    if (call === "envido") total += 2;
    else if (call === "real-envido") total += 3;
  }
  return total || 1;
}

/** Returns the index (within playedCards array) of the strongest card, or null if tied. */
export function resolveTrick(playedCards: Card[]): number | null {
  if (playedCards.length === 0) return null;
  let bestIdx = 0;
  let bestStrength = trucoStrength(playedCards[0]);
  let tied = false;

  for (let i = 1; i < playedCards.length; i++) {
    const s = trucoStrength(playedCards[i]);
    if (s > bestStrength) {
      bestStrength = s;
      bestIdx = i;
      tied = false;
    } else if (s === bestStrength) {
      tied = true;
    }
  }

  return tied ? null : bestIdx;
}

/** Truco points when accepted */
export function getAcceptedTrucoPoints(type: TrucoCallType): number {
  switch (type) {
    case "truco":
      return 2;
    case "retruco":
      return 3;
    case "vale4":
      return 4;
  }
}

/** Truco points when declined */
export function getDeclinedTrucoPoints(type: TrucoCallType): number {
  switch (type) {
    case "truco":
      return 1;
    case "retruco":
      return 2;
    case "vale4":
      return 3;
  }
}

