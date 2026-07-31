import type { Game } from "boardgame.io";
import { buildDeck, shuffle, Card } from "./deck.js";
import {
  calculateEnvido,
  getAcceptedEnvidoPoints,
  getDeclinedEnvidoPoints,
  getAcceptedTrucoPoints,
  getDeclinedTrucoPoints,
  getValidEnvidoRaises,
  resolveTrick,
  WINNING_SCORE,
  EnvidoCallType,
  TrucoCallType,
} from "./rules.js";
import { TrucoGameState, teamOf, PlayerID, getHandPhase } from "./types.js";

function dealHands(numPlayers: 2 | 4): { deck: Card[]; hands: Record<string, Card[]> } {
  const deck = shuffle(buildDeck());
  const hands: Record<string, Card[]> = {};
  for (let p = 0; p < numPlayers; p++) {
    hands[String(p)] = deck.splice(0, 3);
  }
  return { deck, hands };
}

function otherPlayer(playerID: string, numPlayers: number = 2): string {
  return String((Number(playerID) + 1) % numPlayers);
}

function addLog(G: TrucoGameState, text: string) {
  G.logs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    text,
  });
  if (G.logs.length > 30) G.logs.pop();
}

function resetForNextHand(G: TrucoGameState) {
  const nextMano = otherPlayer(G.manoID, G.numPlayers);
  const { deck, hands } = dealHands(G.numPlayers);
  const tableCards: Record<string, Card[]> = {};
  for (let p = 0; p < G.numPlayers; p++) tableCards[String(p)] = [];

  G.deck = deck;
  G.hands = hands;
  G.tableCards = tableCards;
  G.tricks = [];
  G.phase = "PRIMERA";
  G.manoID = nextMano;
  G.currentEnvidoCall = null;
  G.currentTrucoCall = null;
  G.envidoResolved = false;
  G.lastEnvidoShowdown = null;
  G.foldedTeam = null;
  G.handOver = false;
  G.handNumber += 1;

  addLog(G, `--- Hand ${G.handNumber} dealt. Player ${nextMano} is Mano (Phase: PRIMERA) ---`);
}


function evaluateHandWinner(G: TrucoGameState): PlayerID | null {
  if (G.tricks.length === 0) return null;

  const t1 = G.tricks[0]?.winnerID;
  const t2 = G.tricks[1]?.winnerID;
  const t3 = G.tricks[2]?.winnerID;

  // Case 1: Someone wins 2 tricks
  const wins: Record<string, number> = { "0": 0, "1": 0 };
  for (const tr of G.tricks) {
    if (tr.winnerID !== null) wins[tr.winnerID] = (wins[tr.winnerID] || 0) + 1;
  }
  if (wins["0"] >= 2) return "0";
  if (wins["1"] >= 2) return "1";

  // Case 2: Trick 1 tied (parda) -> winner of Trick 2 wins hand
  if (t1 === null && t2 !== undefined && t2 !== null) {
    return t2;
  }

  // Case 3: Trick 1 & Trick 2 tied -> winner of Trick 3 wins hand
  if (t1 === null && t2 === null && t3 !== undefined && t3 !== null) {
    return t3;
  }

  // Case 4: Trick 1 won by X, Trick 2 tied -> X wins hand
  if (t1 !== null && t2 === null) {
    return t1;
  }

  // Case 5: All 3 tricks tied -> Mano wins hand
  if (G.tricks.length === 3 && t1 === null && t2 === null && t3 === null) {
    return G.manoID;
  }

  return null;
}

import { trucoStrength } from "./deck.js";

function checkEarlyHandWinner(G: TrucoGameState): { winnerID: PlayerID; reason: string } | null {
  const currentTrickIndex = G.tricks.length;
  const playedCounts: Record<string, number> = {};
  for (let p = 0; p < G.numPlayers; p++) {
    const pid = String(p);
    playedCounts[pid] = (G.tableCards[pid] || []).length;
  }

  const p0Count = playedCounts["0"] ?? 0;
  const p1Count = playedCounts["1"] ?? 0;

  let leadPlayer: PlayerID | null = null;
  let followPlayer: PlayerID | null = null;

  if (p0Count === currentTrickIndex + 1 && p1Count === currentTrickIndex) {
    leadPlayer = "0";
    followPlayer = "1";
  } else if (p1Count === currentTrickIndex + 1 && p0Count === currentTrickIndex) {
    leadPlayer = "1";
    followPlayer = "0";
  } else {
    return null;
  }

  const leadCards = G.tableCards[leadPlayer];
  const leadCard = leadCards[leadCards.length - 1];
  if (!leadCard) return null;

  const leadStrength = trucoStrength(leadCard);
  const followHand = G.hands[followPlayer] || [];
  if (followHand.length === 0) return null;

  const maxFollowStrength = Math.max(...followHand.map(trucoStrength));

  // Trick 2 Lead
  if (currentTrickIndex === 1) {
    const t1Winner = G.tricks[0]?.winnerID;

    // Case 1: leadPlayer won Trick 1
    if (t1Winner === leadPlayer) {
      if (maxFollowStrength <= leadStrength) {
        return {
          winnerID: leadPlayer,
          reason: `Player ${leadPlayer} won Trick 1 and played ${leadCard.rank} de ${leadCard.suit}. Player ${followPlayer} cannot beat it (Atorado).`,
        };
      }
    }

    // Case 2: Trick 1 was tied (Parda)
    if (t1Winner === null) {
      if (maxFollowStrength < leadStrength) {
        return {
          winnerID: leadPlayer,
          reason: `Trick 1 tied (Parda). Player ${leadPlayer} played ${leadCard.rank} de ${leadCard.suit} in Trick 2. Player ${followPlayer} cannot beat or tie it (Atorado).`,
        };
      }
    }
  }

  // Trick 3 Lead
  if (currentTrickIndex === 2) {
    const t1Winner = G.tricks[0]?.winnerID;
    const t2Winner = G.tricks[1]?.winnerID;

    if (t1Winner === leadPlayer && t2Winner === followPlayer) {
      if (maxFollowStrength <= leadStrength) {
        return {
          winnerID: leadPlayer,
          reason: `Player ${leadPlayer} played ${leadCard.rank} de ${leadCard.suit} in Trick 3. Player ${followPlayer} cannot beat it (Atorado).`,
        };
      }
    }

    if (t1Winner === followPlayer && t2Winner === leadPlayer) {
      if (maxFollowStrength < leadStrength) {
        return {
          winnerID: leadPlayer,
          reason: `Player ${leadPlayer} played ${leadCard.rank} de ${leadCard.suit} in Trick 3. Player ${followPlayer} cannot beat it (Atorado).`,
        };
      }
    }

    if (t1Winner === null && t2Winner === null) {
      const isManoLead = G.manoID === leadPlayer;
      if (isManoLead && maxFollowStrength <= leadStrength) {
        return {
          winnerID: leadPlayer,
          reason: `Tricks 1 & 2 tied. Player ${leadPlayer} (Mano) played ${leadCard.rank} de ${leadCard.suit} in Trick 3. Player ${followPlayer} cannot beat it (Atorado).`,
        };
      }
      if (!isManoLead && maxFollowStrength < leadStrength) {
        return {
          winnerID: leadPlayer,
          reason: `Tricks 1 & 2 tied. Player ${leadPlayer} played ${leadCard.rank} de ${leadCard.suit} in Trick 3. Player ${followPlayer} cannot beat or tie it (Atorado).`,
        };
      }
    }
  }

  return null;
}

export const TrucoGame: Game<TrucoGameState> = {
  name: "truco-argentino",

  setup: ({ ctx }) => {
    const numPlayers = (ctx.numPlayers as 2 | 4) ?? 2;
    const { deck, hands } = dealHands(numPlayers);
    const tableCards: Record<string, Card[]> = {};
    for (let p = 0; p < numPlayers; p++) tableCards[String(p)] = [];

    const initialState: TrucoGameState = {
      numPlayers,
      deck,
      hands,
      tableCards,
      tricks: [],
      phase: "PRIMERA",
      manoID: "0",
      scores: { "0": 0, "1": 0 },
      currentEnvidoCall: null,
      currentTrucoCall: null,
      envidoResolved: false,
      lastEnvidoShowdown: null,
      activeNotice: null,
      foldedTeam: null,
      handOver: false,
      winner: null,
      logs: [],
      handNumber: 1,
    };

    addLog(initialState, "Game started! Player 0 is Mano (Phase: PRIMERA).");
    return initialState;
  },

  turn: {
    order: {
      first: ({ G }) => {
        // Active call pending response?
        if (G.currentEnvidoCall && G.currentEnvidoCall.accepted === null) {
          return Number(G.currentEnvidoCall.pendingResponderID);
        }
        if (G.currentTrucoCall && G.currentTrucoCall.accepted === null) {
          return Number(G.currentTrucoCall.pendingResponderID);
        }
        return Number(G.manoID);
      },
      next: ({ G, ctx }) => {
        // If an active call response is pending, target the pending responder
        if (G.currentEnvidoCall && G.currentEnvidoCall.accepted === null) {
          return Number(G.currentEnvidoCall.pendingResponderID);
        }
        if (G.currentTrucoCall && G.currentTrucoCall.accepted === null) {
          return Number(G.currentTrucoCall.pendingResponderID);
        }

        // Current trick in progress?
        const currentTrickPlayed = Object.values(G.tableCards).map(
          (cards) => cards[G.tricks.length]
        ).filter(Boolean).length;

        if (currentTrickPlayed === 1) {
          // Second player in trick
          return Number(otherPlayer(ctx.currentPlayer, G.numPlayers));
        }

        // Trick just finished: lead player for next trick is the winner of previous trick
        if (G.tricks.length > 0) {
          const lastWinner = G.tricks[G.tricks.length - 1].winnerID;
          if (lastWinner !== null) return Number(lastWinner);
          // If previous trick was tied (parda), player who led previous trick goes first
          return Number(G.manoID);
        }

        return Number(otherPlayer(ctx.currentPlayer, G.numPlayers));
      },
    },
  },

  moves: {
    playCard: ({ G, ctx, events, playerID }, cardId: string) => {
      // Cannot play card if call pending response
      if (G.currentEnvidoCall?.accepted === null || G.currentTrucoCall?.accepted === null) {
        return;
      }

      const hand = G.hands[playerID!];
      const idx = hand.findIndex((c) => c.id === cardId);
      if (idx === -1) return;

      const [card] = hand.splice(idx, 1);
      G.tableCards[playerID!].push(card);
      addLog(G, `Player ${playerID} played ${card.rank} de ${card.suit}`);

      // Check if both players played for current trick
      const allPlayed = Object.values(G.tableCards).every(
        (cards) => cards.length === G.tricks.length + 1
      );

      if (allPlayed) {
        const order = Object.keys(G.tableCards);
        const playedThisTrick = order.map((p) => G.tableCards[p][G.tricks.length]);
        const winnerIdx = resolveTrick(playedThisTrick);
        const winnerID = winnerIdx === null ? null : order[winnerIdx];

        G.tricks.push({
          cards: Object.fromEntries(order.map((p, i) => [p, playedThisTrick[i]])),
          winnerID,
        });

        G.phase = getHandPhase(G.tricks.length);

        if (winnerID === null) {
          addLog(G, `Trick ${G.tricks.length} tied (Parda)! Phase: ${G.phase}`);
        } else {
          addLog(G, `Player ${winnerID} won Trick ${G.tricks.length}. Phase: ${G.phase}`);
        }

        // Check if hand is won
        const handWinner = evaluateHandWinner(G);
        if (handWinner !== null) {
          const winningTeam = teamOf(handWinner, G.numPlayers);
          const points = G.currentTrucoCall?.accepted
            ? getAcceptedTrucoPoints(G.currentTrucoCall.type)
            : 1;

          G.scores[winningTeam] += points;
          addLog(
            G,
            `Player ${handWinner} won the hand! Team ${winningTeam} awarded +${points} points.`
          );

          G.activeNotice = {
            id: `${Date.now()}-${Math.random()}`,
            title: `🏆 PLAYER ${handWinner} WON THE HAND!`,
            message: `Team ${winningTeam} won 2 tricks and was awarded +${points} point(s).`,
            type: "hand_win",
          };

          // Check if match won
          if (G.scores[winningTeam] >= WINNING_SCORE) {
            G.winner = winningTeam;
            G.handOver = true;
          } else {
            resetForNextHand(G);
            events.endTurn({ next: G.manoID });
            return;
          }
        } else {
          const nextLead = winnerID !== null ? winnerID : G.manoID;
          events.endTurn({ next: nextLead });
          return;
        }
      } else {
        // Check Early Hand Winner ("Atorado" detection)
        const earlyWin = checkEarlyHandWinner(G);
        if (earlyWin !== null) {
          const winningTeam = teamOf(earlyWin.winnerID, G.numPlayers);
          const points = G.currentTrucoCall?.accepted
            ? getAcceptedTrucoPoints(G.currentTrucoCall.type)
            : 1;

          G.scores[winningTeam] += points;
          addLog(
            G,
            `Player ${earlyWin.winnerID} won the hand! (${earlyWin.reason}) Team ${winningTeam} awarded +${points} points.`
          );

          G.activeNotice = {
            id: `${Date.now()}-${Math.random()}`,
            title: `⚡ PLAYER ${earlyWin.winnerID} WON HAND (ATORADO)!`,
            message: earlyWin.reason,
            type: "atorado",
          };

          if (G.scores[winningTeam] >= WINNING_SCORE) {
            G.winner = winningTeam;
            G.handOver = true;
          } else {
            resetForNextHand(G);
            events.endTurn({ next: G.manoID });
            return;
          }
        } else {
          const nextPlayer = otherPlayer(playerID!, G.numPlayers);
          events.endTurn({ next: nextPlayer });
          return;
        }
      }
    },

    callEnvido: ({ G, events, playerID }, type: EnvidoCallType) => {
      // Must be in PRIMERA phase (trick 1) and Envido not yet resolved
      if (G.phase !== "PRIMERA" || G.envidoResolved) return;

      const currentHistory = G.currentEnvidoCall?.history ?? [];
      const validRaises = getValidEnvidoRaises(currentHistory);

      if (!validRaises.includes(type)) return;

      const responder = otherPlayer(playerID!, G.numPlayers);
      G.currentEnvidoCall = {
        history: [...currentHistory, type],
        lastCallerID: playerID!,
        pendingResponderID: responder,
        accepted: null,
      };

      const callName =
        type === "envido" ? "Envido" : type === "real-envido" ? "Real Envido" : "Falta Envido";
      addLog(G, `Player ${playerID} called ${callName}!`);
      events.endTurn({ next: responder });
    },

    respondEnvido: (
      { G, events, playerID },
      payload: { accept: boolean; raiseType?: EnvidoCallType }
    ) => {
      if (!G.currentEnvidoCall || G.currentEnvidoCall.accepted !== null) return;
      if (playerID !== G.currentEnvidoCall.pendingResponderID) return;

      const history = G.currentEnvidoCall.history;

      // Handle Re-raise
      if (payload.raiseType) {
        const validRaises = getValidEnvidoRaises(history);
        if (!validRaises.includes(payload.raiseType)) return;

        const responder = otherPlayer(playerID!, G.numPlayers);
        G.currentEnvidoCall.history.push(payload.raiseType);
        G.currentEnvidoCall.lastCallerID = playerID!;
        G.currentEnvidoCall.pendingResponderID = responder;

        const raiseName =
          payload.raiseType === "envido"
            ? "Envido"
            : payload.raiseType === "real-envido"
            ? "Real Envido"
            : "Falta Envido";
        addLog(G, `Player ${playerID} raised to ${raiseName}!`);
        events.endTurn({ next: responder });
        return;
      }

      // Handle Decline ("No Quiero")
      if (!payload.accept) {
        G.currentEnvidoCall.accepted = false;
        G.envidoResolved = true;

        const callerTeam = teamOf(G.currentEnvidoCall.lastCallerID, G.numPlayers);
        const points = getDeclinedEnvidoPoints(history);
        G.scores[callerTeam] += points;

        addLog(
          G,
          `Player ${playerID} said "No Quiero" to Envido. Team ${callerTeam} awarded +${points} point(s).`
        );

        G.activeNotice = {
          id: `${Date.now()}-${Math.random()}`,
          title: "🚫 NO QUIERO (ENVIDO)",
          message: `Player ${playerID} declined Envido. Team ${callerTeam} awarded +${points} point(s).`,
          type: "envido",
        };

        if (G.scores[callerTeam] >= WINNING_SCORE) {
          G.winner = callerTeam;
        }

        G.currentEnvidoCall = null;
        events.endTurn();
        return;
      }

      // Handle Accept ("Quiero")
      G.currentEnvidoCall.accepted = true;
      G.envidoResolved = true;

      const points = getAcceptedEnvidoPoints(history, G.scores);

      // Compute Envido values for both players
      const playerScores: Record<string, number> = {};
      const playerCards: Record<string, Card[]> = {};

      for (let p = 0; p < G.numPlayers; p++) {
        const pid = String(p);
        const allHandCards = [...G.hands[pid], ...(G.tableCards[pid] || [])];
        playerCards[pid] = allHandCards;
        playerScores[pid] = calculateEnvido(allHandCards);
      }

      const p0Score = playerScores["0"] ?? 0;
      const p1Score = playerScores["1"] ?? 0;

      let winningPlayer = "0";
      let reason = "";

      if (p0Score > p1Score) {
        winningPlayer = "0";
        reason = `Player 0 has ${p0Score} vs Player 1's ${p1Score}`;
      } else if (p1Score > p0Score) {
        winningPlayer = "1";
        reason = `Player 1 has ${p1Score} vs Player 0's ${p0Score}`;
      } else {
        // Tie: Mano wins
        winningPlayer = G.manoID;
        reason = `Tied at ${p0Score}! Player ${G.manoID} wins as Mano.`;
      }

      const winningTeam = teamOf(winningPlayer, G.numPlayers);
      G.scores[winningTeam] += points;

      G.lastEnvidoShowdown = {
        winnerID: winningPlayer,
        winnerTeam: winningTeam,
        points,
        playerScores,
        cards: playerCards,
        reason,
      };

      addLog(
        G,
        `Envido Showdown! ${reason}. Team ${winningTeam} wins +${points} points!`
      );

      G.activeNotice = {
        id: `${Date.now()}-${Math.random()}`,
        title: "📢 ENVIDO SHOWDOWN!",
        message: `${reason}. Team ${winningTeam} awarded +${points} points!`,
        type: "envido",
      };

      if (G.scores[winningTeam] >= WINNING_SCORE) {
        G.winner = winningTeam;
      }

      G.currentEnvidoCall = null;
      events.endTurn();
    },

    callTruco: ({ G, events, playerID }, type: TrucoCallType) => {
      if (G.currentTrucoCall?.accepted === null) return; // Pending call already exists

      // Validate sequence: truco -> retruco -> vale4
      if (!G.currentTrucoCall && type !== "truco") return;
      if (G.currentTrucoCall?.type === "truco" && type !== "retruco") return;
      if (G.currentTrucoCall?.type === "retruco" && type !== "vale4") return;

      const responder = otherPlayer(playerID!, G.numPlayers);
      G.currentTrucoCall = {
        type,
        callerID: playerID!,
        pendingResponderID: responder,
        accepted: null,
      };

      const callLabel =
        type === "truco" ? "Truco" : type === "retruco" ? "Re-truco" : "Vale 4";
      addLog(G, `Player ${playerID} called ${callLabel}!`);
      events.endTurn({ next: responder });
    },

    respondTruco: ({ G, events, playerID }, accepted: boolean) => {
      if (!G.currentTrucoCall || G.currentTrucoCall.accepted !== null) return;
      if (playerID !== G.currentTrucoCall.pendingResponderID) return;

      G.currentTrucoCall.accepted = accepted;

      if (!accepted) {
        const callerTeam = teamOf(G.currentTrucoCall.callerID, G.numPlayers);
        const points = getDeclinedTrucoPoints(G.currentTrucoCall.type);
        G.scores[callerTeam] += points;

        addLog(
          G,
          `Player ${playerID} said "No Quiero" to ${G.currentTrucoCall.type}. Team ${callerTeam} awarded +${points} point(s).`
        );

        G.activeNotice = {
          id: `${Date.now()}-${Math.random()}`,
          title: `🚫 NO QUIERO (${G.currentTrucoCall.type.toUpperCase()})`,
          message: `Player ${playerID} declined ${G.currentTrucoCall.type}. Team ${callerTeam} awarded +${points} point(s).`,
          type: "truco",
        };

        if (G.scores[callerTeam] >= WINNING_SCORE) {
          G.winner = callerTeam;
        } else {
          resetForNextHand(G);
          events.endTurn({ next: G.manoID });
          return;
        }
      } else {
        const points = getAcceptedTrucoPoints(G.currentTrucoCall.type);
        addLog(
          G,
          `Player ${playerID} accepted ${G.currentTrucoCall.type}! Hand value is now ${points} points.`
        );
        events.endTurn();
      }
    },

    irseAlMazo: ({ G, events, playerID }) => {
      const foldingTeam = teamOf(playerID!, G.numPlayers);
      const opponentTeam = foldingTeam === "0" ? "1" : "0";

      let points = 1;
      if (G.currentTrucoCall) {
        points = G.currentTrucoCall.accepted
          ? getAcceptedTrucoPoints(G.currentTrucoCall.type)
          : getDeclinedTrucoPoints(G.currentTrucoCall.type);
      }

      G.foldedTeam = foldingTeam;
      G.scores[opponentTeam] += points;

      addLog(
        G,
        `Player ${playerID} went to the mazo ("Me voy al mazo"). Team ${opponentTeam} awarded +${points} point(s).`
      );

      G.activeNotice = {
        id: `${Date.now()}-${Math.random()}`,
        title: "🏳️ ME VOY AL MAZO!",
        message: `Player ${playerID} folded ("Me voy al mazo"). Team ${opponentTeam} awarded +${points} point(s).`,
        type: "mazo",
      };

      if (G.scores[opponentTeam] >= WINNING_SCORE) {
        G.winner = opponentTeam;
      } else {
        resetForNextHand(G);
        events.endTurn({ next: G.manoID });
      }
    },
  },


  endIf: ({ G }) => {
    if (G.winner !== null) {
      return { winner: G.winner };
    }
    return undefined;
  },
};

