import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import { fetchJogadores, fetchRodadas } from "./utils/googleSheet.js";

const SPREADSHEET_ID = "1LmQLHOR0DlcT_DwuwGm-4fWZ9ZkB4he6G0FO0X2nnBI";

function calcRanking(jogadores, rodadas) {
  const pontosMap = new Map();
  rodadas.forEach((r) => {
    pontosMap.set(r.jogador, r.pontos || {});
  });

  const rodadaKeys = rodadas.length
    ? Object.keys(rodadas[0].pontos || {})
    : [];

  const ranking = jogadores.map((j) => {
    const pontos = pontosMap.get(j.nome) || {};
    const nums = rodadaKeys
      .map((k) => pontos[k])
      .filter((v) => typeof v === "number" && Number.isFinite(v));

    const total = nums.reduce((a, b) => a + b, 0);
    const rodadasJogadas = nums.length;
    const media = rodadasJogadas ? Number((total / rodadasJogadas).toFixed(2)) : 0;

    return {
      nome: j.nome,
      funcao: j.funcao,
      fotoUrl: j.fotoUrl,
      total: Number(total.toFixed(2)),
      media,
      rodadas: rodadasJogadas,
    };
  });

  ranking.sort((a, b) => b.total - a.total);
  return { ranking, rodadaKeys };
}

function BadgeGold({ children }) {
  return (
    <span
      className="ms-2 px-2 py-1"
      style={{
        background: "#d4af37",
        color: "#111",
        borderRadius: "10px",
        fontSize: "12px",
        fontWeight: 700,
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function RankingPage({ data }) {
  const { ranking, rodadaKeys } = data;

  return (
    <div className="container py-4">
      <div className="card-dark mb-4">
        <div className="card-dark-header">
          🏅 <strong>Ranking Geral</strong>{" "}
          <span className="pill-auto ms-auto">Auto</span>
        </div>
        <div className="card-dark-body">
          <div className="small text-muted mb-3">
            Rodadas detectadas: {rodadaKeys.length} (
            {rodadaKeys.join(", ")})
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Jogador</th>
                  <th style={{ width: 120 }}>Total</th>
                  <th style={{ width: 120 }}>Média</th>
                  <th style={{ width: 120 }}>Rodadas</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((p, idx) => (
                  <tr key={p.nome}>
                    <td><strong>{idx + 1}</strong></td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {/* FOTO */}
                        {p.fotoUrl ? (
                          <img
                            src={p.fotoUrl}
                            alt={p.nome}
                            className="avatar"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="avatar avatar-fallback" />
                        )}

                        <div>
                          <div className="fw-bold">{p.nome}</div>
                          {p.funcao ? <BadgeGold>{p.funcao}</BadgeGold> : null}
                        </div>
                      </div>
                    </td>
                    <td>{p.total} pts</td>
                    <td>{p.media}</td>
                    <td>{p.rodadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

function RodadasPage() {
  return (
    <div className="container py-4">
      <div className="card-dark">
        <div className="card-dark-header">📅 Rodadas</div>
        <div className="card-dark-body">
          <div className="text-muted">
            (Vamos montar essa página completa no próximo passo.)
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoeiraPage() {
  return (
    <div className="container py-4">
      <div className="card-dark">
        <div className="card-dark-header">😄 Hall da Zoeira</div>
        <div className="card-dark-body">
          <div className="text-muted">
            (Vamos montar essa página completa no próximo passo.)
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [jogadores, setJogadores] = useState([]);
  const [rodadas, setRodadas] = useState([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const j = await fetchJogadores(SPREADSHEET_ID);
        const r = await fetchRodadas(SPREADSHEET_ID);

        if (!alive) return;
        setJogadores(j);
        setRodadas(r);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Erro ao carregar dados.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo(() => calcRanking(jogadores, rodadas), [jogadores, rodadas]);

  return (
    <HashRouter>
      <div className="app-bg">
        <nav className="topbar">
          <div className="container d-flex align-items-center justify-content-between">
            <div className="brand">
              🏆 <span className="brand-text">Liga dos Mestres</span>
            </div>

            <div className="navlinks">
              <NavLink to="/" end className="navlink">
                Ranking
              </NavLink>
              <NavLink to="/rodadas" className="navlink">
                Rodadas
              </NavLink>
              <NavLink to="/zoeira" className="navlink">
                Hall da Zoeira
              </NavLink>
            </div>
          </div>
        </nav>

        {loading ? (
          <div className="container py-5">
            <div className="card-dark">
              <div className="card-dark-body">Carregando…</div>
            </div>
          </div>
        ) : err ? (
          <div className="container py-5">
            <div className="alert alert-danger">{err}</div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<RankingPage data={data} />} />
            <Route path="/rodadas" element={<RodadasPage />} />
            <Route path="/zoeira" element={<ZoeiraPage />} />
          </Routes>
        )}
      </div>
    </HashRouter>
  );
}
