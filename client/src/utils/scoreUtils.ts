export type CourtScore = {
  set1Home: number | string;
  set1Away: number | string;
  set2Home: number | string;
  set2Away: number | string;
  tiebreakHome?: number | string;
  tiebreakAway?: number | string;
};

export function getCourtWinner(
  score: CourtScore
): "home" | "away" | null {
  let homeSets = 0;
  let awaySets = 0;

  if (
    score.set1Home !== "" &&
    score.set1Away !== ""
  ) {
    if (
      Number(score.set1Home) >
      Number(score.set1Away)
    ) {
      homeSets++;
    } else if (
      Number(score.set1Away) >
      Number(score.set1Home)
    ) {
      awaySets++;
    }
  }

  if (
    score.set2Home !== "" &&
    score.set2Away !== ""
  ) {
    if (
      Number(score.set2Home) >
      Number(score.set2Away)
    ) {
      homeSets++;
    } else if (
      Number(score.set2Away) >
      Number(score.set2Home)
    ) {
      awaySets++;
    }
  }

  if (homeSets > awaySets) {
    return "home";
  }

  if (awaySets > homeSets) {
    return "away";
  }

  if (score.tiebreakHome === "1") {
    return "home";
  }

  if (score.tiebreakAway === "1") {
    return "away";
  }

  return null;
}

export function getMatchResult(
  courts: CourtScore[]
) {
  let homeCourtWins = 0;
  let awayCourtWins = 0;

  courts.forEach((court) => {
    const winner = getCourtWinner(court);

    if (winner === "home") {
      homeCourtWins++;
    } else if (winner === "away") {
      awayCourtWins++;
    }
  });

  return {
    homeCourtWins,
    awayCourtWins,
  };
}