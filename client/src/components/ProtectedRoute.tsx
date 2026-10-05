import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type Role = "admin" | "captain" | "player";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: Role[];
};

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        setLoading(false);
        return;
      }

      setAuthorized(allowedRoles.includes(profile.role as Role));
      setLoading(false);
    }

    checkUser();
  }, [allowedRoles]);

  if (loading) {
    return <p>Checking authorization...</p>;
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;