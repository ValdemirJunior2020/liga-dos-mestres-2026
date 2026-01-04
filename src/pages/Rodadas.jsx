// src/pages/Rodadas.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchRodadas } from "../utils/googleSheet.js";
import { SHEET_ID, debugEnv } from "../config.js";

function isRCol(k) {
  return /^r\d+$/i.test(String(k || "").trim());
}

export default function Rodadas() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        const data = await fetchRodadas(SHEET_ID);
        setRodadas(data);
      } catch (e) {
        setError(e?.message || "Erro ao carregar Rodadas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rodadaKeys = useMemo(() => {
    const s = new Set();
    rodadas.forEach((r) => Object.keys(r.pontos || {}).forEach((k) => isRCol(k) && s.add(k)));
    return Array.from(s).sort((a, b) => {
      const na = Number(String(a).slice(1));
      const nb = Number(String(b).slice(1));
      return na - nb;
    });
  }, [rodadas]);

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>📊 Rodadas</div>
      <div style={styles.sub}>Pontos por rodada (aba Rodadas)</div>

      {loading ? <div style={styles.box}>Carregando...</div> : null}
      {error ? <div style={styles.err}>{error}</div> : null}

      {!loading && !error ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Jogador</th>
                {rodadaKeys.map((k) => (
                  <th key={k} style={styles.thRight}>
                    {k.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rodadas.map((r) => (
                <tr key={r.jogador} style={styles.tr}>
                  <td style={styles.td}>{r.jogador}</td>
                  {rodadaKeys.map((k) => (
                    <td key={k} style={styles.tdRight}>
                      {r.pontos?.[k] === "" ? "" : r.pontos?.[k]}
                    </td>
                  ))}
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
};
