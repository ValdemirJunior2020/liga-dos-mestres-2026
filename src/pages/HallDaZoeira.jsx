// src/pages/HallDaZoeira.jsx
import React, { useEffect, useMemo, useState } from "react";
import { SHEET_ID } from "../config.js";
import { fetchZoeira, fetchSheetByName } from "../utils/googleSheet.js";

export default function HallDaZoeira() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      setPayload(null);

      try {
        if (!SHEET_ID) throw new Error("SHEET_ID vazio (config.js)");

        // 1) tenta via função oficial
        const z = await fetchZoeira(SHEET_ID);

        // Debug extra: pega cols/rows cru também (pra ver header real)
        const raw = await fetchSheetByName(SHEET_ID, "Zoeira");

        // eslint-disable-next-line no-console
        console.log("ZOEIRA fetchZoeira() →", z);
        // eslint-disable-next-line no-console
        console.log("ZOEIRA RAW cols →", raw?.cols);
        // eslint-disable-next-line no-console
        console.log("ZOEIRA RAW first 5 rows →", (raw?.rows || []).slice(0, 5));

        setPayload({ z, raw });
      } catch (e) {
        setError(e?.message || "Erro ao carregar Hall da Zoeira");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const view = useMemo(() => {
    const z = payload?.z;
    if (!z) return null;

    if (!z.ok) {
      return {
        ok: false,
        message: z.message || "fetchZoeira retornou ok=false",
        items: [],
        rodadas: [],
      };
    }

    return {
      ok: true,
      message: "",
      items: z.items || [],
      rodadas: z.rodadas || [],
    };
  }, [payload]);

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>😅 Hall da Zoeira</div>
      <div style={styles.sub}>Momentos lendários por rodada (aba: Zoeira)</div>

      {loading ? <div style={styles.box}>Carregando...</div> : null}
      {error ? <div style={styles.err}>{error}</div> : null}

      {!loading && !error && payload ? (
        <>
          {/* Debug card (mostra o que veio do Sheet) */}
          <div style={styles.debug}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>🧪 Debug</div>
            <div style={styles.debugLine}>
              <span style={styles.debugKey}>SHEET_ID:</span> {SHEET_ID}
            </div>
            <div style={styles.debugLine}>
              <span style={styles.debugKey}>cols (aba Zoeira):</span>{" "}
              {(payload.raw?.cols || []).join(" | ") || "(vazio)"}
            </div>
            <div style={styles.debugLine}>
              <span style={styles.debugKey}>rows count:</span>{" "}
              {(payload.raw?.rows || []).length}
            </div>
            <div style={styles.debugLine}>
              <span style={styles.debugKey}>fetchZoeira ok:</span>{" "}
              {String(payload.z?.ok)}
            </div>
            {payload.z?.message ? (
              <div style={styles.debugLine}>
                <span style={styles.debugKey}>message:</span> {payload.z.message}
              </div>
            ) : null}
          </div>

          {/* Conteúdo */}
          {view?.ok ? (
            <ZoeiraList items={view.items} />
          ) : (
            <div style={styles.err}>
              {view?.message ||
                "Não consegui ler a aba Zoeira. Confira os cabeçalhos."}
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
  // agrupa por rodada
  const grouped = useMemo(() => {
    const map = new Map();
    (items || []).forEach((it) => {
      const key = String(it.rodada || "").trim() || "Sem rodada";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    });

    // ordena rodadas por número
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
              <div key={idx} style={styles.item}>
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

      {!grouped.length ? (
        <div style={styles.box}>Nenhum item encontrado na aba Zoeira.</div>
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
    fontWeight: 800,
  },

  debug: {
    marginTop: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.22)",
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
  },
  debugLine: { marginTop: 6, opacity: 0.92 },
  debugKey: { fontWeight: 900, color: "rgba(255,255,255,.85)" },

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
