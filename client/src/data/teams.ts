export type Team = {
  id?: number;
  captain: string;
  players: string[];
};

export const teams: Team[] = [
  {
    captain: "Smith",
    players: ["Smith Player 1", "Smith Player 2"],
  },
  {
    captain: "Patel",
    players: ["Patel Player 1", "Patel Player 2"],
  },
];