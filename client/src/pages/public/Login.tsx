import "../../styles/Cards.css";

function Login() {
  return (
    <main className="card">
      <h1>Login</h1>

      <form>

        <p>Email</p>
        <input type="email" />

        <br /><br />

        <p>Password</p>
        <input type="password" />

        <br /><br />

        <label>
          <input type="checkbox" />
          Remember Me
        </label>

        <br /><br />

        <button>Log In</button>

      </form>

      <p>
        Captains and administrators use this page to manage league information.
      </p>
    </main>
  );
}

export default Login;