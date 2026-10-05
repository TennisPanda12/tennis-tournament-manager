import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/Cards.css";
import { supabase } from "../../lib/supabaseClient";

function PlayerDashboard() {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");

console.log("Player tournamentId:", tournamentId);
  const [tournamentName, setTournamentName] =
  useState("");

  useEffect(() => {
    async function loadTournament() {
      if (!tournamentId) {
        return;
      }

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

  return (
    <main className="card">
      <h1>Player Dashboard</h1>

      <p>
        Welcome to your player dashboard.
      </p>

      {tournamentName && (
        <p>
          Tournament: <strong>{tournamentName}</strong>
        </p>
      )}

      <hr />

      <h2>League Fee</h2>

      <p>
        Your league fee can be paid through the payment page.
      </p>

      <Link to="/player/payment">
        <button type="button">Pay League Fee</button>
      </Link>

      <hr />

        <h2>Tournament</h2>

        <div>
          <Link to={`/tournament/${tournamentId}/schedule`}>
            <button type="button">View Schedule</button>
          </Link>
        </div>

        <div>
          <Link to={`/tournament/${tournamentId}/standings`}>
            <button type="button">View Standings</button>
          </Link>
        </div>

        <div>
          <Link to={`/tournament/${tournamentId}/teams`}>
            <button type="button">View Teams</button>
          </Link>
        </div>

    </main>
  );
}

export default PlayerDashboard;