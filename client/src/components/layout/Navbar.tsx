import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Navbar.css";
import { supabase } from "../../lib/supabaseClient";

type UserRole = "admin" | "captain" | "player";

function Navbar() {
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, captain")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        console.error("Profile error:", error);
        setRole(null);
        return;
      }

      setRole(profile.role as UserRole);
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert("Unable to log out.");
      return;
    }

    setRole(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="logo">
        Windyke Tennis League
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
        </li>

        <li>
          <Link to="/schedule">Schedule</Link>
        </li>

        <li>
          <Link to="/standings">Standings</Link>
        </li>

        <li>
          <Link to="/teams">Teams</Link>
        </li>

        <li>
          <Link to="/about">About</Link>
        </li>

        <li>
          <Link to="/rules">Rules</Link>
        </li>

        {!role && (
          <li>
            <Link to="/login">Login</Link>
          </li>
        )}

        {role === "admin" && (
          <li>
            <Link to="/admin">Admin Dashboard</Link>
          </li>
        )}

        {role === "captain" && (
          <li>
            <Link to="/captain">Captain Dashboard</Link>
          </li>
        )}

        {role === "player" && (
          <li>
            <Link to="/player">Player Dashboard</Link>
          </li>
        )}

        {role && (
          <li>
            <button type="button" onClick={handleLogout}>
              Log Out
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;