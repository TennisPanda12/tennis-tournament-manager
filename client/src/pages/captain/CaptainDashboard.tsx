import { useEffect, useState } from "react";
import "../../styles/Cards.css";
import { Link, useSearchParams } from "react-router-dom";
import type { Match } from "../../types/Match";
import { supabase } from "../../lib/supabaseClient";


function CaptainDashboard() {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const [captainTeam, setCaptainTeam] = useState("");

  const [managedMatches, setManagedMatches] = useState<Match[]>([]);
    const [submittedMatches, setSubmittedMatches] = useState<
    { matchId: number }[]
  >([]);

    useEffect(() => {
    async function loadCaptainProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No logged-in user found.");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, captain")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        console.error("Error loading captain profile:", error);
        return;
      }

      if (profile.role !== "captain" || !profile.captain) {
        console.error("User is not a valid captain profile.");
        return;
      }

      setCaptainTeam(profile.captain);
    }

    loadCaptainProfile();
  }, []);

  useEffect(() => {
  async function loadSubmittedMatches() {
    const { data, error } = await supabase
      .from("match_scores")
      .select("match_id");

    if (error) {
      console.error("Error loading submitted matches:", error);
      return;
    }

    setSubmittedMatches(
      data.map((score) => ({
        matchId: Number(score.match_id),
      }))
    );
  }

    loadSubmittedMatches();

  const channel = supabase
    .channel("captain-submitted-scores")
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
      courts: [1, 2, 3].map((courtNumber) => ({
        courtNumber,
        homePlayers: [],
        awayPlayers: [],
      })),
    }));

    setManagedMatches(updatedMatches);
  }

    loadMatches();

  const channel = supabase
    .channel("captain-matches")
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
    .subscribe((status) => {
      console.log("Captain matches realtime:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [tournamentId]);

const captainMatches = managedMatches.map((match) => ({
  ...match,
  courts:
    match.courts && match.courts.length > 0
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
        ],
}));


  const [teamPlayers, setTeamPlayers] = useState<
    {
      id: number;
      name: string;
      team: string;
    }[]
  >([]);

  const [newPlayerName, setNewPlayerName] =
    useState("");

  const [editingPlayerId, setEditingPlayerId] =
    useState<number | null>(null);
    
  const [courtAssignments, setCourtAssignments] =
    useState<Record<number, {
      court1: string[];
      court2: string[];
      court3: string[];
    }>>({});

    useEffect(() => {
      async function loadTeamPlayers() {
        if (!captainTeam) {
          return;
        }
        const { data: teamData, error: teamError } =
          await supabase
            .from("teams")
            .select("id")
            .eq("captain", captainTeam)
            .single();

        if (teamError) {
          console.error(
            "Error finding team:",
            teamError
          );
          return;
        }

        const { data: playerData, error: playerError } =
          await supabase
            .from("players")
            .select("*")
            .eq("team_id", teamData.id);

        if (playerError) {
          console.error(
            "Error loading players:",
            playerError
          );
          return;
        }

        setTeamPlayers(
          playerData.map((player) => ({
            id: player.id,
            name: player.name,
            team: captainTeam,
          }))
        );
      }

      loadTeamPlayers();

const channel = supabase
  .channel("captain-team-players")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "players",
    },
    () => {
      loadTeamPlayers();
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
}, [captainTeam]);

  useEffect(() => {
  async function loadCourtAssignments() {
    const { data, error } = await supabase
      .from("match_courts")
      .select("*");

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
        court1: string[];
        court2: string[];
        court3: string[];
      }
    > = {};

    data.forEach((court) => {
      const match = managedMatches.find(
        (m) => m.id === Number(court.match_id)
      );

      if (!match) {
        return;
      }

      if (
        match.homeCaptain !== captainTeam &&
        match.awayCaptain !== captainTeam
      ) {
        return;
      }

      if (!assignments[Number(court.match_id)]) {
        assignments[Number(court.match_id)] = {
          court1: ["", ""],
          court2: ["", ""],
          court3: ["", ""],
        };
      }

      const courtKey =
        `court${court.court_number}` as
          | "court1"
          | "court2"
          | "court3";

      if (match.homeCaptain === captainTeam) {
        assignments[Number(court.match_id)][courtKey] = [
          court.home_player_1 || "",
          court.home_player_2 || "",
        ];
      } else {
        assignments[Number(court.match_id)][courtKey] = [
          court.away_player_1 || "",
          court.away_player_2 || "",
        ];
      }
    });

    setCourtAssignments(assignments);
  }

 if (managedMatches.length > 0) {
  loadCourtAssignments();
}

const channel = supabase
  .channel("captain-court-assignments")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "match_courts",
    },
    () => {
      loadCourtAssignments();
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
}, [captainTeam, managedMatches]);

  const [editingPlayerName, setEditingPlayerName] =
    useState("");

  const handleAddPlayer = async () => {
    if (!captainTeam) {
      alert("Your captain profile is still loading. Please try again.");
      return;
    }
    if (newPlayerName.trim() === "") {
      alert("Please enter a player name.");
      return;
    }

    const playerName = newPlayerName.trim();

    const { data: teamData, error: teamError } =
      await supabase
        .from("teams")
        .select("id")
        .eq("captain", captainTeam)
        .single();

    if (teamError) {
      console.error(
        "Error finding team:",
        teamError
      );
      alert("Could not find your team.");
      return;
    }

    const { data: playerData, error: playerError } =
      await supabase
        .from("players")
        .insert({
          team_id: teamData.id,
          name: playerName,
        })
        .select()
        .single();

    if (playerError) {
      console.error(
        "Error adding player:",
        playerError
      );
      alert("Could not add player.");
      return;
    }

    const newPlayer = {
      id: playerData.id,
      name: playerData.name,
      team: captainTeam,
    };

    setTeamPlayers([
      ...teamPlayers,
      newPlayer,
    ]);

    setNewPlayerName("");
  };

  const handleSavePlayer = async () => {
    if (editingPlayerName.trim() === "") {
      alert("Please enter a player name.");
      return;
    }

    if (editingPlayerId === null) {
      return;
    }

    const updatedName = editingPlayerName.trim();

    const { error } = await supabase
      .from("players")
      .update({
        name: updatedName,
      })
      .eq("id", editingPlayerId);

    if (error) {
      console.error(
        "Error updating player:",
        error
      );
      alert("Could not update player.");
      return;
    }

    setTeamPlayers(
      teamPlayers.map((player) =>
        player.id === editingPlayerId
          ? {
              ...player,
              name: updatedName,
            }
          : player
      )
    );

    setEditingPlayerId(null);
    setEditingPlayerName("");
  };

  return (
    <main className="card">
      <h1>Captain Dashboard</h1>

      <h2>Welcome, Captain</h2>

      <p>
        Manage your team, players, matches, and scores.
      </p>

      <hr />

      <h2>Team</h2>

      <p>
        Team: {captainTeam}
      </p>

      <hr />


      <h2>Captain Actions</h2>

      <div>
        <Link to={`/tournament/${tournamentId}/schedule`}>
          <button>View Schedule</button>
        </Link>
      </div>

      <div>
          <Link to={`/tournament/${tournamentId}/standings`}>
            <button type="button">View Standings</button>
          </Link>
        </div>

      <div>
        <Link to={`/tournament/${tournamentId}/teams`}>
          <button>View Teams</button>
        </Link>
      </div>

      <hr />

      <h2>My Players</h2>

      <ul>
        {teamPlayers.map((player) => (
          <li key={player.id}>
            {editingPlayerId === player.id ? (
              <>
                <input
                  type="text"
                  value={editingPlayerName}
                  onChange={(event) =>
                    setEditingPlayerName(
                      event.target.value
                    )
                  }
                />

                <button
                  onClick={handleSavePlayer}
                >
                  Save
                </button>

                <button
                  onClick={() => {
                    setEditingPlayerId(null);
                    setEditingPlayerName("");
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {player.name}

                <button
                  onClick={() => {
                    setEditingPlayerId(player.id);
                    setEditingPlayerName(
                      player.name
                    );
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={async () => {
                    const { error } = await supabase
                      .from("players")
                      .delete()
                      .eq("id", player.id);

                    if (error) {
                      console.error(
                        "Error deleting player:",
                        error
                      );
                      alert("Could not delete player.");
                      return;
                    }

                    setTeamPlayers(
                      teamPlayers.filter(
                        (teamPlayer) =>
                          teamPlayer.id !== player.id
                      )
                    );
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <h3>Add Player</h3>

      <input
        type="text"
        placeholder="Player name"
        value={newPlayerName}
        onChange={(event) =>
          setNewPlayerName(event.target.value)
        }
      />

      <button onClick={handleAddPlayer}>
        Add Player
      </button>

      <hr />

      <h2>My Matches</h2>

      {captainMatches
        .filter(
          (match: Match) =>
            match.homeCaptain === captainTeam ||
            match.awayCaptain === captainTeam
        )
        .map((match: Match) => {
            const matchAssignments =
              courtAssignments[match.id] ?? {
                court1: ["", ""],
                court2: ["", ""],
                court3: ["", ""],
              };

            return (
                <div key={match.id}>


            <h3>
              {match.homeCaptain} vs{" "}
              {match.awayCaptain}
            </h3>

            <p>
              {match.date} • {match.time} •{" "}
              {match.location}
            </p>

            <h4>Court Assignments</h4>

            <p>
            Select two players for each court.
            </p>

            <p>
            {matchAssignments.court1[0] &&
            matchAssignments.court1[1] &&
            matchAssignments.court2[0] &&
            matchAssignments.court2[1] &&
            matchAssignments.court3[0] &&
            matchAssignments.court3[1]
                ? "Lineup complete"
                : "Lineup incomplete"}
            </p>

    {match.courts.map((court: Match["courts"][number]) => {
    const courtKey =
        `court${court.courtNumber}` as
        "court1" | "court2" | "court3";


  return (
    <div key={court.courtNumber}>
      <p>
        <strong>
          Court {court.courtNumber}
        </strong>
      </p>

      <select
        disabled={
          match.completed ||
          submittedMatches.some(
            (submittedMatch: { matchId: number }) =>
              submittedMatch.matchId === match.id
          )
        }
        value={matchAssignments[courtKey][0]}
        onChange={(event) => {
          setCourtAssignments({
            ...courtAssignments,
            [match.id]: {
              ...matchAssignments,
              [courtKey]: [
                event.target.value,
                matchAssignments[courtKey][1],
              ],
            },
          });
        }}
      >
        <option value="">
          Select Player 1
        </option>

        {teamPlayers
          .filter((player) => {
            const selectedPlayers = Object.entries(
              matchAssignments
            )
              .filter(([key]) => key !== courtKey)
              .flatMap(([, players]) => players);

            return (
              !selectedPlayers.includes(player.name) ||
              player.name === matchAssignments[courtKey][0]
            );
          })
          .map((player) => (
            <option
              key={player.id}
              value={player.name}
            >
              {player.name}
            </option>
          ))}
      </select>

      <select
        disabled={
          match.completed ||
          submittedMatches.some(
            (submittedMatch: { matchId: number }) =>
              submittedMatch.matchId === match.id
          )
        }
        value={matchAssignments[courtKey][1]}
        onChange={(event) => {
          setCourtAssignments({
            ...courtAssignments,
            [match.id]: {
              ...matchAssignments,
              [courtKey]: [
                matchAssignments[courtKey][0],
                event.target.value,
              ],
            },
          });
        }}
      >
        <option value="">
          Select Player 2
        </option>

        {teamPlayers
          .filter((player) => {
            const selectedPlayers = Object.entries(
              matchAssignments
            )
              .filter(([key]) => key !== courtKey)
              .flatMap(([, players]) => players);

            return (
              !selectedPlayers.includes(player.name) ||
              player.name === matchAssignments[courtKey][1]
            );
          })
          .map((player) => (
            <option
              key={player.id}
              value={player.name}
            >
              {player.name}
            </option>
          ))}
      </select>
    </div>
  );
})}

            <Link to={`/tournament/${tournamentId}/match/${match.id}`}>
              <button>View Match</button>
            </Link>

            {!match.completed &&
                !submittedMatches.some(
                    (submittedMatch: { matchId: number }) =>
                    submittedMatch.matchId === match.id
                ) && (
                matchAssignments.court1[0] &&
                matchAssignments.court1[1] &&
                matchAssignments.court2[0] &&
                matchAssignments.court2[1] &&
                matchAssignments.court3[0] &&
                matchAssignments.court3[1] ? (
                    <Link
                      to={`/tournament/${tournamentId}/match/submit/${match.id}`}
                    >
                    <button>Submit Scores</button>
                    </Link>
                ) : (
                    <button
                    onClick={() =>
                        alert(
                        "Please complete all court assignments before submitting scores."
                        )
                    }
                    >
                    Submit Scores
                    </button>
                )
                )}

            {!match.completed &&
                !submittedMatches.some(
                    (submittedMatch: { matchId: number }) =>
                    submittedMatch.matchId === match.id
                ) && (
                <button
                  onClick={async () => {
                    const courtKeys = ["court1", "court2", "court3"] as const;

                    for (const courtKey of courtKeys) {
                      const courtNumber = Number(courtKey.replace("court", ""));

                      const court = courtAssignments[match.id]?.[courtKey];

                      if (!court) {
                        continue;
                      }

                      const { error } = await supabase
                        .from("match_courts")
                        .upsert(
                          {
                            match_id: match.id,
                            court_number: courtNumber,
                            ...(match.homeCaptain === captainTeam
                              ? {
                                  home_player_1: court[0] || "",
                                  home_player_2: court[1] || "",
                                }
                              : {
                                  away_player_1: court[0] || "",
                                  away_player_2: court[1] || "",
                                }),
                          },
                          {
                            onConflict: "match_id,court_number",
                          }
                        );

                      if (error) {
                        console.error(
                          `Error saving Court ${courtNumber}:`,
                          error
                        );
                        alert(
                          `Could not save Court ${courtNumber}: ${error.message}`
                        );
                        return;
                      }
                    }

                    // Keep local storage temporarily so the existing
                    // Captain Dashboard continues displaying correctly.

                    alert("Lineup saved!");
                  }}
                >
                  Save Lineup
                </button>
                )}
                    </div>
        );
      })}
    </main>
  );
}

export default CaptainDashboard;