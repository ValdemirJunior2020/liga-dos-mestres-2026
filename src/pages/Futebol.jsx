import React from "react";

export default function Futebol() {
  return (
    <div className="container py-4">
      <div className="card-dark">
        <div className="card-dark-header">
          ⚽ <strong>Tabela & Jogos</strong>
          <span className="pill-auto">API Futebol</span>
        </div>

        <div className="card-dark-body">
          <div style={{ borderRadius: 14, overflow: "hidden" }}>
            <iframe
              src="https://widget.api-futebol.com.br/render/widget_fdbbfffac499a277"
              title="API Futebol - Widget"
              loading="lazy"
              referrerPolicy="unsafe-url"
              sandbox="allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
              style={{
                border: "1px solid rgba(255,255,255,.10)",
                borderRadius: "14px",
                background: "transparent",
                width: "100%",
                height: "800px",
              }}
            />
          </div>

          <div className="small text-muted mt-3">
            Se o widget não carregar no deploy, a gente pode abrir pela URL pública também.
          </div>
        </div>
      </div>
    </div>
  );
}
