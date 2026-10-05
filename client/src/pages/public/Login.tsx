import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Cards.css";
import { supabase } from "../../lib/supabaseClient";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const { data: authData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      console.error("Login error:", loginError);
      alert(loginError.message);
      return;
    }

    if (!authData.user) {
      alert("Login failed. No user was found.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, captain")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      alert("Your account does not have a valid profile yet.");
      await supabase.auth.signOut();
      return;
    }

    if (profile.role === "admin") {
      navigate("/admin");
      return;
    }

    if (profile.role === "captain") {
      if (!profile.captain) {
        alert("Your captain name is missing from your profile.");
        return;
      }

      navigate("/leagues");
      return;
    }

    if (profile.role === "player") {
      navigate("/leagues");
      return;
    }

    alert("Your account has an invalid role.");
  };

  return (
    <main className="card">
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <p>Email</p>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <br />
        <br />

        <p>Password</p>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <br />
        <br />

        <label>
          <input type="checkbox" />
          Remember Me
        </label>

        <br />
        <br />

        <button type="submit">Log In</button>
      </form>

      <p>
        Captains and administrators use this page to manage league
        information.
      </p>

      <p>
        Don't have an account?{" "}
        <Link to="/signup">Create one</Link>
      </p>
    </main>
  );
}

export default Login;