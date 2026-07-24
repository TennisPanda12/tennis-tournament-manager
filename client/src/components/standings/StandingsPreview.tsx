import "../../styles/Cards.css";

function StandingsPreview() {
  return (
    <section className="card">
      <h2>Current Standings</h2>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>TW</th>
            <th>TL</th>
            <th>IW</th>
            <th>IL</th>
            <th>SL</th>
            <th>GL</th>
            <th>GW%</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>1</td>
            <td>Smith</td>
            <td>5</td>
            <td>0</td>
            <td>12</td>
            <td>3</td>
            <td>5</td>
            <td>48</td>
            <td>68.4%</td>
          </tr>

          <tr>
            <td>2</td>
            <td>Garcia</td>
            <td>4</td>
            <td>1</td>
            <td>10</td>
            <td>5</td>
            <td>7</td>
            <td>61</td>
            <td>62.7%</td>
          </tr>

          <tr>
            <td>3</td>
            <td>Patel</td>
            <td>3</td>
            <td>2</td>
            <td>8</td>
            <td>7</td>
            <td>10</td>
            <td>75</td>
            <td>55.9%</td>
          </tr>

          <tr>
            <td>4</td>
            <td>Kim</td>
            <td>2</td>
            <td>3</td>
            <td>6</td>
            <td>9</td>
            <td>12</td>
            <td>82</td>
            <td>48.1%</td>
          </tr>
        </tbody>
      </table>

      <button>View Full Standings</button>
    </section>
  );
}

export default StandingsPreview;