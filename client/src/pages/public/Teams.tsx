import "../../styles/Cards.css";

function Teams() {
  return (
    <main className="card">
      <h1>League Teams</h1>

      <div className="card">
        <h2>Smith</h2>
        <p><strong>Captain:</strong> John Smith</p>

        <h3>Players</h3>

        <ul>
          <li>Alice</li>
          <li>Emily</li>
          <li>Sarah</li>
          <li>Jessica</li>
          <li>Megan</li>
          <li>Olivia</li>
          <li>Rachel</li>
          <li>Kate</li>
        </ul>
      </div>

      <div className="card">
        <h2>Patel</h2>
        <p><strong>Captain:</strong> Raj Patel</p>

        <h3>Players</h3>

        <ul>
          <li>Emma</li>
          <li>Sophia</li>
          <li>Grace</li>
          <li>Julia</li>
          <li>Lauren</li>
          <li>Chloe</li>
          <li>Brooke</li>
          <li>Anna</li>
        </ul>
      </div>
    </main>
  );
}

export default Teams;