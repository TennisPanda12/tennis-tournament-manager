import "../../styles/Cards.css";

function Schedule() {
  return (
    <main className="card">

      <h1>Match Schedule</h1>

      <p>
        View upcoming league matches.
      </p>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Location</th>
            <th>Home</th>
            <th>Visitor</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>July 30</td>
            <td>6:30 PM</td>
            <td>Windyke</td>
            <td>Smith</td>
            <td>Patel</td>
          </tr>

          <tr>
            <td>Aug 2</td>
            <td>7:00 PM</td>
            <td>Ridgeway</td>
            <td>Garcia</td>
            <td>Kim</td>
          </tr>

          <tr>
            <td>Aug 5</td>
            <td>4:30 PM</td>
            <td>Ridgeway</td>
            <td>Lee</td>
            <td>Johnson</td>
          </tr>

          <tr>
            <td>Aug 10</td>
            <td>3:00 PM</td>
            <td>Windyke</td>
            <td>Patel</td>
            <td>Kim</td>
          </tr>
        </tbody>
      </table>

    </main>
  );
}

export default Schedule;