import "../../styles/Navbar.css";
import { Link } from "react-router-dom";

function Navbar(){

return(

<nav className="navbar">

<div className="logo">

Windyke Tennis League

</div>

<ul className="nav-links">

<li><Link to="/">Home</Link></li>

<li><Link to="/schedule">Schedule</Link></li>

<li><Link to="/standings">Standings</Link></li>

<li><Link to="/teams">Teams</Link></li>

<li><Link to="/about">About</Link></li>

<li><Link to="/rules">Rules</Link></li>

<li><Link to="/login">Login</Link></li>

</ul>

</nav>

);

}

export default Navbar;