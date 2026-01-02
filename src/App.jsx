// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import { fetchJogadores, fetchRodadas, fetchZoeira, fetchCampeoes } from "./utils/googleSheet.js";

const SPREADSHEET_ID = "1LmQLHOR0DlcT_DwuwGm-4fWZ9ZkB4he6G0FO0X2nnBI";

function calcRanking(jogadores, rodadas) {
  const pontosMap = new Map();
  rodadas.forEach((r) => {
    pontosMap.set(r.jogador, r.pontos || {});
  });

  const rodadaKeys = rodadas.length ? Object.keys(rodadas[0].pontos || {}) : [];

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
      pontosPorRodada: pontos,
    };
  });

  ranking.sort((a, b) => b.total - a.total);
  return { ranking, rodadaKeys };
}

function BadgeGold({ children }) {
  return (
    <span className="badge-gold ms-2" title={String(children)}>
      {children}
    </span>
  );
}

function Avatar({ name, url }) {
  if (!url) return <div className="avatar-fallback" title={name} />;
  return (
    <img
      src={url}
      alt={name}
      className="avatar"
      referrerPolicy="no-referrer"
      onError={(e) => {
        // fallback if url fails
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

function TopNav() {
  return (
    <div className="topnav">
      <div className="topnav-inner">
        <a className="topnav-brand" href="#/">
          <img className="topnav-logo-img" src="/logo.png" alt="Liga dos Mestres" />
          <div className="topnav-title">Liga dos Mestres</div>
        </a>

        <div className="topnav-links">
          <NavLink to="/" end className={({ isActive }) => `topnav-link ${isActive ? "active" : ""}`}>
            Ranking
          </NavLink>
          <NavLink to="/rodadas" className={({ isActive }) => `topnav-link ${isActive ? "active" : ""}`}>
            Rodadas
          </NavLink>
          <NavLink to="/zoeira" className={({ isActive }) => `topnav-link pill ${isActive ? "active" : ""}`}>
            Hall da Zoeira
          </NavLink>
          <NavLink to="/campeoes" className={({ isActive }) => `topnav-link pill ${isActive ? "active" : ""}`}>
            Campeões
          </NavLink>
        </div>
      </div>
    </div>
  );
}

function RankingPage({ data }) {
  const { ranking, rodadaKeys } = data;

  return (
    <div className="container py-4">
      <div className="card-dark mb-4">
        <div className="card-dark-header">
          🏅 <strong>Ranking Geral</strong>
          <span className="pill-auto">Auto</span>
        </div>

        <div className="card-dark-body">
          <div className="small text-muted mb-3">Rodadas detectadas: {rodadaKeys.length}</div>

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
                    <td>
                      <strong>{idx + 1}</strong>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <Avatar name={p.nome} url={p.fotoUrl} />
                        <div>
                          <div className="fw-bold">{p.nome}</div>
                          {p.funcao ? <BadgeGold>{p.funcao}</BadgeGold> : null}
                        </div>
                      </div>
                    </td>
                    <td className="fw-bold">{p.total} pts</td>
                    <td>{p.media}</td>
                    <td>{p.rodadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="small text-muted mt-3">
            Dica: quando você preencher a planilha, isso aqui vai refletir automaticamente.
          </div>
        </div>
      </div>
    </div>
  );
}

function RodadasPage({ data }) {
  const { ranking, rodadaKeys } = data;
  const [selected, setSelected] = useState("");

  // ✅ no effect setState loop:
  const selectedKey = useMemo(() => {
    if (rodadaKeys.length === 0) return "R1";
    if (selected && rodadaKeys.includes(selected)) return selected;
    return rodadaKeys[0];
  }, [rodadaKeys, selected]);

  const rodadaRows = useMemo(() => {
    const rows = ranking.map((p) => ({
      nome: p.nome,
      funcao: p.funcao,
      fotoUrl: p.fotoUrl,
      pontos: Number(p.pontosPorRodada?.[selectedKey] ?? 0),
    }));
    rows.sort((a, b) => b.pontos - a.pontos);
    return rows;
  }, [ranking, selectedKey]);

  return (
    <div className="container py-4">
      <div className="card-dark mb-4">
        <div className="card-dark-header">
          📅 <strong>Rodadas</strong>
          <span className="pill-auto">{selectedKey}</span>
        </div>

        <div className="card-dark-body">
          <div className="d-flex flex-wrap gap-2 mb-3">
            {rodadaKeys.map((r) => (
              <button
                key={r}
                className={`btn ${r === selectedKey ? "btn-warning" : "btn-outline-light"}`}
                style={{ padding: "6px 12px", borderRadius: 12, fontWeight: 800 }}
                onClick={() => setSelected(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Jogador</th>
                  <th style={{ width: 160 }}>Pontos ({selectedKey})</th>
                </tr>
              </thead>
              <tbody>
                {rodadaRows.map((p, idx) => (
                  <tr key={p.nome}>
                    <td>
                      <strong>{idx + 1}</strong>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <Avatar name={p.nome} url={p.fotoUrl} />
                        <div>
                          <div className="fw-bold">{p.nome}</div>
                          {p.funcao ? <BadgeGold>{p.funcao}</BadgeGold> : null}
                        </div>
                      </div>
                    </td>
                    <td className="fw-bold">{p.pontos} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="small text-muted mt-3">
            Dica: quando você preencher a planilha, isso aqui vai refletir automaticamente.
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoeiraPage({ jogadores }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [zoeiraInfo, setZoeiraInfo] = useState({ ok: true, message: "", items: [], rodadas: [] });
  const [selected, setSelected] = useState("R1");

  const fotoMap = useMemo(() => {
    const m = new Map();
    (jogadores || []).forEach((j) => m.set(j.nome, j.fotoUrl || ""));
    return m;
  }, [jogadores]);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const z = await fetchZoeira(SPREADSHEET_ID);
      setZoeiraInfo(z);

      // auto set selected to first rodada available
      if (z?.rodadas?.length) setSelected(z.rodadas[0]);
      else setSelected("R1");
    } catch (e) {
      setErr(e?.message || "Erro ao carregar Zoeira.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rodadas = zoeiraInfo.rodadas?.length ? zoeiraInfo.rodadas : ["R1", "R2", "R3", "R4"];
  const selectedKey = rodadas.includes(selected) ? selected : rodadas[0];

  const items = useMemo(() => {
    const list = zoeiraInfo.items || [];
    return list.filter((x) => String(x.rodada).trim().toUpperCase() === String(selectedKey).trim().toUpperCase());
  }, [zoeiraInfo, selectedKey]);

  const tipoClass = (tipo) => {
    const t = String(tipo || "").toUpperCase().trim();
    if (t === "MITADA") return "tag-mitada";
    if (t === "ZIKA") return "tag-zika";
    if (t === "PIPOCA") return "tag-pipoca";
    return "tag-default";
  };

  return (
    <div className="container py-4">
      <div className="card-dark">
        <div className="card-dark-header d-flex align-items-center justify-content-between">
          <div>😄 <strong>Hall da Zoeira</strong></div>
          <span className="pill-auto">{selectedKey}</span>
        </div>

        <div className="card-dark-body">
          {loading ? (
            <div className="text-muted">Carregando…</div>
          ) : err ? (
            <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3">
              <div>{err}</div>
              <button className="btn btn-warning" onClick={load}>
                Tentar novamente
              </button>
            </div>
          ) : !zoeiraInfo.ok ? (
            <div className="zoeira-empty">
              <div className="text-warning fw-bold">Hall da Zoeira</div>
              <div className="mt-2">{selectedKey}</div>
              <div className="text-muted mt-2">{zoeiraInfo.message}</div>
              <div className="text-muted mt-2">
                Confere se a primeira linha tem os cabeçalhos: <strong>Rodada, Tipo, Jogador, Texto, Link</strong>
              </div>
            </div>
          ) : (
            <>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {rodadas.map((r) => (
                  <button
                    key={r}
                    className={`btn ${r === selectedKey ? "btn-warning" : "btn-outline-light"}`}
                    style={{ padding: "6px 12px", borderRadius: 12, fontWeight: 800 }}
                    onClick={() => setSelected(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {items.length === 0 ? (
                <div className="text-muted">
                  Nada ainda nessa rodada 😅 — adiciona na aba <strong>Zoeira</strong> da planilha.
                </div>
              ) : (
                <div className="zoeira-list">
                  {items.map((x, i) => {
                    const foto = fotoMap.get(x.jogador) || "";
                    return (
                      <div className="zoeira-card" key={`${x.rodada}-${x.tipo}-${x.jogador}-${i}`}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="zoeira-avatar">
                            <Avatar name={x.jogador} url={foto} />
                          </div>

                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className={`zoeira-tag ${tipoClass(x.tipo)}`}>{x.tipo}</span>
                              <div className="fw-bold">{x.jogador}</div>
                            </div>
                            <div className="mt-1">{x.texto}</div>

                            {x.link ? (
                              <div className="mt-2">
                                <a className="zoeira-link" href={x.link} target="_blank" rel="noreferrer">
                                  Ver link
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CampeoesPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ ok: true, message: "", items: [], anos: [] });

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const d = await fetchCampeoes(SPREADSHEET_ID);
      setData(d);
    } catch (e) {
      setErr(e?.message || "Erro ao carregar Campeões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    (data.items || []).forEach((it) => {
      const ano = String(it.ano || "").trim();
      const comp = String(it.competicao || "").trim(); // Liga/Copa
      if (!ano || !comp) return;
      const key = `${ano}__${comp}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    });

    // sort inside each group by posicao asc
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => Number(a.posicao) - Number(b.posicao));
      map.set(k, arr);
    }

    // years list already sorted desc in data.anos
    return map;
  }, [data]);

  const anos = data.anos?.length ? data.anos : [];

  const labelComp = (c) => {
    const t = String(c || "").toLowerCase();
    if (t.includes("copa")) return "Copa dos Mestres";
    return "Liga dos Mestres";
  };

  return (
    <div className="container py-4">
      <div className="card-dark">
        <div className="card-dark-header d-flex align-items-center justify-content-between">
          <div>🏆 <strong>Hall dos Campeões</strong></div>
          <button className="btn btn-outline-light btn-sm" onClick={load}>
            Atualizar
          </button>
        </div>

        <div className="card-dark-body">
          {loading ? (
            <div className="text-muted">Carregando…</div>
          ) : err ? (
            <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3">
              <div>{err}</div>
              <button className="btn btn-warning" onClick={load}>
                Tentar novamente
              </button>
            </div>
          ) : !data.ok ? (
            <div className="text-muted">{data.message}</div>
          ) : anos.length === 0 ? (
            <div className="text-muted">Sem dados em CampeoesData.</div>
          ) : (
            <div className="campeoes-wrap">
              {anos.map((ano) => {
                const ligaKey = `${ano}__Liga`;
                const copaKey = `${ano}__Copa`;

                const liga = grouped.get(ligaKey) || grouped.get(`${ano}__LIGA`) || grouped.get(`${ano}__liga`) || [];
                const copa = grouped.get(copaKey) || grouped.get(`${ano}__COPA`) || grouped.get(`${ano}__copa`) || [];

                // also accept if Competicao is full text
                const ligaAlt = liga.length
                  ? liga
                  : Array.from(grouped.entries())
                      .filter(([k]) => k.startsWith(`${ano}__`) && k.toLowerCase().includes("liga"))
                      .flatMap(([, v]) => v);

                const copaAlt = copa.length
                  ? copa
                  : Array.from(grouped.entries())
                      .filter(([k]) => k.startsWith(`${ano}__`) && k.toLowerCase().includes("copa"))
                      .flatMap(([, v]) => v);

                const ligaRows = ligaAlt;
                const copaRows = copaAlt;

                return (
                  <div className="campeoes-year" key={ano}>
                    <div className="campeoes-year-title">{ano}</div>

                    <div className="campeoes-grid">
                      <div className="campeoes-card">
                        <div className="campeoes-card-title">🥇 {labelComp("Liga")}</div>

                        {ligaRows.length === 0 ? (
                          <div className="text-muted">Sem dados</div>
                        ) : (
                          <div className="campeoes-list">
                            {ligaRows.map((x) => (
                              <div className="campeoes-row" key={`${x.ano}-${x.competicao}-${x.posicao}-${x.time}`}>
                                <div className="campeoes-pos">{x.posicao}</div>
                                <div className="campeoes-main">
                                  <div className="campeoes-team">{x.time}</div>
                                  {x.jogador ? <div className="campeoes-player">{x.jogador}</div> : null}
                                </div>
                                <div className="campeoes-points">
                                  {x.pontos !== "" ? Number(x.pontos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="campeoes-card">
                        <div className="campeoes-card-title">🏆 {labelComp("Copa")}</div>

                        {copaRows.length === 0 ? (
                          <div className="text-muted">Sem dados</div>
                        ) : (
                          <div className="campeoes-list">
                            {copaRows.map((x) => (
                              <div className="campeoes-row" key={`${x.ano}-${x.competicao}-${x.posicao}-${x.time}`}>
                                <div className="campeoes-pos">{x.posicao}</div>
                                <div className="campeoes-main">
                                  <div className="campeoes-team">{x.time}</div>
                                  {x.jogador ? <div className="campeoes-player">{x.jogador}</div> : null}
                                </div>
                                <div className="campeoes-points">
                                  {x.pontos !== "" ? Number(x.pontos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="small text-muted mt-2">Resultados oficiais</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="small text-muted mt-3">
            A aba <strong>CampeoesData</strong> precisa ter os cabeçalhos: Ano, Competicao, Posicao, Time, Jogador, Pontos, Link
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

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const j = await fetchJogadores(SPREADSHEET_ID);
      const r = await fetchRodadas(SPREADSHEET_ID);
      setJogadores(j);
      setRodadas(r);
    } catch (e) {
      setErr(e?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const data = useMemo(() => calcRanking(jogadores, rodadas), [jogadores, rodadas]);

  return (
    <HashRouter>
      <div className="app-bg">
        <TopNav />

        {loading ? (
          <div className="container py-5">
            <div className="card-dark">
              <div className="card-dark-body">Carregando…</div>
            </div>
          </div>
        ) : err ? (
          <div className="container py-5">
            <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3">
              <div>{err}</div>
              <button className="btn btn-warning" onClick={load}>
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<RankingPage data={data} />} />
            <Route path="/rodadas" element={<RodadasPage data={data} />} />
            <Route path="/zoeira" element={<ZoeiraPage jogadores={jogadores} />} />
            <Route path="/campeoes" element={<CampeoesPage />} />
          </Routes>
        )}
      </div>
    </HashRouter>
  );
}
