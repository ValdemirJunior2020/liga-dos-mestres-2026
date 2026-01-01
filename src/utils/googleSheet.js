// src/utils/googleSheet.js

function extractDriveId(url = "") {
  try {
    const u = String(url).trim();

    // Example: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const m1 = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1?.[1]) return m1[1];

    // Example: https://drive.google.com/uc?export=view&id=FILE_ID
    const m2 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2?.[1]) return m2[1];

    return null;
  } catch {
    return null;
  }
}

function normalizePhotoUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  // If it's a Google Drive link, convert to a stable thumbnail URL:
  const driveId = extractDriveId(raw);
  if (driveId) {
    // This URL reliably returns an image (thumbnail) for public files
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
  }

  // Otherwise keep as-is (imgur, github raw, etc.)
  return raw;
}

export async function fetchSheetByName(spreadsheetId, sheetName) {
  // Using gviz endpoint by SHEET NAME (not gid)
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheetName
  )}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao buscar sheet="${sheetName}"`);
  }

  const text = await res.text();

  // Google wraps JSON in a function call like: google.visualization.Query.setResponse(...)
  const jsonText = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const data = JSON.parse(jsonText);

  const table = data.table;
  const cols = table.cols.map((c) => (c.label || "").trim());
  const rows = (table.rows || []).map((r) =>
    (r.c || []).map((cell) => (cell && cell.v != null ? cell.v : ""))
  );

  return { cols, rows };
}

export async function fetchJogadores(spreadsheetId) {
  const { cols, rows } = await fetchSheetByName(spreadsheetId, "Jogadores");

  const idx = (name) => cols.findIndex((c) => c.toLowerCase() === name.toLowerCase());

  const iNome = idx("Nome");
  const iFoto = idx("FotoURL");
  const iFuncao = idx("Função");
  const iAtivo = idx("Ativo");

  return rows
    .map((r) => {
      const nome = String(r[iNome] || "").trim();
      if (!nome) return null;

      const fotoUrl = normalizePhotoUrl(r[iFoto]);
      const funcao = String(r[iFuncao] || "").trim();
      const ativo = String(r[iAtivo] || "").trim();

      return {
        nome,
        fotoUrl,
        funcao,
        ativo,
      };
    })
    .filter(Boolean)
    .filter((p) => !p.ativo || p.ativo.toLowerCase() === "sim");
}

export async function fetchRodadas(spreadsheetId) {
  const { cols, rows } = await fetchSheetByName(spreadsheetId, "Rodadas");

  // First column expected: Jogador
  const iJogador = cols.findIndex((c) => c.toLowerCase() === "jogador");

  const rodadaCols = cols
    .map((c, i) => ({ c, i }))
    .filter((x) => /^r\d+$/i.test(String(x.c).trim()))
    .map((x) => x.i);

  return rows
    .map((r) => {
      const jogador = String(r[iJogador] || "").trim();
      if (!jogador) return null;

      const pontos = {};
      rodadaCols.forEach((colIndex) => {
        const rodadaName = String(cols[colIndex]).trim(); // R1, R2...
        const val = r[colIndex];
        const num = val === "" ? "" : Number(val);
        pontos[rodadaName] = Number.isFinite(num) ? num : "";
      });

      return { jogador, pontos };
    })
    .filter(Boolean);
}
