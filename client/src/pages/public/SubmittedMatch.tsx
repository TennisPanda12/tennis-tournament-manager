import { Link, useParams } from "react-router-dom";
import "../../styles/Cards.css";
import type { SubmittedMatch } from "../../types/Match";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function SubmittedMatchPage() {
    const { tournamentId, matchId } = useParams();

const [match, setMatch] = useState<SubmittedMatch | null>(null);

useEffect(() => {
  async function loadSubmittedMatch() {
    if (!matchId) return;

    const { data, error } = await supabase
      .from("match_scores")
      .select(`
        *,
        matches (
          date,
          time,
          location,
          tournament_id,
          home_team:teams!matches_home_team_id_fkey(captain),
          away_team:teams!matches_away_team_id_fkey(captain)
        )
      `)
      .eq("match_id", Number(matchId))
      .maybeSingle();

    if (error) {
      console.error("Error loading submitted match:", error);
      return;
    }

    if (!data) {
      setMatch(null);
      return;
    }

    setMatch({
      matchId: Number(matchId),
      homeCaptain: data.matches.home_team.captain,
      awayCaptain: data.matches.away_team.captain,
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
      homeCourtWins: data.home_court_wins ?? 0,
      awayCourtWins: data.away_court_wins ?? 0,
    });
  }

  loadSubmittedMatch();

  const channel = supabase
    .channel(`submitted-match-${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "match_scores",
        filter: `match_id=eq.${matchId}`,
      },
      () => {
        loadSubmittedMatch();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [matchId, tournamentId]);

  if (!match) {
    return (
      <main className="card">
        <h1>No Submitted Match</h1>
        <p>No match scores have been submitted yet.</p>
      </main>
    );
  }

  return (
    <main className="card">
      <h1>Submitted Match</h1>

      <Link to={`/tournament/${tournamentId}/schedule`}>
        <button>Back to Schedule</button>
      </Link>

      <h2>
        {match.homeCaptain} vs {match.awayCaptain}
      </h2>

      <p>Match ID: {matchId}</p>

      <hr />

      <h2>Court 1</h2>

      <p>
        Set 1: {match.court1.set1Home} -{" "}
        {match.court1.set1Away}
      </p>

      <p>
        Set 2: {match.court1.set2Home} -{" "}
        {match.court1.set2Away}
      </p>

      <p>
        Tiebreak: {match.court1.tiebreakHome} -{" "}
        {match.court1.tiebreakAway}
      </p>

      <h2>Court 2</h2>

      <p>
        Set 1: {match.court2.set1Home} -{" "}
        {match.court2.set1Away}
      </p>

      <p>
        Set 2: {match.court2.set2Home} -{" "}
        {match.court2.set2Away}
      </p>

      <p>
        Tiebreak: {match.court2.tiebreakHome} -{" "}
        {match.court2.tiebreakAway}
      </p>

      <h2>Court 3</h2>

      <p>
        Set 1: {match.court3.set1Home} -{" "}
        {match.court3.set1Away}
      </p>

      <p>
        Set 2: {match.court3.set2Home} -{" "}
        {match.court3.set2Away}
      </p>

      <p>
        Tiebreak: {match.court3.tiebreakHome} -{" "}
        {match.court3.tiebreakAway}
      </p>
    </main>
  );
}

export default SubmittedMatchPage;