import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/public/Home";
import Standings from "./pages/public/Standings";
import Teams from "./pages/public/Teams";
import About from "./pages/public/About";
import Rules from "./pages/public/Rules";
import Login from "./pages/public/Login";
import Schedule from "./pages/public/Schedule";



export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/about" element={<About />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}