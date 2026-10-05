import { Link } from "react-router-dom";
import "../../styles/Cards.css";

function Payment() {
  return (
    <main className="card">
      <h1>Pay League Fee</h1>

      <p>
        Use this page to pay your tennis league fee.
      </p>

      <h2>League Fee</h2>

      <p>
        <strong>Amount:</strong> $100
      </p>

      <button type="button">
        Pay Now
      </button>

      <br />
      <br />

      <Link to="/player">
        Back to Player Dashboard
      </Link>
    </main>
  );
}

export default Payment;