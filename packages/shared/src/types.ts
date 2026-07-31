import { Card } from "./deck.js";
import { EnvidoCallType, TrucoCallType } from "./rules.js";

export type PlayerID = string; // "0" | "1" | "2" | "3" per boardgame.io convention

export interface TrucoCallState {
  type: TrucoCallType;
  callerID: PlayerID;
  pendingResponderID: PlayerID;
  accepted: boolean | null; // null = pending response
}

export interface EnvidoCallState {
  history: EnvidoCallType[];
  lastCallerID: PlayerID;
  pendingResponderID: PlayerID;
  accepted: boolean | null;
}

export interface EnvidoShowdown {
  winnerID: PlayerID;
  winnerTeam: string;
  points: number;
  playerScores: Record<PlayerID, number>;
  cards: Record<PlayerID, Card[]>;
  reason: string;
}

export interface TrickRecord {
  cards: Record<PlayerID, Card>; // card played by each player this trick
  winnerID: PlayerID | null; // null = tied trick (parda)
}

export interface GameLogMessage {
  id: string;
  text: string;
}

export interface HandNotice {
  id: string;
  title: string;
  message: string;
  type: "atorado" | "mazo" | "envido" | "truco" | "hand_win";
}

export interface DeckTheme {
  id: string;
  name: string;
  description: string;
  cardBackUrl: string;
  cardFaces?: Record<string, string>; // Map of card.id (e.g. "1-espada") -> image URL
}

export type StorageProviderType = "cloudflare-r2" | "aws-s3" | "supabase-storage" | "custom-s3";

export interface ObjectStorageConfig {
  provider: StorageProviderType;
  endpointUrl: string;
  bucketName: string;
  publicCdnDomain: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  isEnabled: boolean;
}



export type HandPhase = "PRIMERA" | "SEGUNDA" | "TERCERA";

export function getHandPhase(tricksCount: number): HandPhase {
  if (tricksCount === 0) return "PRIMERA";
  if (tricksCount === 1) return "SEGUNDA";
  return "TERCERA";
}

export interface DisconnectRecord {
  playerID: PlayerID;
  disconnectedAt: number; // Date.now()
  expiresAt: number; // Date.now() + 60000
}

export interface TrucoGameState {
  numPlayers: 2 | 4;
  deck: Card[];
  hands: Record<PlayerID, Card[]>;
  tableCards: Record<PlayerID, Card[]>; // cards played so far this hand, per player
  tricks: TrickRecord[];
  phase: HandPhase;
  manoID: PlayerID; // first to act this hand
  scores: Record<string, number>; // keyed by team ("0" / "1")
  currentEnvidoCall: EnvidoCallState | null;
  currentTrucoCall: TrucoCallState | null;
  envidoResolved: boolean;
  lastEnvidoShowdown: EnvidoShowdown | null;
  activeNotice: HandNotice | null;
  foldedTeam: string | null; // team that declared "me voy al mazo"
  handOver: boolean;
  winner: string | null;
  logs: GameLogMessage[];
  handNumber: number;
  disconnectedPlayers?: Record<PlayerID, DisconnectRecord | null>;
}


/** Maps a player seat to their team ID. 2-player: each player is their own team. */
export function teamOf(playerID: PlayerID, numPlayers: 2 | 4): string {
  if (numPlayers === 2) return playerID;
  // 4-player: seats 0,2 = team "0"; seats 1,3 = team "1"
  return (Number(playerID) % 2).toString();
}


