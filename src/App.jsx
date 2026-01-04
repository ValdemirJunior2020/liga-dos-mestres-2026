import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Ranking from "./pages/Ranking.jsx";
import Rodadas from "./pages/Rodadas.jsx";
import HallDaZoeira from "./pages/HallDaZoeira.jsx";
import HallDosCampeoes from "./pages/HallDosCampeoes.jsx";
import Futebol from "./pages/Futebol.jsx";

function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

function TopNav() {
  const isMobile = useIsMobile(860);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // fecha o menu quando troca de rota
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // se virou desktop, fecha o menu
  useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile]);

  const links = useMemo(
    () => [
      { to: "/", label: "Home", end: true },
      { to: "/ranking", label: "Ranking" },
      { to: "/rodadas", label: "Rodadas" },
      { to: "/zoeira", label: "Hall da Zoeira" },
      { to: "/campeoes", label: "Campeões" },
      { to: "/futebol", label: "Futebol" },
    ],
    []
  );

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

        {/* DESKTOP NAV */}
        {!isMobile ? (
          <nav style={styles.navDesktop}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                style={({ isActive }) => linkStyle(isActive)}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        ) : (
          <>
            {/* HAMBURGER BUTTON */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              style={{
                ...styles.hamburgerBtn,
                ...(open ? styles.hamburgerBtnOpen : {}),
              }}
            >
              <span style={styles.hamburgerLine} />
              <span style={styles.hamburgerLine} />
              <span style={styles.hamburgerLine} />
            </button>
          </>
        )}
      </div>

      {/* MOBILE DROPDOWN + OVERLAY */}
      {isMobile && open ? (
        <>
          <div
            style={styles.overlay}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div style={styles.mobilePanel}>
            <nav style={styles.navMobile}>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  style={({ isActive }) => ({
                    ...styles.mobileLink,
                    ...(isActive ? styles.mobileLinkActive : {}),
                  })}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}

function linkStyle(isActive) {
  return {
    ...styles.link,
    ...(isActive ? styles.linkActive : {}),
  };
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
    zIndex: 200,
    // Menos transparente pra não “ver por trás” tanto no mobile
    background: "rgba(0,0,0,.78)",
    borderBottom: "1px solid rgba(255, 215, 0, .15)",
    backdropFilter: "blur(8px)",
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "10px 14px", // menor (mobile friendly)
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(255, 215, 0, .18)",
    objectFit: "cover",
    flexShrink: 0,
  },
  brandText: {
    fontWeight: 900,
    letterSpacing: 0.3,
    fontSize: 16,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 210,
  },

  navDesktop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "flex-end",
  },

  link: {
    textDecoration: "none",
    color: "rgba(255,255,255,.88)",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.30)",
    fontWeight: 800,
    letterSpacing: 0.2,
  },
  linkActive: {
    color: "#0b0b0b",
    border: "1px solid rgba(255,215,0,.55)",
    background: "linear-gradient(180deg, rgba(255,215,0,.95), rgba(255,193,7,.85))",
    boxShadow: "0 10px 28px rgba(255,215,0,.12)",
  },

  hamburgerBtn: {
    width: 44,
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.35)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  hamburgerBtnOpen: {
    border: "1px solid rgba(255,215,0,.35)",
    boxShadow: "0 10px 24px rgba(255,215,0,.10)",
  },
  hamburgerLine: {
    display: "block",
    width: 20,
    height: 2,
    background: "rgba(255,255,255,.88)",
    borderRadius: 999,
    margin: 2,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    zIndex: 250,
  },

  mobilePanel: {
    position: "fixed",
    top: 60,
    right: 12,
    left: 12,
    zIndex: 300,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.90)",
    backdropFilter: "blur(10px)",
    padding: 10,
  },
  navMobile: {
    display: "grid",
    gap: 8,
  },
  mobileLink: {
    textDecoration: "none",
    color: "rgba(255,255,255,.92)",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.04)",
    fontWeight: 900,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  mobileLinkActive: {
    color: "#0b0b0b",
    border: "1px solid rgba(255,215,0,.55)",
    background: "linear-gradient(180deg, rgba(255,215,0,.95), rgba(255,193,7,.85))",
  },

  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px 14px 50px",
  },
};
