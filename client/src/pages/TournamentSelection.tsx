import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Cards.css";
import { supabase } from "../lib/supabaseClient";

type League = {
  id: number;
  name: string;
};

type Tournament = {
  id: number;
  league_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

function TournamentSelection() {
  const navigate = useNavigate();
  const { leagueId } = useParams();

  const [league, setLeague] = useState<League | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeagueAndTournaments() {
      if (!leagueId) {
        setLoading(false);
        return;
      }

      const numericLeagueId = Number(leagueId);

      const { data: leagueData, error: leagueError } =
        await supabase
          .from("leagues")
          .select("id, name")
          .eq("id", numericLeagueId)
          .single();

      if (leagueError) {
        console.error("Error loading league:", leagueError);
        setLoading(false);
        return;
      }

      const { data: tournamentData, error: tournamentError } =
        await supabase
          .from("tournaments")
          .select(
            "id, league_id, name, start_date, end_date"
          )
          .eq("league_id", numericLeagueId)
          .order("start_date")
          .order("id");

      if (tournamentError) {
        console.error(
          "Error loading tournaments:",
          tournamentError
        );
        setLoading(false);
        return;
      }

      setLeague(leagueData);
      setTournaments(tournamentData || []);
      setLoading(false);
    }

    loadLeagueAndTournaments();
  }, [leagueId]);

  if (loading) {
    return (
      <main className="card">
        <h1>Select a Tournament</h1>
        <p>Loading tournaments...</p>
      </main>
    );
  }

  return (
    <main className="card">
      <h1>Select a Tournament</h1>

      {league && (
        <h2>{league.name}</h2>
      )}

      {tournaments.length === 0 ? (
        <p>
          No tournaments have been created for this league yet.
        </p>
      ) : (
        tournaments.map((tournament) => (
          <button
            key={tournament.id}
            type="button"
            onClick={async () => {
              console.log("Selected tournament:", tournament);
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                navigate(`/tournament/${tournament.id}`);
                return;
              }

              const { data: profile, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

              if (error || !profile) {
                console.error("Error loading user profile:", error);
                navigate(`/tournament/${tournament.id}`);
                return;
              }

              if (profile.role === "captain") {
                navigate(`/captain?tournamentId=${tournament.id}`);
                return;
              }

              if (profile.role === "player") {
                navigate(`/player?tournamentId=${tournament.id}`);
                return;
              }

              navigate(`/tournament/${tournament.id}`);
            }}
          >
            {tournament.name}
          </button>
        ))
      )}
    </main>
  );
}

export default TournamentSelection;