// src/pages/HallDosCampeoes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchCampeoes } from "../utils/googleSheet.js";

const SHEET_ID = import.meta.env.VITE_SHEET_ID;

function normComp(s = "") {
  const v = String(s || "").trim().toLowerCase();
  if (v.includes("liga")) return "Liga";
  if (v.includes("copa")) return "Copa";
  // fallback: capitaliza
  return String(s || "").trim() || "Liga";
}

function numPos(v) {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 999;
}

function numPts(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function openLink(url) {
  const u = String(url || "").trim();
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

export default function HallDosCampeoes() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState({ ok: true, items: [], anos: [] });

  // filtro (opcional): se vazio, mostra todos
  const [yearFilter, setYearFilter] = useState("");

  async function load() {
    try {
      setLoading(true);
      setErrorMsg("");

      if (!SHEET_ID) {
        setData({ ok: false, items: [], anos: [] });
        setErrorMsg("VITE_SHEET_ID não definido no .env");
        return;
      }

      const res = await fetchCampeoes(SHEET_ID);
      if (!res?.ok) {
        setData(res);
        setErrorMsg(res?.message || "Erro ao ler CampeoesData.");
        return;
      }

      setData(res);

      // Se já tinha filtro e o ano sumiu, limpa.
      setYearFilter((prev) => {
        if (!prev) return "";
        return res.anos.includes(prev) ? prev : "";
      });
    } catch (e) {
      setErrorMsg(e?.message || "Erro ao buscar dados do Google Sheets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const years = data?.anos || [];

  const itemsByYear = useMemo(() => {
    const map = new Map(); // ano -> { Liga: [], Copa: [] }

    for (const it of data?.items || []) {
      const ano = String(it.ano || "").trim();
      if (!ano) continue;

      const comp = normComp(it.competicao);
      if (!map.has(ano)) map.set(ano, { Liga: [], Copa: [] });

      map.get(ano)[comp] = map.get(ano)[comp] || [];
      map.get(ano)[comp].push(it);
    }

    // ordenar cada lista por posição
    for (const [ano, comps] of map.entries()) {
      comps.Liga = (comps.Liga || []).slice().sort((a, b) => numPos(a.posicao) - numPos(b.posicao));
      comps.Copa = (comps.Copa || []).slice().sort((a, b) => numPos(a.posicao) - numPos(b.posicao));
      map.set(ano, comps);
    }

    return map;
  }, [data]);

  const yearsToRender = useMemo(() => {
    const base = years.length ? years : Array.from(itemsByYear.keys()).sort((a, b) => Number(b) - Number(a));
    if (!yearFilter) return base;
    return base.filter((y) => y === yearFilter);
  }, [years, itemsByYear, yearFilter]);

  return (
    <div>
      <div style={styles.topRow}>
        <div>
          <div style={styles.title}>🏆 Hall dos Campeões</div>
          <div style={styles.subtitle}>
            Dados: <span style={{ opacity: 0.95 }}>CampeoesData</span>
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={load} style={styles.refreshBtn} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.filterLabel}>Filtrar por ano:</div>

        <button
          style={{ ...styles.pill, ...(yearFilter === "" ? styles.pillActive : {}) }}
          onClick={() => setYearFilter("")}
        >
          Todos
        </button>

        {years.map((y) => (
          <button
            key={y}
            style={{ ...styles.pill, ...(yearFilter === y ? styles.pillActive : {}) }}
            onClick={() => setYearFilter(y)}
          >
            {y}
          </button>
        ))}
      </div>

      {errorMsg ? (
        <div style={styles.alert}>{errorMsg}</div>
      ) : null}

      {loading ? (
        <div style={styles.skeletonWrap}>
          <div style={styles.skeleton} />
          <div style={styles.skeleton} />
          <div style={styles.skeleton} />
        </div>
      ) : null}

      {!loading && !errorMsg && yearsToRender.length === 0 ? (
        <div style={styles.empty}>
          Sem dados ainda. Confere a aba <b>CampeoesData</b> e os cabeçalhos:
          <div style={{ marginTop: 8, opacity: 0.9 }}>
            Ano, Competicao, Posicao, Time, Jogador, Pontos, Link
          </div>
        </div>
      ) : null}

      {!loading && !errorMsg ? (
        <div style={styles.yearGrid}>
          {yearsToRender.map((year) => {
            const comps = itemsByYear.get(year) || { Liga: [], Copa: [] };
            return (
              <section key={year} style={styles.yearSection}>
                <div style={styles.yearHeader}>
                  <div style={styles.yearText}>{year}</div>
                  <div style={styles.yearMeta}>
                    {comps.Liga?.length ? `Liga: ${comps.Liga.length}` : "Liga: 0"} ·{" "}
                    {comps.Copa?.length ? `Copa: ${comps.Copa.length}` : "Copa: 0"}
                  </div>
                </div>

                <div style={styles.cardsRow}>
                  <ChampCard
                    title="🥇 Liga dos Mestres"
                    subtitle="Resultados oficiais"
                    items={comps.Liga || []}
                  />
                  <ChampCard
                    title="🏆 Copa dos Mestres"
                    subtitle="Resultados oficiais"
                    items={comps.Copa || []}
                  />
                </div>
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ChampCard({ title, subtitle, items }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHead}>
        <div>
          <div style={styles.cardTitle}>{title}</div>
          <div style={styles.cardSub}>{subtitle}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={styles.noData}>Sem dados</div>
      ) : (
        <div style={styles.list}>
          {items.map((it, idx) => {
            const pos = String(it.posicao || idx + 1).trim();
            const pts = numPts(it.pontos);
            const hasLink = String(it.link || "").trim().length > 0;

            return (
              <div
                key={`${it.ano}-${it.competicao}-${pos}-${it.time}-${idx}`}
                style={{
                  ...styles.row,
                  ...(hasLink ? styles.rowClickable : {}),
                }}
                onClick={() => (hasLink ? openLink(it.link) : null)}
                role={hasLink ? "button" : undefined}
                tabIndex={hasLink ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!hasLink) return;
                  if (e.key === "Enter" || e.key === " ") openLink(it.link);
                }}
                title={hasLink ? "Abrir link" : ""}
              >
                <div style={styles.badge}>{pos}</div>

                <div style={styles.rowMain}>
                  <div style={styles.team}>{it.time || "-"}</div>
                  <div style={styles.player}>{it.jogador || ""}</div>
                </div>

                <div style={styles.rowRight}>
                  {pts !== null ? (
                    <div style={styles.points}>
                      {pts.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>
                  ) : (
                    <div style={styles.pointsMuted}>—</div>
                  )}
                  {hasLink ? <div style={styles.linkHint}>ver</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  topRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.75,
  },
  actions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  refreshBtn: {
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.35)",
    color: "rgba(255,255,255,.92)",
    fontWeight: 800,
  },

  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginBottom: 18,
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid rgba(255, 215, 0, .14)",
    background: "rgba(0,0,0,.28)",
  },
  filterLabel: {
    opacity: 0.8,
    fontWeight: 800,
    marginRight: 6,
  },
  pill: {
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.30)",
    color: "rgba(255,255,255,.9)",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  pillActive: {
    color: "#0b0b0b",
    border: "1px solid rgba(255,215,0,.55)",
    background: "linear-gradient(180deg, rgba(255,215,0,.95), rgba(255,193,7,.85))",
    boxShadow: "0 10px 28px rgba(255,215,0,.10)",
  },

  alert: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255, 90, 90, .35)",
    background: "rgba(120, 10, 10, .25)",
    color: "rgba(255,255,255,.92)",
    marginBottom: 18,
    fontWeight: 700,
  },

  skeletonWrap: { display: "grid", gap: 12 },
  skeleton: {
    height: 110,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.08)",
    background: "linear-gradient(90deg, rgba(255,255,255,.03), rgba(255,255,255,.06), rgba(255,255,255,.03))",
  },

  empty: {
    padding: "16px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255, 215, 0, .14)",
    background: "rgba(0,0,0,.28)",
    opacity: 0.95,
    fontWeight: 700,
  },

  yearGrid: {
    display: "grid",
    gap: 18,
  },
  yearSection: {
    borderRadius: 18,
    border: "1px solid rgba(255,215,0,.12)",
    background: "rgba(0,0,0,.22)",
    padding: 14,
  },
  yearHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  yearText: { fontSize: 18, fontWeight: 950 },
  yearMeta: { opacity: 0.75, fontWeight: 700, fontSize: 12 },

  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },

  card: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.30)",
    overflow: "hidden",
  },
  cardHead: {
    padding: "12px 12px 10px",
    borderBottom: "1px solid rgba(255,255,255,.08)",
  },
  cardTitle: { fontWeight: 950, letterSpacing: 0.2 },
  cardSub: { fontSize: 12, opacity: 0.7, marginTop: 4, fontWeight: 700 },

  noData: {
    padding: 12,
    opacity: 0.75,
    fontWeight: 800,
  },

  list: { padding: 10, display: "grid", gap: 10 },

  row: {
    display: "grid",
    gridTemplateColumns: "42px 1fr auto",
    gap: 10,
    alignItems: "center",
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(0,0,0,.22)",
  },
  rowClickable: {
    cursor: "pointer",
    transition: "transform .08s ease",
  },

  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    color: "#0b0b0b",
    background: "linear-gradient(180deg, rgba(255,215,0,.95), rgba(255,193,7,.85))",
    border: "1px solid rgba(255,215,0,.55)",
  },

  rowMain: { minWidth: 0 },
  team: { fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  player: { fontSize: 12, opacity: 0.8, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  rowRight: { textAlign: "right", display: "grid", gap: 2, justifyItems: "end" },
  points: { fontWeight: 950, fontVariantNumeric: "tabular-nums" },
  pointsMuted: { opacity: 0.55, fontWeight: 900 },
  linkHint: { fontSize: 11, opacity: 0.7, fontWeight: 900 },

  // responsivo (sem CSS file): usa media query via JS? Não dá.
  // Mas o grid se mantém ok; se quiser, eu movo isso pro App.css com @media.
};
