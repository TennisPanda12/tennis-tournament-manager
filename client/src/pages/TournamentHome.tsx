import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Cards.css";
import { supabase } from "../lib/supabaseClient";

type Tournament = {
  id: number;
  league_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

type League = {
  id: number;
  name: string;
};

function TournamentHome() {
  const navigate = useNavigate();
  const { tournamentId } = useParams();

  const [tournament, setTournament] =
    useState<Tournament | null>(null);

  const [league, setLeague] =
    useState<League | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournament() {
      if (!tournamentId) {
        setLoading(false);
        return;
      }

      const numericTournamentId = Number(tournamentId);

      const { data: tournamentData, error: tournamentError } =
        await supabase
          .from("tournaments")
          .select(
            "id, league_id, name, start_date, end_date"
          )
          .eq("id", numericTournamentId)
          .single();

      if (tournamentError) {
        console.error(
          "Error loading tournament:",
          tournamentError
        );
        setLoading(false);
        return;
      }

      const { data: leagueData, error: leagueError } =
        await supabase
          .from("leagues")
          .select("id, name")
          .eq("id", tournamentData.league_id)
          .single();

      if (leagueError) {
        console.error(
          "Error loading league:",
          leagueError
        );
      }

      setTournament(tournamentData);
      setLeague(leagueData);
      setLoading(false);
    }

    loadTournament();
  }, [tournamentId]);

  if (loading) {
    return (
      <main className="card">
        <h1>Loading tournament...</h1>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="card">
        <h1>Tournament Not Found</h1>

        <button
          type="button"
          onClick={() => navigate("/leagues")}
        >
          Back to Leagues
        </button>
      </main>
    );
  }

  return (
    <main className="card">
      <h1>{tournament.name}</h1>

      {league && (
        <h2>{league.name}</h2>
      )}

      {tournament.start_date && (
        <p>
          <strong>Start:</strong>{" "}
          {tournament.start_date}
        </p>
      )}

      {tournament.end_date && (
        <p>
          <strong>End:</strong>{" "}
          {tournament.end_date}
        </p>
      )}

      <hr />

      <h2>Tournament</h2>

      <p>
        This is your selected tournament.
      </p>

      <button
        type="button"
        onClick={() => navigate(`/tournament/${tournament.id}/schedule`)}
        >
        Schedule
      </button>

      <button
        type="button"
        onClick={() => navigate(`/tournament/${tournament.id}/standings`)}
      >
        Standings
      </button>

      <button
        type="button"
        onClick={() => navigate(`/tournament/${tournament.id}/teams`)}
      >
        Teams
      </button>

      <hr />

      <button
        type="button"
        onClick={() => navigate("/leagues")}
      >
        Switch League
      </button>
    </main>
  );
}

export default TournamentHome;