// src/pages/Ranking.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchJogadores, fetchRodadas } from "../utils/googleSheet.js";
import { SHEET_ID, debugEnv } from "../config.js";

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Ranking() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [rodadas, setRodadas] = useState([]);

  useEffect(() => {
    debugEnv();

    (async () => {
      setLoading(true);
      setError("");
      try {
        if (!SHEET_ID) {
          throw new Error(
            "VITE_SHEET_ID não carregou. Verifique se o arquivo é '.env' (sem .txt) e reinicie: CTRL+C e npm run dev."
          );
        }

        const [jogs, rods] = await Promise.all([fetchJogadores(SHEET_ID), fetchRodadas(SHEET_ID)]);

        setPlayers(jogs);
        setRodadas(rods);
      } catch (e) {
        setError(e?.message || "Erro ao carregar Ranking");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>🏅 Ranking Geral</div>
      <div style={styles.sub}>Puxando dados da aba Rodadas</div>

      {loading ? <div style={styles.box}>Carregando...</div> : null}
      {error ? <div style={styles.err}>{error}</div> : null}

      {!loading && !error ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Jogador</th>
                <th style={styles.thRight}>Total</th>
                <th style={styles.thRight}>Média</th>
                <th style={styles.thRight}>Rodadas</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, idx) => (
                <tr key={r.nome} style={styles.tr}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.playerCell}>
                      <div style={styles.avatarWrap}>
                        {r.fotoUrl ? (
                          <img
                            src={r.fotoUrl}
                            alt={r.nome}
                            style={styles.avatar}
                            loading="lazy"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <div style={styles.avatarFallback} />
                        )}
                      </div>

                      <div>
                        <div style={{ fontWeight: 900 }}>{r.nome}</div>
                        {r.funcao ? <div style={styles.smallTag}>{r.funcao}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td style={styles.tdRight}>{Math.round(r.total * 100) / 100}</td>
                  <td style={styles.tdRight}>{Math.round(r.media * 100) / 100}</td>
                  <td style={styles.tdRight}>{r.rodadas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrap: {
    border: "1px solid rgba(255,215,0,.12)",
    background: "rgba(0,0,0,.35)",
    borderRadius: 18,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: 900 },
  sub: { marginTop: 4, color: "rgba(255,255,255,.7)", fontWeight: 600, fontSize: 13 },
  box: {
    marginTop: 12,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.25)",
    borderRadius: 14,
    padding: 12,
  },
  err: {
    marginTop: 12,
    border: "1px solid rgba(255,80,80,.35)",
    background: "rgba(255,0,0,.08)",
    borderRadius: 14,
    padding: 12,
    fontWeight: 700,
  },
  tableWrap: { marginTop: 12, overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 10px",
    borderBottom: "1px solid rgba(255,255,255,.10)",
    color: "rgba(255,255,255,.8)",
  },
  thRight: {
    textAlign: "right",
    padding: "10px 10px",
    borderBottom: "1px solid rgba(255,255,255,.10)",
    color: "rgba(255,255,255,.8)",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,.06)" },
  td: { padding: "10px 10px" },
  tdRight: { padding: "10px 10px", textAlign: "right", fontWeight: 900 },
  playerCell: { display: "flex", alignItems: "center", gap: 10 },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
  },
  avatar: { width: "100%", height: "100%", objectFit: "cover" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.12), rgba(255,255,255,.04))",
  },
  smallTag: {
    marginTop: 2,
    display: "inline-block",
    fontSize: 12,
    color: "rgba(255,255,255,.65)",
    fontWeight: 700,
  },
};
