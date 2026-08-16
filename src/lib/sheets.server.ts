/** Acesso ao Google Sheets pelo gateway de conectores (server-only). */

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

export const TRACKING_HEADER = [
  "data_analise",
  "nome_do_teste",
  "descricao",
  "parceiro",
  "periodo",
  "variantes",
  "resultado",
  "decisao",
  "metrica_principal",
  "lift_receita_liquida",
  "p_valor",
  "impacto_liquido_rs",
  "arquivo_fonte",
];

function headers() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connectionKey)
    throw new Error(
      "Conexao com Google Sheets nao configurada (LOVABLE_API_KEY / GOOGLE_SHEETS_API_KEY ausentes).",
    );
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${GATEWAY}${path}`, { ...init, headers: headers() });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Sheets gateway ${res.status}: ${text}`);
    throw new Error(`Google Sheets respondeu ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

export function sheetUrl(spreadsheetId: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

/** Cria a planilha de acompanhamento com cabecalho. */
export async function createTrackingSheet(title: string) {
  const created = await call("/spreadsheets", {
    method: "POST",
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: "Testes" } }],
    }),
  });
  const spreadsheetId: string = created.spreadsheetId;
  await call(`/spreadsheets/${spreadsheetId}/values/Testes!A1:M1?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [TRACKING_HEADER] }),
  });
  return { spreadsheetId, url: sheetUrl(spreadsheetId) };
}

/** Garante cabecalho e adiciona (ou substitui) a linha do teste. */
export async function appendTrackingRow(spreadsheetId: string, row: string[]) {
  const meta = await call(`/spreadsheets/${spreadsheetId}?fields=sheets(properties(title))`);
  const tab: string = meta.sheets?.[0]?.properties?.title ?? "Testes";
  const current = await call(`/spreadsheets/${spreadsheetId}/values/${tab}!A1:M10000`);
  const values: string[][] = current.values ?? [];

  if (values.length === 0) {
    await call(`/spreadsheets/${spreadsheetId}/values/${tab}!A1:M1?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [TRACKING_HEADER] }),
    });
    values.push(TRACKING_HEADER);
  }

  // Um teste = uma linha: se o nome ja existe, atualiza no lugar.
  const existingIndex = values.findIndex((r, i) => i > 0 && r[1] === row[1]);
  if (existingIndex > 0) {
    const rowNumber = existingIndex + 1;
    await call(
      `/spreadsheets/${spreadsheetId}/values/${tab}!A${rowNumber}:M${rowNumber}?valueInputOption=USER_ENTERED`,
      { method: "PUT", body: JSON.stringify({ values: [row] }) },
    );
    return { updated: true, rowNumber, url: sheetUrl(spreadsheetId) };
  }

  const appended = await call(
    `/spreadsheets/${spreadsheetId}/values/${tab}!A1:M1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [row] }) },
  );
  return {
    updated: false,
    rowNumber: values.length + 1,
    url: sheetUrl(spreadsheetId),
    range: appended.updates?.updatedRange ?? null,
  };
}

export async function listTrackingRows(spreadsheetId: string) {
  const meta = await call(`/spreadsheets/${spreadsheetId}?fields=properties(title),sheets(properties(title))`);
  const tab: string = meta.sheets?.[0]?.properties?.title ?? "Testes";
  const current = await call(`/spreadsheets/${spreadsheetId}/values/${tab}!A1:M10000`);
  const values: string[][] = current.values ?? [];
  return {
    title: meta.properties?.title ?? "",
    header: values[0] ?? TRACKING_HEADER,
    rows: values.slice(1),
    url: sheetUrl(spreadsheetId),
  };
}
