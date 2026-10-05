import { useEffect, useState } from "react";
import "../../styles/Cards.css";
import type { SubmittedMatch, Match } from "../../types/Match";
import { type Team } from "../../data/teams";
import { supabase } from "../../lib/supabaseClient";

function AdminDashboard() {

  const [managedTeams, setManagedTeams] = useState<Team[]>([]);

  const [tournaments, setTournaments] = useState<
  {
    id: number;
    league_id: number;
    name: string;
    start_date: string | null;
    end_date: string | null;
  }[]
>([]);

const [leagues, setLeagues] = useState<
  {
    id: number;
    name: string;
  }[]
>([]);

const [newTournamentLeague, setNewTournamentLeague] = useState("");
const [newTournamentName, setNewTournamentName] = useState("");
const [newTournamentStartDate, setNewTournamentStartDate] = useState("");
const [newTournamentEndDate, setNewTournamentEndDate] = useState("");
const [editingTournamentId, setEditingTournamentId] =
  useState<number | null>(null);

const [editedTournamentLeague, setEditedTournamentLeague] =
  useState("");

const [editedTournamentName, setEditedTournamentName] =
  useState("");

const [editedTournamentStartDate, setEditedTournamentStartDate] =
  useState("");

const [editedTournamentEndDate, setEditedTournamentEndDate] =
  useState("");

useEffect(() => {
  async function loadTeamsAndPlayers() {
    const { data: teamsData, error: teamsError } =
      await supabase
        .from("teams")
        .select("*")
        .order("id");

    if (teamsError) {
      console.error(
        "Error loading teams:",
        teamsError
      );
      return;
    }

    const { data: playersData, error: playersError } =
      await supabase
        .from("players")
        .select("*")
        .order("id");

    if (playersError) {
      console.error(
        "Error loading players:",
        playersError
      );
      return;
    }

    const updatedTeams: Team[] = teamsData.map(
      (team) => ({
        id: team.id,
        captain: team.captain,
        players: playersData
          .filter(
            (player) =>
              player.team_id === team.id
          )
          .map((player) => player.name),
      })
    );

    setManagedTeams(updatedTeams);
  }

  loadTeamsAndPlayers();

  const channel = supabase
    .channel("admin-teams-players")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "teams",
      },
      () => {
        loadTeamsAndPlayers();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
      },
      () => {
        loadTeamsAndPlayers();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

useEffect(() => {
  async function loadLeaguesAndTournaments() {
    const { data: leaguesData, error: leaguesError } =
      await supabase
        .from("leagues")
        .select("id, name")
        .order("id");

    if (leaguesError) {
      console.error("Error loading leagues:", leaguesError);
      return;
    }

    const { data: tournamentsData, error: tournamentsError } =
      await supabase
        .from("tournaments")
        .select("id, league_id, name, start_date, end_date")
        .order("start_date")
        .order("id");

    if (tournamentsError) {
      console.error(
        "Error loading tournaments:",
        tournamentsError
      );
      return;
    }

    setLeagues(leaguesData || []);
    setTournaments(tournamentsData || []);
  }

  loadLeaguesAndTournaments();

  const channel = supabase
    .channel("admin-leagues-tournaments")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "leagues",
      },
      () => {
        loadLeaguesAndTournaments();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tournaments",
      },
      () => {
        loadLeaguesAndTournaments();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

const [managedMatches, setManagedMatches] = useState<Match[]>([]);

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

useEffect(() => {
  async function loadMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(captain),
        away_team:teams!matches_away_team_id_fkey(captain)
      `)
      .order("id");

    if (error) {
      console.error(
        "Error loading matches:",
        error
      );
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
    .channel("admin-matches")
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
}, []);

useEffect(() => {
  async function loadMatchCourts() {
    const { data, error } = await supabase
      .from("match_courts")
      .select("*")
      .order("match_id")
      .order("court_number");

    if (error) {
      console.error(
        "Error loading match courts:",
        error
      );
      return;
    }

    setMatchCourts(
      data.map((court) => ({
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

  loadMatchCourts();

  const channel = supabase
    .channel("admin-match-courts")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "match_courts",
      },
      () => {
        loadMatchCourts();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
  }, []);

const [newTeamName, setNewTeamName] = useState("");

const [newPlayerNames, setNewPlayerNames] = useState<
  Record<string, string>
>({});

const [assignTeamId, setAssignTeamId] = useState("");
const [assignTournamentId, setAssignTournamentId] = useState("");
const [assignedTeams, setAssignedTeams] = useState<
  { team_id: number }[]
>([]);
const [removeTeamId, setRemoveTeamId] = useState("");
const [removeTournamentId, setRemoveTournamentId] = useState("");

useEffect(() => {
  async function loadRemoveTeams() {
    if (!removeTournamentId) {
      setAssignedTeams([]);
      return;
    }

    const { data, error } = await supabase
      .from("tournament_teams")
      .select("team_id")
      .eq("tournament_id", Number(removeTournamentId));

    if (error) {
      console.error(
        "Error loading assigned teams:",
        error
      );
      setAssignedTeams([]);
      return;
    }

    setAssignedTeams(data || []);
  }

  loadRemoveTeams();
}, [removeTournamentId]);

const [assignedTeamIds, setAssignedTeamIds] = useState<number[]>([]);


const [editingPlayer, setEditingPlayer] = useState<{
  teamCaptain: string;
  playerName: string;
} | null>(null);

const [editingTeam, setEditingTeam] = useState<string | null>(
  null
);

const [editedTeamName, setEditedTeamName] = useState("");

const [editedPlayerName, setEditedPlayerName] = useState("");

  const [supabaseSubmittedMatches, setSupabaseSubmittedMatches] =
  useState<SubmittedMatch[]>([]);

  useEffect(() => {
  async function loadSubmittedMatches() {
    const { data, error } = await supabase
      .from("match_scores")
      .select(`
        *,
        matches!match_scores_match_id_fkey(
          id,
          home_team:teams!matches_home_team_id_fkey(captain),
          away_team:teams!matches_away_team_id_fkey(captain)
        )
      `)
      .order("id");

    if (error) {
      console.error(
        "Error loading submitted scores:",
        error
      );
      return;
    }

    const updatedSubmittedMatches: SubmittedMatch[] =
      data.map((score) => ({
        matchId: Number(score.match_id),
        homeCaptain: score.matches.home_team.captain,
        awayCaptain: score.matches.away_team.captain,

        court1: {
          set1Home: score.court1_set1_home,
          set1Away: score.court1_set1_away,
          set2Home: score.court1_set2_home,
          set2Away: score.court1_set2_away,
          tiebreakHome: score.court1_tiebreak_home,
          tiebreakAway: score.court1_tiebreak_away,
        },

        court2: {
          set1Home: score.court2_set1_home,
          set1Away: score.court2_set1_away,
          set2Home: score.court2_set2_home,
          set2Away: score.court2_set2_away,
          tiebreakHome: score.court2_tiebreak_home,
          tiebreakAway: score.court2_tiebreak_away,
        },

        court3: {
          set1Home: score.court3_set1_home,
          set1Away: score.court3_set1_away,
          set2Home: score.court3_set2_home,
          set2Away: score.court3_set2_away,
          tiebreakHome: score.court3_tiebreak_home,
          tiebreakAway: score.court3_tiebreak_away,
        },

        homeCourtWins: score.home_court_wins,
        awayCourtWins: score.away_court_wins,
      }));

    setSupabaseSubmittedMatches(
      updatedSubmittedMatches
    );
  }

  loadSubmittedMatches();

  const channel = supabase
    .channel("admin-submitted-scores")
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

  const [newMatchHome, setNewMatchHome] = useState("");
const [newMatchAway, setNewMatchAway] = useState("");
const [newMatchTournament, setNewMatchTournament] = useState("");
const [newMatchDate, setNewMatchDate] = useState("");

  useEffect(() => {
    async function loadAssignedTeams() {
      if (!newMatchTournament) {
        setAssignedTeamIds([]);
        return;
      }

      const { data, error } = await supabase
        .from("tournament_teams")
        .select("team_id")
        .eq("tournament_id", Number(newMatchTournament));

      if (error) {
        console.error("Error loading tournament teams:", error);
        setAssignedTeamIds([]);
        return;
      }

      setAssignedTeamIds(
        (data || []).map((row) => row.team_id)
      );
    }

    loadAssignedTeams();
  }, [newMatchTournament]);

const [newMatchTime, setNewMatchTime] = useState("");
const [newMatchLocation, setNewMatchLocation] =
  useState("");

  const [editingMatchId, setEditingMatchId] =
  useState<number | null>(null);

const [editedMatchHome, setEditedMatchHome] =
  useState("");

const [editedMatchAway, setEditedMatchAway] =
  useState("");

const [editedMatchTournament, setEditedMatchTournament] =
  useState("");

const [editedAssignedTeamIds, setEditedAssignedTeamIds] =
  useState<number[]>([]);

  useEffect(() => {
    async function loadEditedAssignedTeams() {
      if (!editedMatchTournament) {
        setEditedAssignedTeamIds([]);
        return;
      }

      const { data, error } = await supabase
        .from("tournament_teams")
        .select("team_id")
        .eq("tournament_id", Number(editedMatchTournament));

      if (error) {
        console.error(
          "Error loading tournament teams:",
          error
        );
        setEditedAssignedTeamIds([]);
        return;
      }

      setEditedAssignedTeamIds(
        (data || []).map((row) => row.team_id)
      );
    }

    loadEditedAssignedTeams();
  }, [editedMatchTournament]);

const [editedMatchDate, setEditedMatchDate] =
  useState("");

const [editedMatchTime, setEditedMatchTime] =
  useState("");

const [editedMatchLocation, setEditedMatchLocation] =
  useState("");

  return (
    <main className="card">
      <h1>Admin Dashboard</h1>

      <p>
        Welcome to the tournament administration dashboard.
      </p>

      <hr />

      <h2>Submitted Matches</h2>

      {supabaseSubmittedMatches.length === 0 ? (
        <p>No matches have been submitted yet.</p>
      ) : (
        supabaseSubmittedMatches.map((match) => (
          <div key={match.matchId}>
            <h3>
              {match.homeCaptain} vs {match.awayCaptain}
            </h3>

            <p>
              Match ID: {match.matchId}
            </p>

            <p>
            <strong>Result:</strong>{" "}
            {match.homeCourtWins > match.awayCourtWins
                ? `${match.homeCaptain} wins ${match.homeCourtWins}-${match.awayCourtWins}`
                : `${match.awayCaptain} wins ${match.awayCourtWins}-${match.homeCourtWins}`}
            </p>

            <p>
              Court 1:{" "}
              {match.court1.set1Home} -{" "}
              {match.court1.set1Away},{" "}
              {match.court1.set2Home} -{" "}
              {match.court1.set2Away}
            </p>

            <p>
              Court 2:{" "}
              {match.court2.set1Home} -{" "}
              {match.court2.set1Away},{" "}
              {match.court2.set2Home} -{" "}
              {match.court2.set2Away}
            </p>

            <p>
              Court 3:{" "}
              {match.court3.set1Home} -{" "}
              {match.court3.set1Away},{" "}
              {match.court3.set2Home} -{" "}
              {match.court3.set2Away}
            </p>

            <hr />
          </div>
        ))
      )}


<h2>Manage Tournaments</h2>

<h3>Create Tournament</h3>

<form
  onSubmit={async (event) => {
    event.preventDefault();

    if (
      !newTournamentLeague ||
      !newTournamentName.trim()
    ) {
      alert("Please select a league and enter a tournament name.");
      return;
    }

    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        league_id: Number(newTournamentLeague),
        name: newTournamentName.trim(),
        start_date: newTournamentStartDate || null,
        end_date: newTournamentEndDate || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tournament:", error);
      alert("Could not create tournament.");
      return;
    }

    setTournaments((currentTournaments) => [
      ...currentTournaments,
      data,
    ]);

    setNewTournamentLeague("");
    setNewTournamentName("");
    setNewTournamentStartDate("");
    setNewTournamentEndDate("");

    alert("Tournament created successfully.");
  }}
>
  <select
    value={newTournamentLeague}
    onChange={(event) =>
      setNewTournamentLeague(event.target.value)
    }
  >
    <option value="">Select league</option>

    {leagues.map((league) => (
      <option
        key={league.id}
        value={league.id}
      >
        {league.name}
      </option>
    ))}
  </select>

  <input
    type="text"
    placeholder="Tournament name"
    value={newTournamentName}
    onChange={(event) =>
      setNewTournamentName(event.target.value)
    }
  />

  <input
    type="date"
    value={newTournamentStartDate}
    onChange={(event) =>
      setNewTournamentStartDate(event.target.value)
    }
  />

  <input
    type="date"
    value={newTournamentEndDate}
    onChange={(event) =>
      setNewTournamentEndDate(event.target.value)
    }
  />

  <button type="submit">
    Create Tournament
  </button>
</form>

<h3>Existing Tournaments</h3>

{tournaments.length === 0 ? (
  <p>No tournaments have been created yet.</p>
) : (
  tournaments.map((tournament) => {
    const league = leagues.find(
      (currentLeague) =>
        currentLeague.id === tournament.league_id
    );

    return (
      <div key={tournament.id}>
        {editingTournamentId === tournament.id ? (
          <div>
            <h4>Edit Tournament</h4>

            <select
              value={editedTournamentLeague}
              onChange={(event) =>
                setEditedTournamentLeague(event.target.value)
              }
            >
              <option value="">Select league</option>

              {leagues.map((league) => (
                <option
                  key={league.id}
                  value={league.id}
                >
                  {league.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={editedTournamentName}
              onChange={(event) =>
                setEditedTournamentName(event.target.value)
              }
              placeholder="Tournament name"
            />

            <input
              type="date"
              value={editedTournamentStartDate}
              onChange={(event) =>
                setEditedTournamentStartDate(event.target.value)
              }
            />

            <input
              type="date"
              value={editedTournamentEndDate}
              onChange={(event) =>
                setEditedTournamentEndDate(event.target.value)
              }
            />

            <button
              type="button"
              onClick={async () => {
                if (
                  !editedTournamentLeague ||
                  !editedTournamentName.trim()
                ) {
                  alert(
                    "Please select a league and enter a tournament name."
                  );
                  return;
                }

                const { error } = await supabase
                  .from("tournaments")
                  .update({
                    league_id: Number(editedTournamentLeague),
                    name: editedTournamentName.trim(),
                    start_date:
                      editedTournamentStartDate || null,
                    end_date:
                      editedTournamentEndDate || null,
                  })
                  .eq("id", tournament.id);

                if (error) {
                  console.error(
                    "Error updating tournament:",
                    error
                  );
                  alert("Could not update tournament.");
                  return;
                }

                const updatedTournaments = tournaments.map(
                  (currentTournament) =>
                    currentTournament.id === tournament.id
                      ? {
                          ...currentTournament,
                          league_id: Number(
                            editedTournamentLeague
                          ),
                          name: editedTournamentName.trim(),
                          start_date:
                            editedTournamentStartDate || null,
                          end_date:
                            editedTournamentEndDate || null,
                        }
                      : currentTournament
                );

                setTournaments(updatedTournaments);

                setEditingTournamentId(null);
                setEditedTournamentLeague("");
                setEditedTournamentName("");
                setEditedTournamentStartDate("");
                setEditedTournamentEndDate("");

                alert("Tournament updated successfully.");
              }}
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTournamentId(null);
                setEditedTournamentLeague("");
                setEditedTournamentName("");
                setEditedTournamentStartDate("");
                setEditedTournamentEndDate("");
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
        <h4>{tournament.name}</h4>

        <p>
          <strong>League:</strong>{" "}
          {league?.name ?? "Unknown"}
        </p>

        <p>
          <strong>Start:</strong>{" "}
          {tournament.start_date ?? "Not set"}
        </p>

        <p>
          <strong>End:</strong>{" "}
          {tournament.end_date ?? "Not set"}
        </p>

        <button
          type="button"
          onClick={() => {
            setEditingTournamentId(tournament.id);
            setEditedTournamentLeague(
              String(tournament.league_id)
            );
            setEditedTournamentName(tournament.name);
            setEditedTournamentStartDate(
              tournament.start_date ?? ""
            );
            setEditedTournamentEndDate(
              tournament.end_date ?? ""
            );
          }}
        >
          Edit Tournament
        </button>

        <button
          type="button"
          onClick={async () => {
            const confirmed = window.confirm(
              `Are you sure you want to delete the ${tournament.name} tournament?`
            );

            if (!confirmed) {
              return;
            }

            const { data: tournamentMatches, error: matchCheckError } =
              await supabase
                .from("matches")
                .select("id")
                .eq("tournament_id", tournament.id);

            if (matchCheckError) {
              console.error(
                "Error checking tournament matches:",
                matchCheckError
              );
              alert("Could not check this tournament's matches.");
              return;
            }

            if (tournamentMatches && tournamentMatches.length > 0) {
              alert(
                "This tournament cannot be deleted because it already has matches. Delete the matches first."
              );
              return;
            }

            const { data: tournamentTeams, error: teamCheckError } =
              await supabase
                .from("tournament_teams")
                .select("team_id")
                .eq("tournament_id", tournament.id);

            if (teamCheckError) {
              console.error(
                "Error checking tournament teams:",
                teamCheckError
              );
              alert("Could not check this tournament's teams.");
              return;
            }

            if (tournamentTeams && tournamentTeams.length > 0) {
              alert(
                "This tournament cannot be deleted because it has teams assigned to it. Remove the teams first."
              );
              return;
            }

            const { error } = await supabase
              .from("tournaments")
              .delete()
              .eq("id", tournament.id);

            if (error) {
              console.error(
                "Error deleting tournament:",
                error
              );
              alert(
                "Could not delete tournament. It may still have teams or matches assigned to it."
              );
              return;
            }

            setTournaments(
              tournaments.filter(
                (currentTournament) =>
                  currentTournament.id !== tournament.id
              )
            );

            alert("Tournament deleted successfully.");
          }}
        >
          Delete Tournament
        </button>

        </>
      )}
      </div>
    );
  })
)}

      <h2>Manage Teams</h2>

            <form
              onSubmit={async (event) => {
                event.preventDefault();

                const trimmedName = newTeamName.trim();

                if (!trimmedName) {
                  return;
                }

                const teamAlreadyExists = managedTeams.some(
                  (team) =>
                    team.captain.toLowerCase() ===
                    trimmedName.toLowerCase()
                );

                if (teamAlreadyExists) {
                  alert("That team already exists.");
                  return;
                }

                const { data, error } = await supabase
                  .from("teams")
                  .insert({
                    captain: trimmedName,
                  })
                  .select()
                  .single();

                if (error) {
                  console.error("Error adding team:", error);
                  alert("Could not add team.");
                  return;
                }

                const updatedTeams = [
                  ...managedTeams,
                  {
                    id: data.id,
                    captain: data.captain,
                    players: [],
                  },
                ];

                setManagedTeams(updatedTeams);

                setNewTeamName("");
              }}
            >
                <input
                    type="text"
                    placeholder="Team captain last name"
                    value={newTeamName}
                    onChange={(event) => setNewTeamName(event.target.value)}
                />

                <button type="submit">Add Team</button>
                </form>
                
                <h2>Add Team to Tournament</h2>

                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();

                      if (!assignTeamId || !assignTournamentId) {
                        alert("Please select a team and tournament.");
                        return;
                      }

                      const { error } = await supabase
                        .from("tournament_teams")
                        .insert({
                          team_id: Number(assignTeamId),
                          tournament_id: Number(assignTournamentId),
                        });

                      if (error) {
                        console.error(
                          "Error assigning team to tournament:",
                          error
                        );
                        alert("Could not assign team to tournament.");
                        return;
                      }

                      alert("Team assigned to tournament.");

                      setAssignTeamId("");
                      setAssignTournamentId("");
                    }}
                  >
                    <select
                      value={assignTeamId}
                      onChange={(event) =>
                        setAssignTeamId(event.target.value)
                      }
                    >
                      <option value="">Select Team</option>

                      {managedTeams.map((team) => (
                        <option
                          key={team.captain}
                          value={team.id}
                        >
                          {team.captain}
                        </option>
                      ))}
                    </select>

                    <select
                      value={assignTournamentId}
                      onChange={(event) =>
                        setAssignTournamentId(event.target.value)
                      }
                    >
                      <option value="">Select Tournament</option>

                      {tournaments.map((tournament) => (
                        <option
                          key={tournament.id}
                          value={tournament.id}
                        >
                          {tournament.name}
                        </option>
                      ))}
                    </select>

                    <button type="submit">
                      Assign to Tournament
                    </button>
                  </form>

                  <h2>Remove Team from Tournament</h2>

                    <form
                      onSubmit={async (event) => {
                        event.preventDefault();

                        if (!removeTeamId || !removeTournamentId) {
                          alert("Please select a team and tournament.");
                          return;
                        }

                        const { data: teamMatches, error: matchCheckError } =
                          await supabase
                            .from("matches")
                            .select("id")
                            .eq("tournament_id", Number(removeTournamentId))
                            .or(
                              `home_team_id.eq.${Number(removeTeamId)},away_team_id.eq.${Number(removeTeamId)}`
                            );

                        if (matchCheckError) {
                          console.error(
                            "Error checking team matches:",
                            matchCheckError
                          );
                          alert("Could not check whether this team has matches.");
                          return;
                        }

                        if (teamMatches && teamMatches.length > 0) {
                          alert(
                            "This team cannot be removed from the tournament because it already has a match in this tournament."
                          );
                          return;
                        }

                        const { error } = await supabase
                          .from("tournament_teams")
                          .delete()
                          .eq("team_id", Number(removeTeamId))
                          .eq("tournament_id", Number(removeTournamentId));

                        if (error) {
                          console.error(
                            "Error removing team from tournament:",
                            error
                          );
                          alert("Could not remove team from tournament.");
                          return;
                        }

                        alert("Team removed from tournament.");

                        setRemoveTeamId("");
                        setRemoveTournamentId("");
                      }}
                    >
                      <select
                        value={removeTournamentId}
                        onChange={(event) =>
                          setRemoveTournamentId(event.target.value)
                        }
                      >
                        <option value="">Select Tournament</option>

                        {tournaments.map((tournament) => (
                          <option
                            key={tournament.id}
                            value={tournament.id}
                          >
                            {tournament.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={removeTeamId}
                        onChange={(event) =>
                          setRemoveTeamId(event.target.value)
                        }
                      >
                        <option value="">Select Team</option>

                        {managedTeams
                          .filter((team) =>
                            assignedTeams.some(
                              (assignment) => assignment.team_id === team.id
                            )
                          )
                          .map((team) => (
                            <option
                              key={team.captain}
                              value={team.id}
                            >
                              {team.captain}
                            </option>
                          ))}
                      </select>

                      <button type="submit">
                        Remove Team
                      </button>
                    </form>

            {managedTeams.map((team) => (
  <div key={team.captain}>
    {editingTeam === team.captain ? (
  <div>
    <input
      type="text"
      value={editedTeamName}
      onChange={(event) =>
        setEditedTeamName(event.target.value)
      }
    />

    <button
      type="button"
      onClick={async () => {
        const trimmedName = editedTeamName.trim();

        if (!trimmedName) {
          return;
        }

        const teamAlreadyExists = managedTeams.some(
          (currentTeam) =>
            currentTeam.captain !== team.captain &&
            currentTeam.captain.toLowerCase() ===
              trimmedName.toLowerCase()
        );

        if (teamAlreadyExists) {
          alert("That team already exists.");
          return;
        }

        const oldTeamName = team.captain;

        const { error } = await supabase
          .from("teams")
          .update({
            captain: trimmedName,
          })
          .eq("captain", oldTeamName);

        if (error) {
          console.error(
            "Error updating team:",
            error
          );
          alert("Could not update team.");
          return;
        }

        const updatedTeams = managedTeams.map(
          (currentTeam) =>
            currentTeam.captain === oldTeamName
              ? {
                  ...currentTeam,
                  captain: trimmedName,
                }
              : currentTeam
        );

        setManagedTeams(updatedTeams);

        const updatedMatches = managedMatches.map(
          (match) => ({
            ...match,
            homeCaptain:
              match.homeCaptain === oldTeamName
                ? trimmedName
                : match.homeCaptain,
            awayCaptain:
              match.awayCaptain === oldTeamName
                ? trimmedName
                : match.awayCaptain,
          })
        );

        setManagedMatches(updatedMatches);

        setEditingTeam(null);
        setEditedTeamName("");
      }}
    >
      Save
    </button>

    <button
      type="button"
      onClick={() => {
        setEditingTeam(null);
        setEditedTeamName("");
      }}
    >
      Cancel
    </button>
  </div>
) : (
  <h3>{team.captain}</h3>
)}

<button
  type="button"
  onClick={() => {
    setEditingTeam(team.captain);
    setEditedTeamName(team.captain);
  }}
>
  Edit Team
</button>

    <button
      type="button"
      onClick={async () => {
        const confirmed = window.confirm(
          `Are you sure you want to delete the ${team.captain} team?`
        );

        if (!confirmed) {
          return;
        }

        const teamHasMatches = managedMatches.some(
          (match) =>
            match.homeCaptain === team.captain ||
            match.awayCaptain === team.captain
        );

        if (teamHasMatches) {
          alert(
            "This team cannot be deleted because it is already assigned to a match."
          );
          return;
        }

        const { data: tournamentAssignments, error: assignmentError } =
          await supabase
            .from("tournament_teams")
            .select("tournament_id")
            .eq("team_id", team.id);

        if (assignmentError) {
          console.error(
            "Error checking tournament assignments:",
            assignmentError
          );
          alert("Could not check this team's tournament assignments.");
          return;
        }

        if (tournamentAssignments && tournamentAssignments.length > 0) {
          alert(
            "This team cannot be deleted because it is assigned to a tournament. Remove the team from all tournaments first."
          );
          return;
        }

        const { data: teamData, error: teamError } =
          await supabase
            .from("teams")
            .select("id")
            .eq("captain", team.captain)
            .single();

        if (teamError) {
          console.error(
            "Error finding team:",
            teamError
          );
          alert("Could not find this team.");
          return;
        }

        const { error: playerError } =
          await supabase
            .from("players")
            .delete()
            .eq("team_id", teamData.id);

        if (playerError) {
          console.error(
            "Error deleting team players:",
            playerError
          );
          alert("Could not delete the team's players.");
          return;
        }

        const { error: deleteTeamError } =
          await supabase
            .from("teams")
            .delete()
            .eq("id", teamData.id);

        if (deleteTeamError) {
          console.error(
            "Error deleting team:",
            deleteTeamError
          );
          alert("Could not delete team.");
          return;
        }

        const updatedTeams = managedTeams.filter(
          (currentTeam) =>
            currentTeam.captain !== team.captain
        );

        setManagedTeams(updatedTeams);
      }}
    >
      Delete Team
    </button>

    <p>
      <strong>Players:</strong>
    </p>

    {team.players.length === 0 ? (
      <p>No players added yet.</p>
    ) : (
      <ul>
        {team.players.map((player) => (
  <li key={player}>
    {editingPlayer?.teamCaptain === team.captain &&
    editingPlayer?.playerName === player ? (
      <>
        <input
          type="text"
          value={editedPlayerName}
          onChange={(event) =>
            setEditedPlayerName(event.target.value)
          }
        />

        <button
          type="button"
          onClick={async () => {
            const trimmedName =
              editedPlayerName.trim();

            if (!trimmedName) {
              return;
            }

            const { data: teamData, error: teamError } =
              await supabase
                .from("teams")
                .select("id")
                .eq("captain", team.captain)
                .single();

            if (teamError) {
              console.error(
                "Error finding team:",
                teamError
              );
              alert("Could not find this team.");
              return;
            }

            const { error: playerError } =
              await supabase
                .from("players")
                .update({
                  name: trimmedName,
                })
                .eq("team_id", teamData.id)
                .eq("name", player);

            if (playerError) {
              console.error(
                "Error updating player:",
                playerError
              );
              alert("Could not update player.");
              return;
            }

            const updatedTeams = managedTeams.map(
              (currentTeam) =>
                currentTeam.captain === team.captain
                  ? {
                      ...currentTeam,
                      players:
                        currentTeam.players.map(
                          (currentPlayer) =>
                            currentPlayer === player
                              ? trimmedName
                              : currentPlayer
                        ),
                    }
                  : currentTeam
            );

            setManagedTeams(updatedTeams);

            setEditingPlayer(null);
            setEditedPlayerName("");
          }}
        >
          Save
        </button>

        <button
          type="button"
          onClick={() => {
            setEditingPlayer(null);
            setEditedPlayerName("");
          }}
        >
          Cancel
        </button>
      </>
    ) : (
      <>
        {player}

        <button
          type="button"
          onClick={() => {
            setEditingPlayer({
              teamCaptain: team.captain,
              playerName: player,
            });

            setEditedPlayerName(player);
          }}
        >
          Edit
        </button>

        <button
          type="button"
          onClick={async () => {
            const confirmed = window.confirm(
              `Are you sure you want to delete ${player}?`
            );

            if (!confirmed) {
              return;
            }

            const { data: teamData, error: teamError } =
              await supabase
                .from("teams")
                .select("id")
                .eq("captain", team.captain)
                .single();

            if (teamError) {
              console.error(
                "Error finding team:",
                teamError
              );
              alert("Could not find this team.");
              return;
            }

            const { error: playerError } =
              await supabase
                .from("players")
                .delete()
                .eq("team_id", teamData.id)
                .eq("name", player);

            if (playerError) {
              console.error(
                "Error deleting player:",
                playerError
              );
              alert("Could not delete player.");
              return;
            }

            const updatedTeams = managedTeams.map(
              (currentTeam) =>
                currentTeam.captain === team.captain
                  ? {
                      ...currentTeam,
                      players:
                        currentTeam.players.filter(
                          (currentPlayer) =>
                            currentPlayer !== player
                        ),
                    }
                  : currentTeam
            );

            setManagedTeams(updatedTeams);
          }}
        >
          Delete
        </button>
      </>
    )}
  </li>
))}
      </ul>
    )}

    <input
      type="text"
      placeholder="Player name"
      value={newPlayerNames[team.captain] || ""}
      onChange={(event) => {
        setNewPlayerNames({
          ...newPlayerNames,
          [team.captain]: event.target.value,
        });
      }}
    />

    <button
      type="button"
      onClick={async () => {
        const playerName = (
          newPlayerNames[team.captain] || ""
        ).trim();

        if (!playerName) {
          return;
        }

        // Find the team's Supabase ID
        const { data: teamData, error: teamError } =
          await supabase
            .from("teams")
            .select("id")
            .eq("captain", team.captain)
            .single();

        if (teamError) {
          console.error(
            "Error finding team:",
            teamError
          );
          alert("Could not find this team.");
          return;
        }

        // Add the player to Supabase
        const { error: playerError } =
          await supabase
            .from("players")
            .insert({
              team_id: teamData.id,
              name: playerName,
            });

        if (playerError) {
          console.error(
            "Error adding player:",
            playerError
          );
          alert("Could not add player.");
          return;
        }

        // Update the current Admin Dashboard display
        const updatedTeams = managedTeams.map(
          (currentTeam) =>
            currentTeam.captain === team.captain
              ? {
                  ...currentTeam,
                  players: [
                    ...currentTeam.players,
                    playerName,
                  ],
                }
              : currentTeam
        );

        setManagedTeams(updatedTeams);

        setNewPlayerNames({
          ...newPlayerNames,
          [team.captain]: "",
        });
      }}
    >
      Add Player
    </button>

    <hr />

  </div>
))}

            <hr />

<h2>Manage Matches</h2>

<h3>Create Match</h3>

<form
  onSubmit={async (event) => {
    event.preventDefault();

    if (
      !newMatchHome ||
      !newMatchAway ||
      !newMatchTournament ||
      !newMatchDate ||
      !newMatchTime ||
      !newMatchLocation
    ) {
      alert("Please complete all match fields.");
      return;
    }

    if (newMatchHome === newMatchAway) {
      alert("A team cannot play itself.");
      return;
    }

    // Find the Supabase IDs for the selected teams
    const { data: homeTeam, error: homeTeamError } = await supabase
      .from("teams")
      .select("id")
      .eq("captain", newMatchHome)
      .single();

    if (homeTeamError) {
      console.error("Error finding home team:", homeTeamError);
      alert("Could not find the home team.");
      return;
    }

    const { data: awayTeam, error: awayTeamError } = await supabase
      .from("teams")
      .select("id")
      .eq("captain", newMatchAway)
      .single();

    if (awayTeamError) {
      console.error("Error finding away team:", awayTeamError);
      alert("Could not find the away team.");
      return;
    }

    // Create the match in Supabase
    const { data: createdMatch, error: matchError } = await supabase
      .from("matches")
      .insert({
        date: newMatchDate,
        time: newMatchTime,
        location: newMatchLocation,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        tournament_id: Number(newMatchTournament),
        completed: false,
      })
      .select()
      .single();

    if (matchError) {
      console.error("Error creating match:", matchError);
      alert("Could not create match.");
      return;
    }

    // Keep the local app state updated for now
    const newMatch: Match = {
      id: createdMatch.id,
      date: createdMatch.date,
      time: createdMatch.time,
      location: createdMatch.location,
      homeCaptain: newMatchHome,
      awayCaptain: newMatchAway,
      completed: createdMatch.completed,
      tournament_id: createdMatch.tournament_id,
      courts: [],
    };

    const updatedMatches = [
      ...managedMatches,
      newMatch,
    ];

    setManagedMatches(updatedMatches);

    setNewMatchHome("");
    setNewMatchAway("");
    setNewMatchTournament("");
    setNewMatchDate("");
    setNewMatchTime("");
    setNewMatchLocation("");

    alert("Match created successfully.");
  }}
>
  <select
    value={newMatchTournament}
    onChange={(event) =>
      setNewMatchTournament(event.target.value)
    }
  >
    <option value="">Select tournament</option>

    {tournaments.map((tournament) => (
      <option
        key={tournament.id}
        value={tournament.id}
      >
        {tournament.name}
      </option>
    ))}
  </select>
  
  <select
    value={newMatchHome}
    onChange={(event) =>
      setNewMatchHome(event.target.value)
    }
  >
    <option value="">Home team</option>

    {managedTeams
      .filter(
        (team) =>
          team.id !== undefined &&
          assignedTeamIds.includes(team.id)
      )
      .map((team) => (
        <option
          key={team.captain}
          value={team.captain}
        >
          {team.captain}
        </option>
      ))}
  </select>

  <select
    value={newMatchAway}
    onChange={(event) =>
      setNewMatchAway(event.target.value)
    }
  >
    <option value="">Away team</option>

    {managedTeams
      .filter(
        (team) =>
          team.id !== undefined &&
          assignedTeamIds.includes(team.id)
      )
      .map((team) => (
        <option
          key={team.captain}
          value={team.captain}
        >
          {team.captain}
        </option>
      ))}
  </select>

  <input
    type="text"
    placeholder="Date"
    value={newMatchDate}
    onChange={(event) =>
      setNewMatchDate(event.target.value)
    }
  />

  <input
    type="text"
    placeholder="Time"
    value={newMatchTime}
    onChange={(event) =>
      setNewMatchTime(event.target.value)
    }
  />

  <input
    type="text"
    placeholder="Location"
    value={newMatchLocation}
    onChange={(event) =>
      setNewMatchLocation(event.target.value)
    }
  />

  <button type="submit">
    Create Match
  </button>
</form>

<h3>Scheduled Matches</h3>

{managedMatches.map((match) => (
  <div key={match.id}>
    {editingMatchId === match.id ? (
      <div>
        <h4>Edit Match</h4>

        <select
          value={editedMatchHome}
          onChange={(event) =>
            setEditedMatchHome(event.target.value)
          }
        >
          <option value="">Home team</option>

          {managedTeams
            .filter(
              (team) =>
                team.id !== undefined &&
                editedAssignedTeamIds.includes(team.id)
            )
            .map((team) => (
              <option
                key={team.captain}
                value={team.captain}
              >
                {team.captain}
              </option>
            ))}
        </select>

        <select
          value={editedMatchAway}
          onChange={(event) =>
            setEditedMatchAway(event.target.value)
          }
        >
          <option value="">Away team</option>

          {managedTeams
            .filter(
              (team) =>
                team.id !== undefined &&
                editedAssignedTeamIds.includes(team.id)
            )
            .map((team) => (
              <option
                key={team.captain}
                value={team.captain}
              >
                {team.captain}
              </option>
            ))}
        </select>

        <select
          value={editedMatchTournament}
          onChange={(event) =>
            setEditedMatchTournament(event.target.value)
          }
        >
          <option value="">Select tournament</option>

          {tournaments.map((tournament) => (
            <option
              key={tournament.id}
              value={tournament.id}
            >
              {tournament.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={editedMatchDate}
          onChange={(event) =>
            setEditedMatchDate(event.target.value)
          }
          placeholder="Date"
        />

        <input
          type="text"
          value={editedMatchTime}
          onChange={(event) =>
            setEditedMatchTime(event.target.value)
          }
          placeholder="Time"
        />

        <input
          type="text"
          value={editedMatchLocation}
          onChange={(event) =>
            setEditedMatchLocation(event.target.value)
          }
          placeholder="Location"
        />

        <button
          type="button"
          onClick={async () => {
            if (
              !editedMatchHome ||
              !editedMatchAway ||
              !editedMatchTournament ||
              !editedMatchDate ||
              !editedMatchTime ||
              !editedMatchLocation
            ) {
              alert("Please complete all match fields.");
              return;
            }

            if (editedMatchHome === editedMatchAway) {
              alert("A team cannot play itself.");
              return;
            }

            // Find the Supabase IDs for the selected teams
            const { data: homeTeam, error: homeTeamError } =
              await supabase
                .from("teams")
                .select("id")
                .eq("captain", editedMatchHome)
                .single();

            if (homeTeamError) {
              console.error("Error finding home team:", homeTeamError);
              alert("Could not find the home team.");
              return;
            }

            const { data: awayTeam, error: awayTeamError } =
              await supabase
                .from("teams")
                .select("id")
                .eq("captain", editedMatchAway)
                .single();

            if (awayTeamError) {
              console.error("Error finding away team:", awayTeamError);
              alert("Could not find the away team.");
              return;
            }

            // Update the match in Supabase
            const { error: matchError } = await supabase
              .from("matches")
              .update({
                date: editedMatchDate,
                time: editedMatchTime,
                location: editedMatchLocation,
                home_team_id: homeTeam.id,
                away_team_id: awayTeam.id,
                tournament_id: Number(editedMatchTournament),
              })
              .eq("id", match.id);

            if (matchError) {
              console.error("Error updating match:", matchError);
              alert("Could not update match.");
              return;
            }

            // Keep the local app state updated for now
            const updatedMatches = managedMatches.map(
              (currentMatch) =>
                currentMatch.id === match.id
                  ? {
                      ...currentMatch,
                      homeCaptain: editedMatchHome,
                      awayCaptain: editedMatchAway,
                      date: editedMatchDate,
                      time: editedMatchTime,
                      location: editedMatchLocation,
                      tournament_id: Number(editedMatchTournament),
                    }
                  : currentMatch
            );

            setManagedMatches(updatedMatches);

            setEditingMatchId(null);

            alert("Match updated successfully.");
          }}
        >
          Save Changes
        </button>

        <button
          type="button"
          onClick={() => {
            setEditingMatchId(null);
          }}
        >
          Cancel
        </button>
      </div>
    ) : (
      <div>
        <h4>
          {match.homeCaptain} vs{" "}
          {match.awayCaptain}
        </h4>

        <p>
          Date: {match.date}
        </p>

        <p>
          Time: {match.time}
        </p>

        <p>
          Location: {match.location}
        </p>

        <p>
          Status:{" "}
          {match.completed
            ? "Completed"
            : "Upcoming"}
        </p>

        {matchCourts
          .filter((court) => court.match_id === match.id)
          .map((court) => (
            <div key={court.id}>
              <p>
                <strong>
                  Court {court.court_number}:
                </strong>{" "}
                {court.home_player_1 || "TBD"}
                {court.home_player_2
                  ? ` & ${court.home_player_2}`
                  : ""}
                {" vs "}
                {court.away_player_1 || "TBD"}
                {court.away_player_2
                  ? ` & ${court.away_player_2}`
                  : ""}
              </p>
            </div>
          ))}

        <button
          type="button"
          onClick={() => {
            setEditingMatchId(match.id);
            setEditedMatchHome(
              match.homeCaptain
            );
            setEditedMatchAway(
              match.awayCaptain
            );
            setEditedMatchTournament(
              match.tournament_id !== null
                ? String(match.tournament_id)
                : ""
            );
            setEditedMatchDate(match.date);
            setEditedMatchTime(match.time);
            setEditedMatchLocation(
              match.location
            );
          }}

          
        >
          Edit Match
        </button>

        <button
          type="button"
          onClick={async () => {
            const confirmed = window.confirm(
              `Are you sure you want to delete ${match.homeCaptain} vs ${match.awayCaptain}?`
            );

            if (!confirmed) {
              return;
            }

            // Delete the match from Supabase
            const { error: matchError } = await supabase
              .from("matches")
              .delete()
              .eq("id", match.id);

            if (matchError) {
              console.error("Error deleting match:", matchError);
              alert("Could not delete match.");
              return;
            }

            // Remove the match from the local app state
            const updatedMatches = managedMatches.filter(
              (currentMatch) => currentMatch.id !== match.id
            );

            setManagedMatches(updatedMatches);

            alert("Match deleted successfully.");
          }}
        >
          Delete Match
        </button>

        <hr />
      </div>
    )}
  </div>
))}

    </main>
  );
}

export default AdminDashboard;