import { NavLink } from "react-router-dom";

export default function TopNav() {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        
        {/* LOGO + NOME */}
        <NavLink to="/" className="topnav-brand">
          <img
            src="/logo.png"
            alt="Liga dos Mestres"
            className="topnav-logo-img"
          />
          <span className="topnav-title">Liga dos Mestres</span>
        </NavLink>

        {/* LINKS */}
        <div className="topnav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `topnav-link ${isActive ? "active" : ""}`
            }
          >
            Ranking
          </NavLink>

          <NavLink
            to="/rodadas"
            className={({ isActive }) =>
              `topnav-link ${isActive ? "active" : ""}`
            }
          >
            Rodadas
          </NavLink>

          <NavLink
            to="/zoeira"
            className={({ isActive }) =>
              `topnav-link pill ${isActive ? "active" : ""}`
            }
          >
            Hall da Zoeira
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
