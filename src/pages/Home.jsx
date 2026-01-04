// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { SHEET_ID } from "../config.js";
import { fetchJogadores, fetchRodadas, fetchZoeira, fetchCampeoes } from "../utils/googleSheet.js";
import "./home.css";

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatPts(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return (Math.round(num * 10) / 10).toFixed(1);
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [rodadas, setRodadas] = useState([]);
  const [zoeira, setZoeira] = useState({ ok: true, items: [], rodadas: [] });
  const [campeoes, setCampeoes] = useState({ ok: true, items: [], anos: [] });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (!SHEET_ID) throw new Error("SHEET_ID vazio (config.js)");

        const [jogs, rods, z, c] = await Promise.all([
          fetchJogadores(SHEET_ID),
          fetchRodadas(SHEET_ID),
          fetchZoeira(SHEET_ID),
          fetchCampeoes(SHEET_ID),
        ]);

        setPlayers(jogs || []);
        setRodadas(rods || []);
        setZoeira(z || { ok: true, items: [], rodadas: [] });
        setCampeoes(c || { ok: true, items: [], anos: [] });
      } catch (e) {
        setError(e?.message || "Erro ao carregar Home");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ----------------------------
  // Ranking (top 5 preview)
  // ----------------------------
  const ranking = useMemo(() => {
    const pontosMap = {};
    rodadas.forEach((r) => {
      pontosMap[norm(r.jogador)] = r.pontos || {};
    });

    const rows = players.map((p) => {
      const pontos = pontosMap[norm(p.nome)] || {};
      const vals = Object.values(pontos).filter((n) => typeof n === "number" && Number.isFinite(n));
      const total = vals.reduce((a, b) => a + b, 0);
      const media = vals.length ? total / vals.length : 0;

      return {
        nome: p.nome,
        fotoUrl: p.fotoUrl || "",
        funcao: p.funcao || "",
        total,
        media,
        rodadas: vals.length,
      };
    });

    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [players, rodadas]);

  const top5 = useMemo(() => ranking.slice(0, 5), [ranking]);

  // ----------------------------
  // Rodada atual (estimativa pelo maior "Rxx" que aparece nas rodadas)
  // ----------------------------
  const rodadaAtual = useMemo(() => {
    const set = new Set();
    rodadas.forEach((r) => Object.keys(r.pontos || {}).forEach((k) => /^r\d+$/i.test(k) && set.add(k)));
    const keys = Array.from(set).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    return keys.length ? Number(keys[keys.length - 1].slice(1)) : 1;
  }, [rodadas]);

  // ----------------------------
  // Pior pontuação da rodada (pega a última rodada e acha o menor)
  // ----------------------------
  const piorDaRodada = useMemo(() => {
    const key = `R${rodadaAtual}`;
    const rows = rodadas
      .map((r) => {
        const v = r?.pontos?.[key] ?? r?.pontos?.[key.toLowerCase()] ?? "";
        const num = Number(v);
        return { jogador: r.jogador, pontos: Number.isFinite(num) ? num : null };
      })
      .filter((x) => x.jogador && x.pontos != null);

    if (!rows.length) return null;

    rows.sort((a, b) => a.pontos - b.pontos);
    const worst = rows[0];

    const p = players.find((pp) => norm(pp.nome) === norm(worst.jogador));
    return {
      nome: worst.jogador,
      pontos: worst.pontos,
      fotoUrl: p?.fotoUrl || "",
    };
  }, [rodadas, rodadaAtual, players]);

  // ----------------------------
  // Hall da Zoeira destaque (pega o item mais recente)
  // ----------------------------
  const zoeiraDestaque = useMemo(() => {
    const items = zoeira?.items || [];
    if (!items.length) return null;
    // tenta ordenar por rodada número (assumindo "Rodada 1", "R1", etc)
    const sorted = [...items].sort((a, b) => {
      const na = Number(String(a.rodada || "").replace(/[^0-9]/g, "")) || 0;
      const nb = Number(String(b.rodada || "").replace(/[^0-9]/g, "")) || 0;
      return nb - na;
    });
    return sorted[0];
  }, [zoeira]);

  // ----------------------------
  // Histórico da liga (campeões) — pega 2 linhas recentes
  // ----------------------------
  const campeoesRecentes = useMemo(() => {
    const items = campeoes?.items || [];
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => Number(b.ano) - Number(a.ano));
    return sorted.slice(0, 2);
  }, [campeoes]);

  return (
    <div className="lm-page">
      <div className="lm-hero">
        <div className="lm-hero-inner">
          <div className="lm-badge">
            <img
              src="/logo.png"
              alt="Liga dos Mestres"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>

          <div className="lm-hero-text">
            <div className="lm-title">LIGA DOS MESTRES</div>
            <div className="lm-subtitle">— Cartola Fantasy —</div>

            <div className="lm-countdown">
              <span className="lm-countdown-label">PRÓXIMA RODADA EM:</span>
              <span className="lm-countdown-value">em breve</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? <div className="lm-box">Carregando dashboard...</div> : null}
      {error ? <div className="lm-error">{error}</div> : null}

      {!loading && !error ? (
        <div className="lm-grid">
          {/* LEFT: Ranking Preview */}
          <div className="lm-card lm-card--tall">
            <div className="lm-card-header">
              <div className="lm-card-title">🏆 Ranking</div>
              <div className="lm-card-meta">Rodada {rodadaAtual}</div>
            </div>

            <div className="lm-ranking">
              {top5.map((p, idx) => (
                <div key={p.nome} className="lm-row">
                  <div className="lm-ranknum">{idx + 1}</div>

                  <div className="lm-avatar">
                    {p.fotoUrl ? (
                      <img
                        src={p.fotoUrl}
                        alt={p.nome}
                        loading="lazy"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="lm-avatar-fallback" />
                    )}
                  </div>

                  <div className="lm-row-main">
                    <div className="lm-name">{p.nome}</div>
                    <div className="lm-mini">{p.funcao || "Jogador"}</div>
                  </div>

                  <div className="lm-row-right">
                    <div className="lm-big">{formatPts(p.media)}</div>
                    <div className="lm-mini">{Math.round(p.total)} pts</div>
                  </div>
                </div>
              ))}

              {!top5.length ? <div className="lm-box">Sem dados no Ranking ainda.</div> : null}
            </div>
          </div>

          {/* RIGHT TOP: Pior Pontuação */}
          <div className="lm-card">
            <div className="lm-card-header">
              <div className="lm-card-title">🚧 Pior Pontuação da Rodada</div>
              <div className="lm-card-meta">Rodada {rodadaAtual}</div>
            </div>

            {piorDaRodada ? (
              <div className="lm-worst">
                <div className="lm-worst-avatar">
                  {piorDaRodada.fotoUrl ? (
                    <img
                      src={piorDaRodada.fotoUrl}
                      alt={piorDaRodada.nome}
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="lm-avatar-fallback" />
                  )}
                </div>

                <div className="lm-worst-main">
                  <div className="lm-worst-name">{piorDaRodada.nome}</div>
                  <div className="lm-worst-pts">{formatPts(piorDaRodada.pontos)} pts</div>
                  <div className="lm-worst-sub">Eterno lanterninha? 😅</div>
                </div>
              </div>
            ) : (
              <div className="lm-box">Sem dados suficientes pra calcular o pior.</div>
            )}
          </div>

          {/* RIGHT MID: Histórico da Liga */}
          <div className="lm-card">
            <div className="lm-card-header">
              <div className="lm-card-title">📜 Histórico da Liga</div>
              <div className="lm-card-meta">Campeões recentes</div>
            </div>

            {campeoesRecentes.length ? (
              <div className="lm-history">
                {campeoesRecentes.map((c, idx) => (
                  <div key={`${c.ano}-${idx}`} className="lm-history-row">
                    <div className="lm-history-left">
                      <div className="lm-history-name">{c.jogador || c.time || "—"}</div>
                      <div className="lm-mini">{c.competicao} • {c.posicao}</div>
                    </div>
                    <div className="lm-history-right">
                      <div className="lm-big">{c.ano}</div>
                      <div className="lm-mini">{c.pontos ? `${c.pontos} pts` : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="lm-box">Sem dados em CampeoesData ainda.</div>
            )}
          </div>

          {/* RIGHT BOTTOM: Hall da Zoeira highlight */}
          <div className="lm-card">
            <div className="lm-card-header">
              <div className="lm-card-title">😅 O Hall da Zoeira</div>
              <div className="lm-card-meta">Destaque</div>
            </div>

            {zoeiraDestaque ? (
              <div className="lm-zoeira">
                <div className="lm-zoeira-top">
                  <span className="lm-pill">{zoeiraDestaque.tipo}</span>
                  <span className="lm-zoeira-round">{zoeiraDestaque.rodada}</span>
                </div>

                <div className="lm-zoeira-name">{zoeiraDestaque.jogador}</div>
                <div className="lm-zoeira-text">{zoeiraDestaque.texto}</div>

                {zoeiraDestaque.link ? (
                  <a className="lm-link" href={zoeiraDestaque.link} target="_blank" rel="noreferrer">
                    abrir link
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="lm-box">Sem itens na aba Zoeira ainda.</div>
            )}
          </div>

          {/* FULL WIDTH: Histórico de Rodadas (tabela simples) */}
          <div className="lm-card lm-span-all">
            <div className="lm-card-header">
              <div className="lm-card-title">📊 Histórico de Rodadas</div>
              <div className="lm-card-meta">Resumo (últimas 5)</div>
            </div>

            <HistoricoRodadas rodadas={rodadas} rodadaAtual={rodadaAtual} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HistoricoRodadas({ rodadas, rodadaAtual }) {
  const rows = useMemo(() => {
    const out = [];

    // pega últimas 5 rodadas (se existir)
    for (let r = Math.max(1, rodadaAtual); r >= 1 && out.length < 5; r--) {
      const key = `R${r}`;

      const list = (rodadas || [])
        .map((x) => {
          const v = x?.pontos?.[key] ?? x?.pontos?.[key.toLowerCase()] ?? "";
          const num = Number(v);
          return { jogador: x.jogador, pontos: Number.isFinite(num) ? num : null };
        })
        .filter((x) => x.jogador && x.pontos != null);

      if (!list.length) continue;

      list.sort((a, b) => b.pontos - a.pontos);
      out.push({ rodada: r, campeao: list[0].jogador, pontos: list[0].pontos });
    }

    return out;
  }, [rodadas, rodadaAtual]);

  if (!rows.length) return <div className="lm-box">Sem dados suficientes pra montar histórico.</div>;

  return (
    <div className="lm-tablewrap">
      <table className="lm-table">
        <thead>
          <tr>
            <th>Rodada</th>
            <th>Campeão</th>
            <th style={{ textAlign: "right" }}>Pontos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rodada}>
              <td>R{r.rodada}</td>
              <td>{r.campeao}</td>
              <td style={{ textAlign: "right", fontWeight: 900 }}>{formatPts(r.pontos)} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
