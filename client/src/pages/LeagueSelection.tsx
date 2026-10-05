import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Cards.css";
import { supabase } from "../lib/supabaseClient";

type League = {
  id: number;
  name: string;
};

function LeagueSelection() {
  const navigate = useNavigate();

  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeagues() {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name")
        .order("id");

      if (error) {
        console.error("Error loading leagues:", error);
        setLoading(false);
        return;
      }

      setLeagues(data || []);
      setLoading(false);
    }

    loadLeagues();
  }, []);

  if (loading) {
    return (
      <main className="card">
        <h1>Select a League</h1>
        <p>Loading leagues...</p>
      </main>
    );
  }

  return (
    <main className="card">
      <h1>Select a League</h1>

      <p>
        Choose the league you want to view.
      </p>

      {leagues.map((league) => (
        <button
          key={league.id}
          type="button"
          onClick={() => {
            navigate(`/league/${league.id}/tournaments`);
          }}
        >
          {league.name}
        </button>
      ))}
    </main>
  );
}

export default LeagueSelection;