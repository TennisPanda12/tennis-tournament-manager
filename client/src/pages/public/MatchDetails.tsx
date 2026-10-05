import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Match } from "../../types/Match";
import { getMatchResult } from "../../utils/scoreUtils";
import { supabase } from "../../lib/supabaseClient";

function MatchDetails() {
  const { tournamentId, matchId } = useParams();

  const [supabaseCourtAssignments, setSupabaseCourtAssignments] =
    useState<
      Record<
        number,
        {
          court1: {
            homePlayers: string[];
            awayPlayers: string[];
          };
          court2: {
            homePlayers: string[];
            awayPlayers: string[];
          };
          court3: {
            homePlayers: string[];
            awayPlayers: string[];
          };
        }
      >
    >({});

  const [managedMatches, setManagedMatches] = useState<Match[]>([]);

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

    const updatedMatches: Match[] = data.map((match) => ({
      id: Number(match.id),
      date: match.date,
      time: match.time,
      location: match.location,
      homeCaptain: match.home_team.captain,
      awayCaptain: match.away_team.captain,
      completed: match.completed,
      tournament_id: match.tournament_id,
      courts: [],
    }));

    setManagedMatches(updatedMatches);
  }

  loadMatches();

  const channel = supabase
    .channel(`match-details-matches-${matchId}`)
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
}, [matchId, tournamentId]);

const match = managedMatches.find(
  (match: { id: number }) =>
    match.id === Number(matchId)
);

  const courtAssignments = supabaseCourtAssignments;

    useEffect(() => {
    async function loadCourtAssignments() {
      if (!matchId) {
        return;
      }

      const { data, error } = await supabase
        .from("match_courts")
        .select("*")
        .eq("match_id", Number(matchId));

      if (error) {
        console.error(
          "Error loading court assignments:",
          error
        );
        return;
      }

      const assignments: Record<
        number,
        {
          court1: {
            homePlayers: string[];
            awayPlayers: string[];
          };
          court2: {
            homePlayers: string[];
            awayPlayers: string[];
          };
          court3: {
            homePlayers: string[];
            awayPlayers: string[];
          };
        }
      > = {};

      assignments[Number(matchId)] = {
        court1: {
          homePlayers: [],
          awayPlayers: [],
        },
        court2: {
          homePlayers: [],
          awayPlayers: [],
        },
        court3: {
          homePlayers: [],
          awayPlayers: [],
        },
      };

      data.forEach((court) => {
        const courtKey =
          `court${court.court_number}` as
            | "court1"
            | "court2"
            | "court3";

        assignments[Number(matchId)][courtKey] = {
          homePlayers: [
            court.home_player_1 || "",
            court.home_player_2 || "",
          ],
          awayPlayers: [
            court.away_player_1 || "",
            court.away_player_2 || "",
          ],
        };
      });

      setSupabaseCourtAssignments(assignments);
    }

        loadCourtAssignments();

    const channel = supabase
      .channel(`match-details-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_courts",
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          loadCourtAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

const [submittedMatch, setSubmittedMatch] = useState<{
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
} | null>(null);

useEffect(() => {
  async function loadSubmittedScore() {
    if (!matchId) return;

    const { data, error } = await supabase
      .from("match_scores")
      .select("*")
      .eq("match_id", Number(matchId))
      .maybeSingle();

    if (error) {
      console.error("Error loading submitted score:", error);
      return;
    }

    if (!data) {
      setSubmittedMatch(null);
      return;
    }

    setSubmittedMatch({
      court1: {
        set1Home: data.court1_set1_home ?? "",
        set1Away: data.court1_set1_away ?? "",
        set2Home: data.court1_set2_home ?? "",
        set2Away: data.court1_set2_away ?? "",
        tiebreakHome: data.court1_tiebreak_home ?? "",
        tiebreakAway: data.court1_tiebreak_away ?? "",
      },
      court2: {
        set1Home: data.court2_set1_home ?? "",
        set1Away: data.court2_set1_away ?? "",
        set2Home: data.court2_set2_home ?? "",
        set2Away: data.court2_set2_away ?? "",
        tiebreakHome: data.court2_tiebreak_home ?? "",
        tiebreakAway: data.court2_tiebreak_away ?? "",
      },
      court3: {
        set1Home: data.court3_set1_home ?? "",
        set1Away: data.court3_set1_away ?? "",
        set2Home: data.court3_set2_home ?? "",
        set2Away: data.court3_set2_away ?? "",
        tiebreakHome: data.court3_tiebreak_home ?? "",
        tiebreakAway: data.court3_tiebreak_away ?? "",
      },
    });
  }

  loadSubmittedScore();

  const channel = supabase
    .channel(`match-score-details-${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "match_scores",
        filter: `match_id=eq.${matchId}`,
      },
      () => {
        loadSubmittedScore();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [matchId]);

if (!match) {
  return (
    <main className="card">
      <h1>Match Not Found</h1>
      <p>We couldn't find that match.</p>
    </main>
  );
}

const isSubmitted = !!submittedMatch;

const result = submittedMatch
  ? getMatchResult([
      submittedMatch.court1,
      submittedMatch.court2,
      submittedMatch.court3,
    ])
  : getMatchResult([
      match.courts[0]?.score ?? {
        set1Home: "",
        set1Away: "",
        set2Home: "",
        set2Away: "",
        tiebreakHome: "",
        tiebreakAway: "",
      },
      match.courts[1]?.score ?? {
        set1Home: "",
        set1Away: "",
        set2Home: "",
        set2Away: "",
        tiebreakHome: "",
        tiebreakAway: "",
      },
      match.courts[2]?.score ?? {
        set1Home: "",
        set1Away: "",
        set2Home: "",
        set2Away: "",
        tiebreakHome: "",
        tiebreakAway: "",
      },
    ]);

const displayedCourts = isSubmitted
  ? [
      {
        courtNumber: 1,
        homePlayers: match.courts[0]?.homePlayers ?? [],
        awayPlayers: match.courts[0]?.awayPlayers ?? [],
        score: submittedMatch.court1,
      },
      {
        courtNumber: 2,
        homePlayers: match.courts[1]?.homePlayers ?? [],
        awayPlayers: match.courts[1]?.awayPlayers ?? [],
        score: submittedMatch.court2,
      },
      {
        courtNumber: 3,
        homePlayers: match.courts[2]?.homePlayers ?? [],
        awayPlayers: match.courts[2]?.awayPlayers ?? [],
        score: submittedMatch.court3,
      },
    ]
  : match.courts.length > 0
  ? match.courts
  : [
      {
        courtNumber: 1,
        homePlayers: [],
        awayPlayers: [],
      },
      {
        courtNumber: 2,
        homePlayers: [],
        awayPlayers: [],
      },
      {
        courtNumber: 3,
        homePlayers: [],
        awayPlayers: [],
      },
    ];

  return (
    <main className="card">
      <h1>
        {match.homeCaptain} vs {match.awayCaptain}
      </h1>

      <p>
        {match.date} • {match.time}
      </p>

      <p>{match.location}</p>

      <div>
        <h2>Match Status</h2>

        <p>
          {match.completed
            ? `${match.homeCaptain} ${result.homeCourtWins} - ${result.awayCourtWins} ${match.awayCaptain}`
            : "Upcoming"}
        </p>
      </div>

      {!match.completed && !isSubmitted ? (
        <div>
          <Link to={`/tournament/${tournamentId}/match/submit/${match.id}`}>
            <button>Submit Match Scores</button>
          </Link>
        </div>
      ) : (
        <div>
          <Link to={`/tournament/${tournamentId}/submitted-match/${match.id}`}>
            <button>View Submitted Scores</button>
          </Link>
        </div>
      )}

      <div>
        {displayedCourts.map((court) => (
            <div key={court.courtNumber}>
            <h2>Court {court.courtNumber}</h2>

            <p>
              {courtAssignments[match.id]?.[
                `court${court.courtNumber}` as
                  | "court1"
                  | "court2"
                  | "court3"
              ]?.homePlayers.join(" & ") || "TBD"}
              {" vs "}
              {courtAssignments[match.id]?.[
                `court${court.courtNumber}` as
                  | "court1"
                  | "court2"
                  | "court3"
              ]?.awayPlayers.join(" & ") || "TBD"}
            </p>

            {court.score && (
            <div>
                <p>
                Set 1: {court.score.set1Home} - {court.score.set1Away}
                </p>

                <p>
                Set 2: {court.score.set2Home} - {court.score.set2Away}
                </p>

                <p>
                Tiebreak: {court.score.tiebreakHome} -{" "}
                {court.score.tiebreakAway}
                </p>
            </div>
            )}

            </div>
          ))}
        </div>

    </main>
  );
}

export default MatchDetails;