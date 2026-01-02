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
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
  }

  return raw;
}

/**
 * Google Sheets GVIZ sometimes returns:
 * - cols labels empty
 * - first row has the headers, but cols labels are blank
 * This function fixes that by using row1 as header when needed.
 */
function normalizeGvizTableToHeaderRows(cols, rows) {
  const safeCols = (cols || []).map((c) => String(c || "").trim());
  const safeRows = (rows || []).map((r) => (Array.isArray(r) ? r : []));

  // Case A: cols labels are good (not all empty)
  const hasUsefulLabels = safeCols.some((c) => c && c.toLowerCase() !== "a" && c.toLowerCase() !== "b");
  if (hasUsefulLabels) {
    return { header: safeCols, dataRows: safeRows };
  }

  // Case B: use first row as header
  const first = safeRows[0] || [];
  const header = first.map((v) => String(v || "").trim());
  const dataRows = safeRows.slice(1);

  return { header, dataRows };
}

export async function fetchSheetByName(spreadsheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheetName
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar sheet="${sheetName}"`);

  const text = await res.text();

  // Google wraps JSON: google.visualization.Query.setResponse(...)
  const jsonText = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const data = JSON.parse(jsonText);

  const table = data?.table || {};
  const cols = (table.cols || []).map((c) => (c?.label || "").trim());
  const rows = (table.rows || []).map((r) =>
    (r.c || []).map((cell) => (cell && cell.v != null ? cell.v : ""))
  );

  const normalized = normalizeGvizTableToHeaderRows(cols, rows);

  return {
    cols: normalized.header,
    rows: normalized.dataRows,
  };
}

function idx(cols, name) {
  return cols.findIndex((c) => String(c || "").trim().toLowerCase() === String(name).trim().toLowerCase());
}

/** ---------------------------
 *  JOGADORES
 *  Columns expected:
 *  Nome | FotoURL | Função | Ativo
 * -------------------------- */
export async function fetchJogadores(spreadsheetId) {
  const { cols, rows } = await fetchSheetByName(spreadsheetId, "Jogadores");

  const iNome = idx(cols, "Nome");
  const iFoto = idx(cols, "FotoURL");
  const iFuncao = idx(cols, "Função");
  const iAtivo = idx(cols, "Ativo");

  return rows
    .map((r) => {
      const nome = String(r[iNome] || "").trim();
      if (!nome) return null;

      const fotoUrl = normalizePhotoUrl(r[iFoto]);
      const funcao = String(r[iFuncao] || "").trim();
      const ativo = String(r[iAtivo] || "").trim();

      return { nome, fotoUrl, funcao, ativo };
    })
    .filter(Boolean)
    .filter((p) => !p.ativo || p.ativo.toLowerCase() === "sim");
}

/** ---------------------------
 *  RODADAS
 *  First column: Jogador
 *  Then columns: R1, R2, R3...
 * -------------------------- */
export async function fetchRodadas(spreadsheetId) {
  const { cols, rows } = await fetchSheetByName(spreadsheetId, "Rodadas");

  const iJogador = cols.findIndex((c) => String(c || "").trim().toLowerCase() === "jogador");

  const rodadaCols = cols
    .map((c, i) => ({ c: String(c || "").trim(), i }))
    .filter((x) => /^r\d+$/i.test(x.c))
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

/** ---------------------------
 *  ZOEIRA
 *  Columns expected (row1):
 *  Rodada | Tipo | Jogador | Texto | Link
 * -------------------------- */
export async function fetchZoeira(spreadsheetId) {
  const { cols, rows } = await fetchSheetByName(spreadsheetId, "Zoeira");

  const iRodada = idx(cols, "Rodada");
  const iTipo = idx(cols, "Tipo");
  const iJogador = idx(cols, "Jogador");
  const iTexto = idx(cols, "Texto");
  const iLink = idx(cols, "Link");

  const missing = [iRodada, iTipo, iJogador, iTexto, iLink].some((i) => i === -1);
  if (missing) {
    return {
      ok: false,
      message:
        "Não encontrei os cabeçalhos na aba Zoeira. A primeira linha precisa ser: Rodada, Tipo, Jogador, Texto, Link",
      items: [],
      rodadas: [],
    };
  }

  const items = rows
    .map((r) => {
      const rodada = String(r[iRodada] || "").trim();
      const tipo = String(r[iTipo] || "").trim();
      const jogador = String(r[iJogador] || "").trim();
      const texto = String(r[iTexto] || "").trim();
      const link = String(r[iLink] || "").trim();

      if (!rodada && !tipo && !jogador && !texto && !link) return null;
      if (!rodada || !tipo || !jogador || !texto) return null;

      return { rodada, tipo, jogador, texto, link };
    })
    .filter(Boolean);

  const rodadas = Array.from(new Set(items.map((x) => x.rodada))).sort((a, b) => {
    const na = Number(String(a).replace(/[^0-9]/g, "")) || 0;
    const nb = Number(String(b).replace(/[^0-9]/g, "")) || 0;
    return na - nb;
  });

  return { ok: true, message: "", items, rodadas };
}

/** ---------------------------
 *  CAMPEOESDATA
 *  Columns expected:
 *  Ano | Competicao | Posicao | Time | Jogador | Pontos | Link
 * -------------------------- */
export async function fetchCampeoes(spreadsheetId) {
  const { cols, rows } = await fetchSheetByName(spreadsheetId, "CampeoesData");

  const iAno = idx(cols, "Ano");
  const iComp = idx(cols, "Competicao");
  const iPos = idx(cols, "Posicao");
  const iTime = idx(cols, "Time");
  const iJog = idx(cols, "Jogador");
  const iPts = idx(cols, "Pontos");
  const iLink = idx(cols, "Link");

  const missing = [iAno, iComp, iPos, iTime, iJog, iPts].some((i) => i === -1);
  if (missing) {
    return {
      ok: false,
      message:
        "Não encontrei os cabeçalhos na aba CampeoesData. A primeira linha precisa ser: Ano, Competicao, Posicao, Time, Jogador, Pontos, Link",
      items: [],
      anos: [],
    };
  }

  const items = rows
    .map((r) => {
      const ano = String(r[iAno] || "").trim();
      const competicao = String(r[iComp] || "").trim(); // Liga / Copa
      const posicao = String(r[iPos] || "").trim();
      const time = String(r[iTime] || "").trim();
      const jogador = String(r[iJog] || "").trim();
      const pontosRaw = r[iPts];
      const link = String(r[iLink] || "").trim();

      if (!ano && !competicao && !posicao && !time && !jogador && !pontosRaw) return null;
      if (!ano || !competicao || !posicao || !time) return null;

      const pontosNum = pontosRaw === "" ? "" : Number(pontosRaw);
      const pontos = Number.isFinite(pontosNum) ? pontosNum : "";

      return {
        ano,
        competicao,
        posicao,
        time,
        jogador,
        pontos,
        link,
      };
    })
    .filter(Boolean);

  const anos = Array.from(new Set(items.map((x) => x.ano)))
    .map((a) => Number(a))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a)
    .map(String);

  return { ok: true, message: "", items, anos };
}
