import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/public/Home";
import Standings from "./pages/public/Standings";
import Teams from "./pages/public/Teams";
import About from "./pages/public/About";
import Rules from "./pages/public/Rules";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import Schedule from "./pages/public/Schedule";
import MatchDetails from "./pages/public/MatchDetails";
import SubmitScores from "./pages/captain/SubmitScores";
import SubmittedMatch from "./pages/public/SubmittedMatch";
import CaptainDashboard from "./pages/captain/CaptainDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PlayerDashboard from "./pages/player/PlayerDashboard";
import Payment from "./pages/player/Payment";
import ProtectedRoute from "./components/ProtectedRoute";
import LeagueSelection from "./pages/LeagueSelection";
import TournamentSelection from "./pages/TournamentSelection";
import TournamentHome from "./pages/TournamentHome";



export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/tournament/:tournamentId/schedule"
          element={<Schedule />}
        />
        <Route path="/standings" element={<Standings />} />
        <Route
          path="/tournament/:tournamentId/standings"
          element={<Standings />}
        />
        <Route path="/teams" element={<Teams />} />
        <Route
          path="/tournament/:tournamentId/teams"
          element={<Teams />}
        />
        <Route path="/about" element={<About />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/leagues"
          element={<LeagueSelection />}
        />
        <Route
          path="/league/:leagueId/tournaments"
          element={<TournamentSelection />}
        />
        <Route
          path="/tournament/:tournamentId"
          element={<TournamentHome />}
        />
        <Route path="/match/:matchId" element={<MatchDetails />} />
        <Route
          path="/tournament/:tournamentId/match/:matchId"
          element={<MatchDetails />}
        />
        <Route path="/match/submit/:matchId" element={<SubmitScores />} />
        <Route
          path="/tournament/:tournamentId/match/submit/:matchId"
          element={<SubmitScores />}
        />
        <Route
          path="/submitted-match/:matchId"
          element={<SubmittedMatch />}
        />
        <Route
          path="/tournament/:tournamentId/submitted-match/:matchId"
          element={<SubmittedMatch />}
        />
        <Route
          path="/captain"
          element={
            <ProtectedRoute allowedRoles={["captain"]}>
              <CaptainDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/player"
          element={
            <ProtectedRoute allowedRoles={["player"]}>
              <PlayerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/player/payment" element={<Payment />} />
      </Routes>
    </>
  );
}