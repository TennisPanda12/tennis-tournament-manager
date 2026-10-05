import { useState } from "react";
type CourtScore = {
  set1Home: string;
  set1Away: string;
  set2Home: string;
  set2Away: string;
  tiebreakHome: string;
  tiebreakAway: string;
};

type CourtScoreFormProps = {
  courtNumber: number;
  homeCaptain: string;
  awayCaptain: string;
  homePlayers: string[];
  awayPlayers: string[];
  onScoreChange: (score: CourtScore) => void;
};

function CourtScoreForm({
  courtNumber,
  homeCaptain,
  awayCaptain,
  homePlayers,
  awayPlayers,
  onScoreChange,
}: CourtScoreFormProps) {

  const [set1Home, setSet1Home] = useState("");
  const [set1Away, setSet1Away] = useState("");

  const [set2Home, setSet2Home] = useState("");
  const [set2Away, setSet2Away] = useState("");

  const [tiebreakHome, setTiebreakHome] = useState("");
  const [tiebreakAway, setTiebreakAway] = useState("");

  const updateScore = (
  field: keyof CourtScore,
  value: string
) => {
  const score: CourtScore = {
    set1Home,
    set1Away,
    set2Home,
    set2Away,
    tiebreakHome,
    tiebreakAway,
    [field]: value,
  };

  onScoreChange(score);
};

  const getCourtWinner = () => {
    let homeSets = 0;
    let awaySets = 0;

    if (set1Home !== "" && set1Away !== "") {
      if (Number(set1Home) > Number(set1Away)) {
        homeSets++;
      } else if (Number(set1Away) > Number(set1Home)) {
        awaySets++;
      }
    }

    if (set2Home !== "" && set2Away !== "") {
      if (Number(set2Home) > Number(set2Away)) {
        homeSets++;
      } else if (Number(set2Away) > Number(set2Home)) {
        awaySets++;
      }
    }

    if (homeSets > awaySets) {
      return `${homeCaptain} wins`;
    }

    if (awaySets > homeSets) {
      return `${awayCaptain} wins`;
    }

    if (tiebreakHome !== "" && tiebreakAway !== "") {
      if (Number(tiebreakHome) === 1) {
        return `${homeCaptain} wins`;
      }

      if (Number(tiebreakAway) === 1) {
        return `${awayCaptain} wins`;
      }
    }

    return "Court winner not determined";
  };

  return (
    <section>
      <h2>Court {courtNumber}</h2>

      <p>
        {homeCaptain} Doubles Team:{" "}
        {homePlayers.filter(Boolean).join(" & ") || "TBD"}
        {" vs "}
        {awayCaptain} Doubles Team:{" "}
        {awayPlayers.filter(Boolean).join(" & ") || "TBD"}
      </p>

      <h3>Set 1</h3>

      <label>
        {homeCaptain}:
        <input
          type="number"
          min="0"
          value={set1Home}
          onChange={(e) => {
            setSet1Home(e.target.value);
            updateScore("set1Home", e.target.value);
          }}
        />
      </label>

      <label>
        {awayCaptain}:
        <input
          type="number"
          min="0"
          value={set1Away}
          onChange={(e) => {
            setSet1Away(e.target.value);
            updateScore("set1Away", e.target.value);
          }}
        />
      </label>

      <h3>Set 2</h3>

      <label>
        {homeCaptain}:
        <input
          type="number"
          min="0"
          value={set2Home}
          onChange={(e) => {
            setSet2Home(e.target.value);
            updateScore("set2Home", e.target.value);
          }}
        />
      </label>

      <label>
        {awayCaptain}:
        <input
          type="number"
          min="0"
          value={set2Away}
          onChange={(e) => {
            setSet2Away(e.target.value);
            updateScore("set2Away", e.target.value);
          }}
        />
      </label>

      <h3>Tiebreaker</h3>

      <label>
        {homeCaptain}:
        <input
          type="number"
          min="0"
          max="1"
          value={tiebreakHome}
          onChange={(e) => {
            setTiebreakHome(e.target.value);
            updateScore("tiebreakHome", e.target.value);
          }}
        />
      </label>

      <label>
        {awayCaptain}:
        <input
          type="number"
          min="0"
          max="1"
          value={tiebreakAway}
          onChange={(e) => {
            setTiebreakAway(e.target.value);
            updateScore("tiebreakAway", e.target.value);
          }}
        />
      </label>

      <h3>Court Result</h3>

      <p>{getCourtWinner()}</p>

      <hr />
    </section>
  );
}

export default CourtScoreForm;