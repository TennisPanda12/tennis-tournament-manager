import type { Court } from "./Court";

export interface Match {
  id: number;
  date: string;
  time: string;
  location: string;
  homeCaptain: string;
  awayCaptain: string;
  completed: boolean;
  tournament_id: number | null;
  courts: Court[];
}

export type SubmittedCourtScore = {
  set1Home: string;
  set1Away: string;
  set2Home: string;
  set2Away: string;
  tiebreakHome: string;
  tiebreakAway: string;
};

export type SubmittedMatch = {
  matchId: number;
  homeCaptain: string;
  awayCaptain: string;
  court1: SubmittedCourtScore;
  court2: SubmittedCourtScore;
  court3: SubmittedCourtScore;
  homeCourtWins: number;
  awayCourtWins: number;
};