import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Cards.css";
import { supabase } from "../../lib/supabaseClient";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"player" | "captain">("player");
  const [captain, setCaptain] = useState("");

  const handleSignup = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (role === "captain" && !captain.trim()) {
      alert("Please enter your captain name.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          captain: role === "captain" ? captain.trim() : null,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      alert(error.message);
      return;
    }

    if (!data.user) {
      alert("Signup failed. Please try again.");
      return;
    }

    alert(
      "Account created successfully. Please check your email if confirmation is required."
    );

    navigate("/login");
  };

  return (
    <main className="card">
      <h1>Create an Account</h1>

      <form onSubmit={handleSignup}>
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
          minLength={6}
        />

        <br />
        <br />

        <p>Confirm Password</p>

        <input
          type="password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          required
          minLength={6}
        />

        <br />
        <br />

        <p>Account Type</p>

        <label>
          <input
            type="radio"
            name="role"
            value="player"
            checked={role === "player"}
            onChange={() => setRole("player")}
          />
          Player
        </label>

        <br />

        <label>
          <input
            type="radio"
            name="role"
            value="captain"
            checked={role === "captain"}
            onChange={() => setRole("captain")}
          />
          Captain
        </label>

        {role === "captain" && (
          <>
            <br />
            <br />

            <p>Captain Name</p>

            <input
              type="text"
              value={captain}
              onChange={(event) => setCaptain(event.target.value)}
              required
            />
          </>
        )}

        <br />
        <br />

        <button type="submit">Create Account</button>
      </form>

      <p>
        Already have an account?{" "}
        <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}

export default Signup;