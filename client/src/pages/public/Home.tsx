import Hero from "../../components/common/Hero";
import QuickLinks from "../../components/common/QuickLinks";
import UpcomingMatches from "../../components/matches/UpcomingMatches";
import StandingsPreview from "../../components/standings/StandingsPreview";
import Announcements from "../../components/common/Announcements";

function Home() {
  return (
    <main>
      <Hero />
      <QuickLinks />
      <UpcomingMatches />
      <StandingsPreview />
      <Announcements />
    </main>
  );
}

export default Home;