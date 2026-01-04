// src/utils/googleSheet.js

function extractDriveId(url = "") {
  try {
    const u = String(url).trim();

    const m1 = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1?.[1]) return m1[1];

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

  const driveId = extractDriveId(raw);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
  }

  return raw;
}

function normalizeGvizTableToHeaderRows(cols, rows) {
  const safeCols = (cols || []).map((c) => String(c || "").trim());
  const safeRows = (rows || []).map((r) => (Array.isArray(r) ? r : []));

  const hasUsefulLabels = safeCols.some((c) => c && c.toLowerCase() !== "a" && c.toLowerCase() !== "b");
  if (hasUsefulLabels) {
    return { header: safeCols, dataRows: safeRows };
  }

  // use first row as header
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
  if (!res.ok) throw new Error(`GVIZ(sheet) HTTP ${res.status} | sheet="${sheetName}"`);

  const text = await res.text();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`Resposta GVIZ inválida para sheet="${sheetName}"`);

  const jsonText = text.substring(start, end + 1);
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

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function idx(cols, name) {
  const target = norm(name);
  return (cols || []).findIndex((c) => norm(c) === target);
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
 *  RODADAS (BULLETPROOF)
 *  First col: Jogador (or Nome/Player/Jogadores)
 *  Then columns: R1..R38 (accepts: R1, R01, Rodada 1, "R 1", etc)
 * -------------------------- */
export async function fetchRodadas(spreadsheetId) {
  // always use the real tab name:
  const { cols, rows } = await fetchSheetByName(spreadsheetId, "Rodadas");

  // Find jogador column by multiple possible names
  const possibleJogadorHeaders = ["Jogador", "Jogadores", "Nome", "Player", "Participante"];
  let iJogador = -1;
  for (const h of possibleJogadorHeaders) {
    const i = idx(cols, h);
    if (i !== -1) {
      iJogador = i;
      break;
    }
  }

  // Fallback: assume first column is jogador if headers are weird
  if (iJogador === -1) iJogador = 0;

  // Find rodada columns robustly
  // Accept:
  // - R1, R2...
  // - R01
  // - "Rodada 1"
  // - "R 1"
  const rodadaCols = cols
    .map((c, i) => ({ raw: String(c || ""), c: norm(c), i }))
    .filter((x) => {
      const raw = x.raw.trim();

      // R1 or R01 or R 1
      if (/^r\s*\d+$/i.test(raw)) return true;

      // "Rodada 1"
      if (/^rodada\s*\d+$/i.test(raw)) return true;

      // sometimes header comes as just "1", "2" etc (not recommended)
      if (/^\d+$/.test(raw) && Number(raw) >= 1 && Number(raw) <= 99) return true;

      return false;
    })
    .map((x) => x.i);

  if (!rodadaCols.length) {
    throw new Error(
      `Aba "Rodadas" encontrada, mas não achei colunas de rodada (R1, R2...). Confira os cabeçalhos da primeira linha.`
    );
  }

  return rows
    .map((r) => {
      const jogador = String(r[iJogador] || "").trim();
      if (!jogador) return null;

      const pontos = {};
      rodadaCols.forEach((colIndex) => {
        const header = String(cols[colIndex] || "").trim();

        // Normalize key name to Rn
        let rodadaKey = header;

        // "Rodada 1" -> "R1"
        const mRod = header.match(/rodada\s*(\d+)/i);
        if (mRod?.[1]) rodadaKey = `R${Number(mRod[1])}`;

        // "R 01" -> "R1"
        const mR = header.match(/^r\s*(\d+)$/i);
        if (mR?.[1]) rodadaKey = `R${Number(mR[1])}`;

        // "01" -> "R1"
        if (/^\d+$/.test(header)) rodadaKey = `R${Number(header)}`;

        const val = r[colIndex];

        // convert to number if possible
        if (val === "" || val == null) {
          pontos[rodadaKey] = "";
        } else {
          const num = Number(val);
          pontos[rodadaKey] = Number.isFinite(num) ? num : "";
        }
      });

      return { jogador, pontos };
    })
    .filter(Boolean);
}

/** ---------------------------
 *  ZOEIRA
 *  Columns expected:
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
      const competicao = String(r[iComp] || "").trim();
      const posicao = String(r[iPos] || "").trim();
      const time = String(r[iTime] || "").trim();
      const jogador = String(r[iJog] || "").trim();
      const pontosRaw = r[iPts];
      const link = String(r[iLink] || "").trim();

      if (!ano && !competicao && !posicao && !time && !jogador && !pontosRaw) return null;
      if (!ano || !competicao || !posicao || !time) return null;

      const pontosNum = pontosRaw === "" ? "" : Number(pontosRaw);
      const pontos = Number.isFinite(pontosNum) ? pontosNum : "";

      return { ano, competicao, posicao, time, jogador, pontos, link };
    })
    .filter(Boolean);

  const anos = Array.from(new Set(items.map((x) => x.ano)))
    .map((a) => Number(a))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a)
    .map(String);

  return { ok: true, message: "", items, anos };
}
