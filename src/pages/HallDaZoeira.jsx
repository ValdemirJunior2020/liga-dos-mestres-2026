// src/pages/HallDaZoeira.jsx
import React, { useEffect, useMemo, useState } from "react";
import { SHEET_ID } from "../config.js";
import { fetchZoeira } from "../utils/googleSheet.js";

export default function HallDaZoeira() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState({ ok: true, items: [], rodadas: [], message: "" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      try {
        if (!SHEET_ID) throw new Error("SHEET_ID vazio (config.js)");

        const z = await fetchZoeira(SHEET_ID);

        if (!z?.ok) {
          setView({
            ok: false,
            message: z?.message || "Não consegui ler a aba Zoeira. Confira os cabeçalhos.",
            items: [],
            rodadas: [],
          });
        } else {
          setView({
            ok: true,
            message: "",
            items: z.items || [],
            rodadas: z.rodadas || [],
          });
        }
      } catch (e) {
        setError(e?.message || "Erro ao carregar Hall da Zoeira");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>😅 Hall da Zoeira</div>
      <div style={styles.sub}>Momentos lendários por rodada (aba: Zoeira)</div>

      {loading ? <div style={styles.box}>Carregando...</div> : null}
      {error ? <div style={styles.err}>{error}</div> : null}

      {!loading && !error ? (
        <>
          {view.ok ? (
            <ZoeiraList items={view.items} />
          ) : (
            <div style={styles.err}>
              {view.message}
              <div style={{ marginTop: 8, opacity: 0.85 }}>
                Cabeçalho esperado (linha 1):
                <br />
                <b>Rodada | Tipo | Jogador | Texto | Link</b>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function ZoeiraList({ items }) {
  const grouped = useMemo(() => {
    const map = new Map();

    (items || []).forEach((it) => {
      const key = String(it.rodada || "").trim() || "Sem rodada";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    });

    const keys = Array.from(map.keys()).sort((a, b) => {
      const na = Number(String(a).replace(/[^0-9]/g, "")) || 0;
      const nb = Number(String(b).replace(/[^0-9]/g, "")) || 0;
      return na - nb;
    });

    return keys.map((k) => ({ rodada: k, items: map.get(k) }));
  }, [items]);

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
      {grouped.map((g) => (
        <div key={g.rodada} style={styles.card}>
          <div style={styles.cardTitle}>🏁 {g.rodada}</div>

          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {g.items.map((it, idx) => (
              <div key={`${g.rodada}-${idx}`} style={styles.item}>
                <div style={styles.itemTop}>
                  <span style={styles.badge}>{it.tipo}</span>
                  <span style={styles.player}>{it.jogador}</span>
                </div>

                <div style={styles.text}>{it.texto}</div>

                {it.link ? (
                  <a href={it.link} target="_blank" rel="noreferrer" style={styles.link}>
                    abrir link
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}

      {!grouped.length ? <div style={styles.box}>Nenhum item encontrado na aba Zoeira.</div> : null}
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
    fontWeight: 800,
  },

  card: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.22)",
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: { fontWeight: 900, fontSize: 16 },

  item: {
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(0,0,0,.20)",
    borderRadius: 14,
    padding: 12,
  },
  itemTop: { display: "flex", gap: 10, alignItems: "center" },
  badge: {
    fontSize: 12,
    fontWeight: 900,
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,215,0,.25)",
    background: "rgba(255,215,0,.08)",
  },
  player: { fontWeight: 900, opacity: 0.9 },
  text: { marginTop: 8, fontWeight: 700, lineHeight: 1.35, opacity: 0.92 },
  link: {
    marginTop: 10,
    display: "inline-block",
    fontWeight: 900,
    textDecoration: "none",
    color: "rgba(255,215,0,.95)",
  },
};
