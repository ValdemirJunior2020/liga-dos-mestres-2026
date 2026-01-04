import React from "react";

export default function Home() {
  return (
    <div style={styles.wrap}>
      <div style={styles.hero}>
        <div style={styles.title}>Liga dos Mestres</div>
        <div style={styles.subtitle}>
          Home nova em construção — vamos deixar idêntica à imagem que você mandou.
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>🏅 Ranking</div>
            <div style={styles.cardText}>Classificação geral da liga.</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>😂 Hall da Zoeira</div>
            <div style={styles.cardText}>As pérolas de cada rodada.</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>🏆 Campeões</div>
            <div style={styles.cardText}>Histórico oficial da liga.</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>⚽ Futebol</div>
            <div style={styles.cardText}>Tabela + jogos via widget.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { width: "100%" },
  hero: {
    border: "1px solid rgba(255,215,0,.14)",
    background: "rgba(0,0,0,.35)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 18px 40px rgba(0,0,0,.35)",
  },
  title: { fontSize: 28, fontWeight: 900, letterSpacing: 0.3 },
  subtitle: { marginTop: 6, color: "rgba(255,255,255,.75)", fontWeight: 600 },
  grid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  card: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.25)",
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: { fontWeight: 900, marginBottom: 6 },
  cardText: { color: "rgba(255,255,255,.70)", fontWeight: 600, fontSize: 13 },
};
