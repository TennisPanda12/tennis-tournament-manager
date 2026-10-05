import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/Cards.css";
import { supabase } from "../../lib/supabaseClient";

type Team = {
  id: number;
  captain: string;
  players: string[];
};

function Teams() {
  const { tournamentId } = useParams();
  const [tournamentName, setTournamentName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);

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
    const loadTeams = async () => {
      const { data: tournamentTeams, error: tournamentTeamsError } =
        await supabase
          .from("tournament_teams")
          .select("team_id")
          .eq("tournament_id", Number(tournamentId));

      if (tournamentTeamsError) {
        console.error(
          "Error loading tournament teams:",
          tournamentTeamsError
        );
        return;
      }

      const teamIds = (tournamentTeams || []).map(
        (tournamentTeam) => tournamentTeam.team_id
      );

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, captain")
        .in("id", teamIds)
        .order("captain");

      if (teamError) {
        console.error("Error loading teams:", teamError);
        return;
      }

      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("name, team_id")
        .order("name");

      if (playerError) {
        console.error("Error loading players:", playerError);
        return;
      }

      const formattedTeams = (teamData || []).map((team) => ({
        id: team.id,
        captain: team.captain,
        players: (playerData || [])
          .filter((player) => player.team_id === team.id)
          .map((player) => player.name),
      }));

      setTeams(formattedTeams);
    };

    loadTeams();

    const teamChannel = supabase
      .channel("teams-page-teams")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        () => {
          loadTeams();
        }
      )
      .subscribe();

    const playerChannel = supabase
      .channel("teams-page-players")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        () => {
          loadTeams();
        }
      )
      .subscribe();

      const tournamentTeamChannel = supabase
        .channel("teams-page-tournament-teams")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tournament_teams",
          },
          () => {
            loadTeams();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(tournamentTeamChannel);
    };
  }, [tournamentId]);

  return (
    <main className="card">
      <h1>{tournamentName || "Tournament Teams"}</h1>
      {teams.map((team) => (
        <div className="card" key={team.id}>
          <h2>{team.captain}</h2>

          <p>
            <strong>Captain:</strong> {team.captain}
          </p>

          <h3>Players</h3>

          {team.players.length > 0 ? (
            <ul>
              {team.players.map((player) => (
                <li key={player}>{player}</li>
              ))}
            </ul>
          ) : (
            <p>No players added yet.</p>
          )}
        </div>
      ))}
    </main>
  );
}

export default Teams;