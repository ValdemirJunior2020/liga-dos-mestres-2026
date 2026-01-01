import React from "react";

export default function RankingTable({ ranking }) {
  return (
    <div className="ranking-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Jogador</th>
            <th>Total</th>
            <th>Média</th>
            <th>Rodadas</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((player, index) => (
            <tr key={player.nome}>
              <td>{index + 1}</td>

              <td style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* FOTO */}
                {player.fotoUrl ? (
                  <img
                    src={player.fotoUrl}
                    alt={player.nome}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #d4af37",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#333",
                      border: "1px solid #555",
                    }}
                  />
                )}

                {/* NOME + TAG */}
                <div>
                  <div style={{ fontWeight: "bold" }}>{player.nome}</div>
                  {player.funcao && (
                    <span className="badge badge-gold">
                      {player.funcao}
                    </span>
                  )}
                </div>
              </td>

              <td>{player.total} pts</td>
              <td>{player.media}</td>
              <td>{player.rodadas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
