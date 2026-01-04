// src/App.jsx
import React from "react";
import { HashRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Ranking from "./pages/Ranking.jsx";
import Rodadas from "./pages/Rodadas.jsx";
import HallDaZoeira from "./pages/HallDaZoeira.jsx";
import HallDosCampeoes from "./pages/HallDosCampeoes.jsx";
import Futebol from "./pages/Futebol.jsx";

function linkStyle(isActive) {
  return {
    ...styles.link,
    ...(isActive ? styles.linkActive : {}),
  };
}

function TopNav() {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.brand}>
          <img
            src="/logo.png"
            alt="Liga dos Mestres"
            style={styles.logo}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div style={styles.brandText}>Liga dos Mestres</div>
        </div>

        <nav style={styles.nav}>
          <NavLink to="/" end style={({ isActive }) => linkStyle(isActive)}>
            Home
          </NavLink>

          <NavLink to="/ranking" style={({ isActive }) => linkStyle(isActive)}>
            Ranking
          </NavLink>

          <NavLink to="/rodadas" style={({ isActive }) => linkStyle(isActive)}>
            Rodadas
          </NavLink>

          <NavLink to="/zoeira" style={({ isActive }) => linkStyle(isActive)}>
            Hall da Zoeira
          </NavLink>

          <NavLink to="/campeoes" style={({ isActive }) => linkStyle(isActive)}>
            Campeões
          </NavLink>

          <NavLink to="/futebol" style={({ isActive }) => linkStyle(isActive)}>
            Futebol
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div style={styles.app}>
        <TopNav />

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/rodadas" element={<Rodadas />} />
            <Route path="/zoeira" element={<HallDaZoeira />} />
            <Route path="/campeoes" element={<HallDosCampeoes />} />
            <Route path="/futebol" element={<Futebol />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    color: "#fff",
    background:
      "radial-gradient(1200px 700px at 15% 10%, rgba(255, 215, 0, .10), transparent 60%), radial-gradient(1200px 700px at 70% 10%, rgba(0, 255, 170, .08), transparent 60%), #050607",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(10px)",
    background: "rgba(0,0,0,.55)",
    borderBottom: "1px solid rgba(255, 215, 0, .15)",
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 220,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    border: "1px solid rgba(255, 215, 0, .18)",
    objectFit: "cover",
  },
  brandText: {
    fontWeight: 800,
    letterSpacing: 0.4,
    fontSize: 18,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  link: {
    textDecoration: "none",
    color: "rgba(255,255,255,.88)",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.30)",
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  linkActive: {
    color: "#0b0b0b",
    border: "1px solid rgba(255,215,0,.55)",
    background:
      "linear-gradient(180deg, rgba(255,215,0,.95), rgba(255,193,7,.85))",
    boxShadow: "0 10px 28px rgba(255,215,0,.12)",
  },
  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 18px 50px",
  },
};
