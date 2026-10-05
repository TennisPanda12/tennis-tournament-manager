import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/Cards.css";
import type { Match, SubmittedMatch } from "../../types/Match";
import { getCourtWinner } from "../../utils/scoreUtils";
import { supabase } from "../../lib/supabaseClient";
type TeamStanding = {
  team: string;
  wins: number;
  losses: number;
  courtWins: number;
  courtLosses: number;
  setsLost: number;
  gamesLost: number;
  gamesWon: number;
};

const createTeamStanding = (
  team: string
): TeamStanding => ({
  team,
  wins: 0,
  losses: 0,
  courtWins: 0,
  courtLosses: 0,
  setsLost: 0,
  gamesLost: 0,
  gamesWon: 0,
});

function Standings() {
  const { tournamentId } = useParams();
  const [tournamentName, setTournamentName] = useState("");
  const [submittedMatches, setSubmittedMatches] =
  useState<SubmittedMatch[]>([]);

  useEffect(() => {
    async function loadTournament() {
      const { data, error } = await supabase
        .from("tournaments")
        .select("name")
        .eq("id", Number(tournamentId))
        .single();

      if (error) {
        console.error("Error loading tournament:", error);
        return;
      }

      setTournamentName(data.name);
    }

    loadTournament();
  }, [tournamentId]);

    useEffect(() => {
      async function loadSubmittedMatches() {
        const { data: scores, error: scoresError } = await supabase
          .from("match_scores")
          .select(`
            *,
            matches!inner(tournament_id)
          `)
          .eq("matches.tournament_id", Number(tournamentId));

        if (scoresError) {
          console.error("Error loading submitted scores:", scoresError);
          return;
        }

        const { data: matches, error: matchesError } = await supabase
          .from("matches")
          .select(`
            id,
            home_team:teams!matches_home_team_id_fkey(captain),
            away_team:teams!matches_away_team_id_fkey(captain)
          `);

        if (matchesError) {
          console.error("Error loading matches:", matchesError);
          return;
        }

        const formattedMatches: SubmittedMatch[] = scores.map((score) => {
          const match = matches.find(
            (match) => Number(match.id) === Number(score.match_id)
          );

          const homeCaptain =
            (match?.home_team as unknown as { captain: string } | null)
              ?.captain ?? "";

          const awayCaptain =
            (match?.away_team as unknown as { captain: string } | null)
              ?.captain ?? "";

          return {
            matchId: Number(score.match_id),
            homeCaptain,
            awayCaptain,

            court1: {
              set1Home: score.court1_set1_home ?? "",
              set1Away: score.court1_set1_away ?? "",
              set2Home: score.court1_set2_home ?? "",
              set2Away: score.court1_set2_away ?? "",
              tiebreakHome: score.court1_tiebreak_home ?? "",
              tiebreakAway: score.court1_tiebreak_away ?? "",
            },

            court2: {
              set1Home: score.court2_set1_home ?? "",
              set1Away: score.court2_set1_away ?? "",
              set2Home: score.court2_set2_home ?? "",
              set2Away: score.court2_set2_away ?? "",
              tiebreakHome: score.court2_tiebreak_home ?? "",
              tiebreakAway: score.court2_tiebreak_away ?? "",
            },

            court3: {
              set1Home: score.court3_set1_home ?? "",
              set1Away: score.court3_set1_away ?? "",
              set2Home: score.court3_set2_home ?? "",
              set2Away: score.court3_set2_away ?? "",
              tiebreakHome: score.court3_tiebreak_home ?? "",
              tiebreakAway: score.court3_tiebreak_away ?? "",
            },

            homeCourtWins: score.home_court_wins ?? 0,
            awayCourtWins: score.away_court_wins ?? 0,
          };
        });

        setSubmittedMatches(formattedMatches);
      }

      loadSubmittedMatches();

      const channel = supabase
        .channel("standings-match-scores")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "match_scores",
          },
          () => {
            loadSubmittedMatches();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
      }, [tournamentId]);

      const [managedMatches, setManagedMatches] =
  useState<Match[]>([]);

const [tournamentTeams, setTournamentTeams] =
  useState<{ captain: string }[]>([]);

useEffect(() => {
  async function loadTournamentTeams() {
    const { data, error } = await supabase
      .from("tournament_teams")
      .select(`
        team:teams!inner(captain)
      `)
      .eq("tournament_id", Number(tournamentId));

    if (error) {
      console.error("Error loading tournament teams:", error);
      return;
    }

    const formattedTeams = (data || []).map((row) => ({
      captain: (row.team as unknown as { captain: string }).captain,
    }));

    setTournamentTeams(formattedTeams);
  }

  loadTournamentTeams();

  const channel = supabase
    .channel("standings-tournament-teams")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tournament_teams",
      },
      () => {
        loadTournamentTeams();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [tournamentId]);

useEffect(() => {
  async function loadMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(captain),
        away_team:teams!matches_away_team_id_fkey(captain)
      `)
      .eq("tournament_id", Number(tournamentId))
      .order("id");

    if (error) {
      console.error("Error loading matches:", error);
      return;
    }

    const updatedMatches: Match[] = data.map(
      (match) => ({
        id: Number(match.id),
        date: match.date,
        time: match.time,
        location: match.location,
        homeCaptain: match.home_team.captain,
        awayCaptain: match.away_team.captain,
        completed: match.completed,
        tournament_id: match.tournament_id,
        courts: [],
      })
    );

    setManagedMatches(updatedMatches);
  }

  loadMatches();

  const channel = supabase
    .channel("standings-matches")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "matches",
      },
      () => {
        loadMatches();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [tournamentId]);

  const teams = new Map<string, TeamStanding>();
    managedMatches.forEach((match: Match) => {
  if (!teams.has(match.homeCaptain)) {
    teams.set(
      match.homeCaptain,
      createTeamStanding(match.homeCaptain)
    );
  }

  if (!teams.has(match.awayCaptain)) {
    teams.set(
      match.awayCaptain,
      createTeamStanding(match.awayCaptain)
    );
  }
});

tournamentTeams.forEach(
  (team: { captain: string }) => {
    if (!teams.has(team.captain)) {
      teams.set(
        team.captain,
        createTeamStanding(team.captain)
      );
    }
  }
);

  submittedMatches.forEach((match) => {
    if (!teams.has(match.homeCaptain)) {
      teams.set(match.homeCaptain, {
        team: match.homeCaptain,
        wins: 0,
        losses: 0,
        courtWins: 0,
        courtLosses: 0,
        setsLost: 0,
        gamesLost: 0,
        gamesWon: 0,
      });
    }

    if (!teams.has(match.awayCaptain)) {
      teams.set(match.awayCaptain, {
        team: match.awayCaptain,
        wins: 0,
        losses: 0,
        courtWins: 0,
        courtLosses: 0,
        setsLost: 0,
        gamesLost: 0,
        gamesWon: 0,
      });
    }

    const homeTeam = teams.get(match.homeCaptain)!;
    const awayTeam = teams.get(match.awayCaptain)!;

    const courts = [
      match.court1,
      match.court2,
      match.court3,
    ];

    let homeCourtWins = 0;
    let awayCourtWins = 0;

    courts.forEach((court) => {
      const courtWinner = getCourtWinner(court);

      const homeGames =
        Number(court.set1Home || 0) +
        Number(court.set2Home || 0);

      const awayGames =
        Number(court.set1Away || 0) +
        Number(court.set2Away || 0);

      homeTeam.gamesWon += homeGames;
      homeTeam.gamesLost += awayGames;

      awayTeam.gamesWon += awayGames;
      awayTeam.gamesLost += homeGames;

      if (courtWinner === "home") {
        homeCourtWins++;
      } else if (courtWinner === "away") {
        awayCourtWins++;
      }

      if (
        Number(court.set1Home || 0) <
        Number(court.set1Away || 0)
      ) {
        homeTeam.setsLost++;
      } else if (
        Number(court.set1Away || 0) <
        Number(court.set1Home || 0)
      ) {
        awayTeam.setsLost++;
      }

      if (
        Number(court.set2Home || 0) <
        Number(court.set2Away || 0)
      ) {
        homeTeam.setsLost++;
      } else if (
        Number(court.set2Away || 0) <
        Number(court.set2Home || 0)
      ) {
        awayTeam.setsLost++;
      }
    });

    homeTeam.courtWins += homeCourtWins;
    homeTeam.courtLosses += awayCourtWins;

    awayTeam.courtWins += awayCourtWins;
    awayTeam.courtLosses += homeCourtWins;

    if (homeCourtWins > awayCourtWins) {
      homeTeam.wins++;
      awayTeam.losses++;
    } else if (awayCourtWins > homeCourtWins) {
      awayTeam.wins++;
      homeTeam.losses++;
    }
  });

  const standings = Array.from(teams.values()).sort(
    (a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (b.courtWins !== a.courtWins) {
        return b.courtWins - a.courtWins;
      }

      if (a.setsLost !== b.setsLost) {
        return a.setsLost - b.setsLost;
      }

      if (a.gamesLost !== b.gamesLost) {
        return a.gamesLost - b.gamesLost;
      }

      const aGamesWonPercentage =
        a.gamesWon + a.gamesLost === 0
          ? 0
          : a.gamesWon /
            (a.gamesWon + a.gamesLost);

      const bGamesWonPercentage =
        b.gamesWon + b.gamesLost === 0
          ? 0
          : b.gamesWon /
            (b.gamesWon + b.gamesLost);

      return (
        bGamesWonPercentage -
        aGamesWonPercentage
      );
    }
  );

  return (
    <main className="card">
      <h1>{tournamentName || "Tournament Standings"}</h1>

      {standings.length === 0 ? (
        <p>No completed matches yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Court Wins</th>
              <th>Court Losses</th>
              <th>Sets Lost</th>
              <th>Games Lost</th>
              <th>Games Won %</th>
            </tr>
          </thead>

          <tbody>
            {standings.map((team, index) => (
              <tr key={team.team}>
                <td>{index + 1}</td>
                <td>{team.team}</td>
                <td>{team.wins}</td>
                <td>{team.losses}</td>
                <td>{team.courtWins}</td>
                <td>{team.courtLosses}</td>
                <td>{team.setsLost}</td>
                <td>{team.gamesLost}</td>
                <td>
                  {team.gamesWon + team.gamesLost === 0
                    ? "0%"
                    : `${(
                        (team.gamesWon /
                          (team.gamesWon + team.gamesLost)) *
                        100
                      ).toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

export default Standings;