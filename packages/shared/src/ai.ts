import { TrucoGameState, PlayerID, teamOf } from "./types.js";
import { calculateEnvido, getValidEnvidoRaises, EnvidoCallType, TrucoCallType } from "./rules.js";
import { trucoStrength } from "./deck.js";

export type BotMove =
  | { type: "playCard"; cardId: string }
  | { type: "callEnvido"; callType: EnvidoCallType }
  | { type: "respondEnvido"; accept: boolean; raiseType?: EnvidoCallType }
  | { type: "callTruco"; callType: TrucoCallType }
  | { type: "respondTruco"; accept: boolean }
  | { type: "irseAlMazo" };

export function getBotMove(G: TrucoGameState, botID: PlayerID = "1"): BotMove | null {
  const hand = G.hands[botID] ?? [];
  if (G.winner !== null || G.handOver) return null;

  const botTeam = teamOf(botID, G.numPlayers);

  // 1. Pending Envido response
  if (G.currentEnvidoCall && G.currentEnvidoCall.accepted === null) {
    if (G.currentEnvidoCall.pendingResponderID !== botID) return null;

    const allHandCards = [...hand, ...(G.tableCards[botID] || [])];
    const botEnvido = calculateEnvido(allHandCards);
    const history = G.currentEnvidoCall.history;
    const validRaises = getValidEnvidoRaises(history);

    if (botEnvido >= 31 && validRaises.includes("falta-envido") && history.length === 1) {
      return { type: "respondEnvido", accept: true, raiseType: "falta-envido" };
    }

    if (botEnvido >= 28 && validRaises.includes("real-envido") && !history.includes("real-envido")) {
      return { type: "respondEnvido", accept: true, raiseType: "real-envido" };
    }

    if (botEnvido >= 26) {
      return { type: "respondEnvido", accept: true };
    }

    if (botEnvido >= 24 && !history.includes("real-envido") && !history.includes("falta-envido")) {
      return { type: "respondEnvido", accept: true };
    }

    return { type: "respondEnvido", accept: false };
  }

  // 2. Pending Truco response
  if (G.currentTrucoCall && G.currentTrucoCall.accepted === null) {
    if (G.currentTrucoCall.pendingResponderID !== botID) return null;

    const maxStrength = hand.length > 0 ? Math.max(...hand.map(trucoStrength)) : 0;
    const avgStrength = hand.length > 0 ? hand.reduce((s, c) => s + trucoStrength(c), 0) / hand.length : 0;

    if (maxStrength >= 36 || avgStrength >= 18) {
      return { type: "respondTruco", accept: true };
    }

    return { type: "respondTruco", accept: false };
  }

  // 3. Initiate Envido on bot's turn in Trick 1
  if (!G.envidoResolved && G.tricks.length === 0 && (G.tableCards[botID]?.length ?? 0) === 0) {
    const botEnvido = calculateEnvido(hand);
    if (botEnvido >= 28 && !G.currentEnvidoCall) {
      const callType: EnvidoCallType = botEnvido >= 31 ? "real-envido" : "envido";
      return { type: "callEnvido", callType };
    }
  }

  // 4. Initiate Truco if holding top card
  if (!G.currentTrucoCall && hand.length > 0) {
    const maxStrength = Math.max(...hand.map(trucoStrength));
    if (maxStrength >= 38 && Math.random() < 0.5) {
      return { type: "callTruco", callType: "truco" };
    }
  }

  // 5. Play Card
  if (hand.length === 0) return null;

  const currentTrickIdx = G.tricks.length;
  const botCardThisTrick = (G.tableCards[botID] || [])[currentTrickIdx];

  // Already played card for this trick
  if (botCardThisTrick) return null;

  // Find max card played so far this trick by opposing team
  let maxOpponentStrength = 0;
  for (let p = 0; p < G.numPlayers; p++) {
    const pid = String(p);
    if (teamOf(pid, G.numPlayers) !== botTeam) {
      const oppCard = (G.tableCards[pid] || [])[currentTrickIdx];
      if (oppCard) {
        maxOpponentStrength = Math.max(maxOpponentStrength, trucoStrength(oppCard));
      }
    }
  }

  if (maxOpponentStrength > 0) {
    // Following: find lowest card that beats highest opponent card
    const winningCards = hand
      .filter((c) => trucoStrength(c) > maxOpponentStrength)
      .sort((a, b) => trucoStrength(a) - trucoStrength(b));

    if (winningCards.length > 0) {
      return { type: "playCard", cardId: winningCards[0].id };
    }

    // Cannot win: play lowest card
    const lowestCards = [...hand].sort((a, b) => trucoStrength(a) - trucoStrength(b));
    return { type: "playCard", cardId: lowestCards[0].id };
  } else {
    // Leading trick or partner leads:
    if (currentTrickIdx === 0) {
      const sorted = [...hand].sort((a, b) => trucoStrength(a) - trucoStrength(b));
      const chosen = sorted.length > 1 ? sorted[1] : sorted[0];
      return { type: "playCard", cardId: chosen.id };
    } else {
      const sorted = [...hand].sort((a, b) => trucoStrength(b) - trucoStrength(a));
      return { type: "playCard", cardId: sorted[0].id };
    }
  }
}
