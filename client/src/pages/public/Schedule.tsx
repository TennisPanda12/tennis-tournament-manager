import "../../styles/Cards.css";
import type { Match } from "../../types/Match";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";


function Schedule() {
  const { tournamentId } = useParams();
  const [matchCourts, setMatchCourts] = useState<
    {
      id: number;
      match_id: number;
      court_number: number;
      home_player_1: string | null;
      home_player_2: string | null;
      away_player_1: string | null;
      away_player_2: string | null;
    }[]
  >([]);
  const [managedMatches, setManagedMatches] =
    useState<Match[]>([]);

  const [submittedMatches, setSubmittedMatches] = useState<
  {
    matchId: number;
    court1: {
      set1Home: string;
      set1Away: string;
      set2Home: string;
      set2Away: string;
      tiebreakHome: string;
      tiebreakAway: string;
    };
    court2: {
      set1Home: string;
      set1Away: string;
      set2Home: string;
      set2Away: string;
      tiebreakHome: string;
      tiebreakAway: string;
    };
    court3: {
      set1Home: string;
      set1Away: string;
      set2Home: string;
      set2Away: string;
      tiebreakHome: string;
      tiebreakAway: string;
    };
  }[]
>([]);

useEffect(() => {
  async function loadSubmittedMatches() {
    const { data, error } = await supabase
      .from("match_scores")
      .select("*");

    if (error) {
      console.error(
        "Error loading submitted matches:",
        error
      );
      return;
    }

    const formattedMatches = data.map((score) => ({
      matchId: Number(score.match_id),

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
    }));

    setSubmittedMatches(formattedMatches);
  }

  loadSubmittedMatches();

  const channel = supabase
    .channel("schedule-match-scores")
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
}, []);

  useEffect(() => {
  async function loadSchedule() {
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(`
        id,
        date,
        time,
        location,
        completed,
        tournament_id,
        home_team:teams!matches_home_team_id_fkey(captain),
        away_team:teams!matches_away_team_id_fkey(captain)
      `)
      .eq("tournament_id", Number(tournamentId))
      .order("date")
      .order("time");

    if (matchesError) {
      console.error("Error loading matches:", matchesError);
      return;
    }

    const { data: courts, error: courtsError } = await supabase
      .from("match_courts")
      .select("*")
      .order("match_id")
      .order("court_number");

    if (courtsError) {
      console.error("Error loading match courts:", courtsError);
      return;
    }

    const formattedMatches: Match[] = matches.map((match) => {
      const matchId = Number(match.id);

      const matchCourtsForMatch = courts.filter(
        (court) => Number(court.match_id) === matchId
      );

      const formattedCourts = [1, 2, 3].map((courtNumber) => {
        const savedCourt = matchCourtsForMatch.find(
          (court) => Number(court.court_number) === courtNumber
        );

        return {
          courtNumber,
          homePlayers: savedCourt
            ? [
                savedCourt.home_player_1,
                savedCourt.home_player_2,
              ].filter(Boolean) as string[]
            : [],
          awayPlayers: savedCourt
            ? [
                savedCourt.away_player_1,
                savedCourt.away_player_2,
              ].filter(Boolean) as string[]
            : [],
          score: undefined,
        };
      });

      return {
        id: matchId,
        date: match.date,
        time: match.time,
        location: match.location,
        completed: match.completed,
        tournament_id: match.tournament_id,
        homeCaptain:
          (match.home_team as unknown as { captain: string } | null)
            ?.captain ?? "",
        awayCaptain:
          (match.away_team as unknown as { captain: string } | null)
            ?.captain ?? "",
        courts: formattedCourts,
      };
    });

    setManagedMatches(formattedMatches);

    setMatchCourts(
      courts.map((court) => ({
        id: Number(court.id),
        match_id: Number(court.match_id),
        court_number: Number(court.court_number),
        home_player_1: court.home_player_1,
        home_player_2: court.home_player_2,
        away_player_1: court.away_player_1,
        away_player_2: court.away_player_2,
      }))
    );
  }

  loadSchedule();

  const matchesChannel = supabase
    .channel("schedule-matches")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "matches",
      },
      () => {
        loadSchedule();
      }
    )
    .subscribe();

  const courtsChannel = supabase
    .channel("schedule-match-courts")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "match_courts",
      },
      () => {
        loadSchedule();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(matchesChannel);
    supabase.removeChannel(courtsChannel);
  };
}, [tournamentId]);

  return (
    <main className="card">
      <h1>Match Schedule</h1>

      <p>View upcoming league matches.</p>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Location</th>
            <th>Home</th>
            <th>Visitor</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>
          {managedMatches.map((match) => (
            <tr key={match.id}>
              <td>{match.date}</td>
              <td>{match.time}</td>
              <td>{match.location}</td>
              <td>{match.homeCaptain}</td>
              <td>{match.awayCaptain}</td>

              <td>
                {match.completed ? "Completed" : "Upcoming"}
              </td>

              <td>
                <Link to={`/tournament/${match.tournament_id}/match/${match.id}`}>
                  View Match
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {managedMatches.map((match) => {
        const submittedMatch = submittedMatches.find(
          (submittedMatch) =>
            submittedMatch.matchId === match.id
        );

        return (
          <div key={match.id}>
            <h2>
              {match.homeCaptain} vs {match.awayCaptain}
            </h2>

            {match.courts.map((court) => (
              <div key={court.courtNumber}>
                <h3>
                  Court {court.courtNumber}
                </h3>

                <p>
                  {(() => {
                    const savedCourt = matchCourts.find(
                      (savedCourt) =>
                        savedCourt.match_id === match.id &&
                        savedCourt.court_number === court.courtNumber
                    );

                    const homePlayers = savedCourt
                      ? [savedCourt.home_player_1, savedCourt.home_player_2].filter(Boolean)
                      : court.homePlayers;

                    const awayPlayers = savedCourt
                      ? [savedCourt.away_player_1, savedCourt.away_player_2].filter(Boolean)
                      : court.awayPlayers;

                    return (
                      <>
                        {homePlayers.join(" & ") || "TBD"}
                        {" vs "}
                        {awayPlayers.join(" & ") || "TBD"}
                      </>
                    );
                  })()}
                </p>

                {(() => {
                  const score = submittedMatch
                    ? submittedMatch[
                        `court${court.courtNumber}` as
                          | "court1"
                          | "court2"
                          | "court3"
                      ]
                    : undefined;

                  if (!score) {
                    return null;
                  }

                  return (
                    <div>
                      <p>
                        Set 1: {score.set1Home} -{" "}
                        {score.set1Away}
                      </p>

                      <p>
                        Set 2: {score.set2Home} -{" "}
                        {score.set2Away}
                      </p>

                      <p>
                        Tiebreak:{" "}
                        {score.tiebreakHome} -{" "}
                        {score.tiebreakAway}
                      </p>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        );
      })}
    </main>
  );
}

export default Schedule;