import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/Cards.css";
import CourtScoreForm from "../../components/matches/CourtScoreForm";
import type { Match } from "../../types/Match";
import { getMatchResult } from "../../utils/scoreUtils";
import { supabase } from "../../lib/supabaseClient";

function SubmitScores() {

  const { tournamentId, matchId } = useParams();

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    useEffect(() => {
    async function checkSubmitted() {
      if (!matchId) return;

      const { data, error } = await supabase
        .from("match_scores")
        .select("id")
        .eq("match_id", Number(matchId))
        .maybeSingle();

      if (error) {
        console.error("Error checking submitted scores:", error);
        return;
      }

      setAlreadySubmitted(!!data);
    }

    checkSubmitted();
  }, [matchId]);

  const [match, setMatch] = useState<Match | null>(null);
    useEffect(() => {
      async function loadMatch() {
        if (!matchId) return;

        const { data, error } = await supabase
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
          .eq("id", Number(matchId))
          .eq("tournament_id", Number(tournamentId))
          .single();

        if (error) {
          console.error("Error loading match:", error);
          return;
        }

        setMatch({
          id: Number(data.id),
          date: data.date,
          time: data.time,
          location: data.location,
          completed: data.completed,
          tournament_id: data.tournament_id,
          homeCaptain:
            (data.home_team as unknown as { captain: string } | null)?.captain ?? "",
          awayCaptain:
            (data.away_team as unknown as { captain: string } | null)?.captain ?? "",
          courts: [],
        });
      }

      loadMatch();
    }, [matchId, tournamentId]);

const [matchCourts, setMatchCourts] = useState<
  {
    court_number: number;
    home_player_1: string | null;
    home_player_2: string | null;
    away_player_1: string | null;
    away_player_2: string | null;
  }[]
>([]);

useEffect(() => {
  async function loadMatchCourts() {
    if (!matchId) return;

    const { data, error } = await supabase
      .from("match_courts")
      .select(
        "court_number, home_player_1, home_player_2, away_player_1, away_player_2"
      )
      .eq("match_id", Number(matchId))
      .order("court_number");

    if (error) {
      console.error("Error loading court players:", error);
      return;
    }

    setMatchCourts(data);
  }

  loadMatchCourts();
}, [matchId]);


const [court1Score, setCourt1Score] = useState({
  set1Home: "",
  set1Away: "",
  set2Home: "",
  set2Away: "",
  tiebreakHome: "",
  tiebreakAway: "",
});

const [court2Score, setCourt2Score] = useState({
  set1Home: "",
  set1Away: "",
  set2Home: "",
  set2Away: "",
  tiebreakHome: "",
  tiebreakAway: "",
});

const [court3Score, setCourt3Score] = useState({
  set1Home: "",
  set1Away: "",
  set2Home: "",
  set2Away: "",
  tiebreakHome: "",
  tiebreakAway: "",
});

  if (!match) {
  return (
    <main className="card">
      <h1>Match Not Found</h1>
      <p>We could not find this match.</p>
    </main>
  );
}

if (alreadySubmitted) {
  return (
    <main className="card">
      <h1>Match Completed</h1>
      <h2>
        {match.homeCaptain} vs {match.awayCaptain}
      </h2>
      <p>
        The scores for this match have already been
        submitted and can no longer be edited.
      </p>
    </main>
  );
}


const getMatchWinner = () => {
  const result = getMatchResult([
    court1Score,
    court2Score,
    court3Score,
  ]);

  if (result.homeCourtWins >= 2) {
    return `${match.homeCaptain} wins ${result.homeCourtWins}-${result.awayCourtWins}`;
  }

  if (result.awayCourtWins >= 2) {
    return `${match.awayCaptain} wins ${result.awayCourtWins}-${result.homeCourtWins}`;
  }

  return "Match winner not determined";
};

const handleSubmit = async () => {
  const scores = [
    court1Score,
    court2Score,
    court3Score,
  ];

  const incompleteCourt = scores.some((score) => {
    return (
      score.set1Home === "" ||
      score.set1Away === "" ||
      score.set2Home === "" ||
      score.set2Away === ""
    );
  });

  if (incompleteCourt) {
    alert("Please complete all three courts before submitting.");
    return;
  }

  const result = getMatchResult([
  court1Score,
  court2Score,
  court3Score,
]);

const { error: scoreError } = await supabase
  .from("match_scores")
  .upsert(
    {
      match_id: Number(matchId),

      court1_set1_home: court1Score.set1Home,
      court1_set1_away: court1Score.set1Away,
      court1_set2_home: court1Score.set2Home,
      court1_set2_away: court1Score.set2Away,
      court1_tiebreak_home: court1Score.tiebreakHome,
      court1_tiebreak_away: court1Score.tiebreakAway,

      court2_set1_home: court2Score.set1Home,
      court2_set1_away: court2Score.set1Away,
      court2_set2_home: court2Score.set2Home,
      court2_set2_away: court2Score.set2Away,
      court2_tiebreak_home: court2Score.tiebreakHome,
      court2_tiebreak_away: court2Score.tiebreakAway,

      court3_set1_home: court3Score.set1Home,
      court3_set1_away: court3Score.set1Away,
      court3_set2_home: court3Score.set2Home,
      court3_set2_away: court3Score.set2Away,
      court3_tiebreak_home: court3Score.tiebreakHome,
      court3_tiebreak_away: court3Score.tiebreakAway,

      home_court_wins: result.homeCourtWins,
      away_court_wins: result.awayCourtWins,
    },
    { onConflict: "match_id" }
  );

if (scoreError) {
  console.error("Error saving scores:", scoreError);
  alert("There was an error saving the scores.");
  return;
}

const { data: completedMatch, error: matchError } = await supabase
  .from("matches")
  .update({ completed: true })
  .eq("id", Number(matchId))
  .select("id, completed")
  .single();

if (matchError || !completedMatch) {
  console.error("Error completing match:", matchError);
  alert(
    "Scores were saved, but the match could not be marked completed."
  );
  return;
}


setAlreadySubmitted(true);
alert("Match scores saved!");
};



  return (
    <main className="card">
      <h1>Submit Match Scores</h1>

      <h2>
        {match.homeCaptain} vs {match.awayCaptain}
      </h2>

      <p>
        {match.date} • {match.time} • {match.location}
      </p>

      <hr />

      <CourtScoreForm
        courtNumber={1}
        homeCaptain={match.homeCaptain}
        awayCaptain={match.awayCaptain}
        homePlayers={[
          matchCourts.find((court) => court.court_number === 1)?.home_player_1 || "",
          matchCourts.find((court) => court.court_number === 1)?.home_player_2 || "",
        ]}
        awayPlayers={[
          matchCourts.find((court) => court.court_number === 1)?.away_player_1 || "",
          matchCourts.find((court) => court.court_number === 1)?.away_player_2 || "",
        ]}
        onScoreChange={setCourt1Score}
      />

      <CourtScoreForm
        courtNumber={2}
        homeCaptain={match.homeCaptain}
        awayCaptain={match.awayCaptain}
        homePlayers={[
          matchCourts.find((court) => court.court_number === 2)?.home_player_1 || "",
          matchCourts.find((court) => court.court_number === 2)?.home_player_2 || "",
        ]}
        awayPlayers={[
          matchCourts.find((court) => court.court_number === 2)?.away_player_1 || "",
          matchCourts.find((court) => court.court_number === 2)?.away_player_2 || "",
        ]}
        onScoreChange={setCourt2Score}
      />

      <CourtScoreForm
        courtNumber={3}
        homeCaptain={match.homeCaptain}
        awayCaptain={match.awayCaptain}
        homePlayers={[
          matchCourts.find((court) => court.court_number === 3)?.home_player_1 || "",
          matchCourts.find((court) => court.court_number === 3)?.home_player_2 || "",
        ]}
        awayPlayers={[
          matchCourts.find((court) => court.court_number === 3)?.away_player_1 || "",
          matchCourts.find((court) => court.court_number === 3)?.away_player_2 || "",
        ]}
        onScoreChange={setCourt3Score}
      />

    <h2>Match Result</h2>

    <p>{getMatchWinner()}</p>

    <button onClick={handleSubmit}>
      Submit Scores
    </button>

    </main>
  );
}

export default SubmitScores;