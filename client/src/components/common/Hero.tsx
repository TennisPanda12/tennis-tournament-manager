import "../../styles/Hero.css";

function Hero() {

  return (

    <section className="hero">

      <div className="hero-content">

        <h1>Windyke Tennis League</h1>

        <p>
          Manage schedules, scores, standings, player rosters, and league matches
          in one place.
        </p>

        <div className="hero-buttons">

          <button>View Schedule</button>

          <button>Current Standings</button>

        </div>

      </div>

    </section>

  );

}

export default Hero;