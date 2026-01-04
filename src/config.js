// src/config.js

// ✅ Fallback (pra nunca mais travar)
// Coloque aqui o ID do seu Google Sheet:
const FALLBACK_SHEET_ID = "1LmQLHOR0DlcT_DwuwGm-4fWZ9ZkB4he6G0FO0X2nnBI";

// Vite env (só funciona se o Vite estiver carregando o .env)
const raw = (import.meta?.env?.VITE_SHEET_ID || "").trim();

// Aceita ID ou URL e extrai o ID
function parseSpreadsheetId(input = "") {
  const v = String(input || "").trim();
  if (!v) return "";

  // If it's already an ID:
  if (/^[a-zA-Z0-9_-]{20,}$/.test(v) && !v.includes("http")) return v;

  // If it's a URL:
  const m = v.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
  if (m?.[1]) return m[1];

  return v;
}

// ✅ Se env vier vazio, usa fallback
export const SHEET_ID = parseSpreadsheetId(raw) || FALLBACK_SHEET_ID;

// Debug rápido
export function debugEnv() {
  // eslint-disable-next-line no-console
  console.log("ENV raw VITE_SHEET_ID →", raw);
  // eslint-disable-next-line no-console
  console.log("ENV parsed SHEET_ID →", parseSpreadsheetId(raw));
  // eslint-disable-next-line no-console
  console.log("FINAL SHEET_ID (env||fallback) →", SHEET_ID);
  // eslint-disable-next-line no-console
  console.log("MODE →", import.meta?.env?.MODE);
  // eslint-disable-next-line no-console
  console.log("BASE_URL →", import.meta?.env?.BASE_URL);
}
