import type { Score } from "./Score";

export interface Court {
  courtNumber: number;
  homePlayers: string[];
  awayPlayers: string[];
  score?: Score;
}