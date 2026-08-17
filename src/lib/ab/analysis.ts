/**
 * Motor de análise de testes A/B de cashback.
 * Mesma logica do script Python em /analysis (parsing tolerante, metricas de
 * margem líquida, teste t de Welch e regra de decisão).
 */

export type DailyRow = {
  date: string;
  group: string;
  partner: string;
  buyers: number;
  commission: number;
  cashback: number;
  gmv: number;
  net: number;
  netPerBuyer: number;
  gmvPerBuyer: number;
};

export type GroupSummary = {
  group: string;
  days: number;
  buyers: number;
  gmv: number;
  commission: number;
  cashback: number;
  net: number;
  ticket: number;
  cashbackRate: number;
  takeRate: number;
  netMargin: number;
  netPerBuyer: number;
};

export type Comparison = {
  group: string;
  liftNet: number;
  liftNetPerBuyer: number;
  liftGmv: number;
  liftBuyers: number;
  liftTicket: number;
  netDelta: number;
  pValue: number;
  ci: [number, number];
  significant: boolean;
};

export type Decision = "escalar_variante" | "manter_controle" | "inconclusivo";

export type AnalysisResult = {
  testName: string;
  sourceFile: string;
  partner: string;
  periodStart: string;
  periodEnd: string;
  days: number;
  control: string;
  alpha: number;
  variants: string[];
  summary: GroupSummary[];
  comparisons: Comparison[];
  daily: DailyRow[];
  decision: Decision;
  winner: string;
  rationale: string;
  warnings: string[];
  outliers: { group: string; date: string; gmv: number; z: number }[];
  generatedAt: string;
};

const norm = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const COLUMN_ALIASES: Record<string, keyof RawRow> = {
  data: "date",
  date: "date",
  "grupos de usuarios": "group",
  "grupos de usuários": "group",
  "grupo de usuarios": "group",
  grupos: "group",
  grupo: "group",
  variante: "group",
  parceiro: "partner",
  compradores: "buyers",
  buyers: "buyers",
  comissao: "commission",
  comissão: "commission",
  "comissao do parceiro": "commission",
  commission: "commission",
  cashback: "cashback",
  "vendas totais": "gmv",
  "vendas total": "gmv",
  gmv: "gmv",
};

type RawRow = {
  date: string;
  group: string;
  partner: string;
  buyers: string;
  commission: string;
  cashback: string;
  gmv: string;
};

export function parseMoney(value: string): number {
  if (value == null) return NaN;
  let raw = String(value).trim();
  if (["", "-", "--", "n/a", "null", "none"].includes(raw.toLowerCase())) return NaN;
  raw = raw.replace(/r\$/gi, "").replace(/\u00a0/g, " ").trim();
  const negative = raw.startsWith("(") && raw.endsWith(")");
  raw = raw.replace(/[()\s]/g, "");
  if (raw.includes(",") && raw.includes(".")) raw = raw.replace(/\./g, "").replace(",", ".");
  else if (raw.includes(",")) raw = raw.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) raw = raw.replace(/\./g, "");
  const n = Number(raw);
  if (!Number.isFinite(n)) return NaN;
  return negative ? -n : n;
}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === sep && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((v) => v.trim().replace(/^"|"$/g, ""));
}

/** Le o CSV, normaliza cabecalhos e devolve linhas limpas + alertas. */
export function parseCsv(text: string): { rows: DailyRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("Arquivo vazio ou sem linhas de dados.");
  const sep = [",", ";", "\t"]
    .map((c) => ({ c, n: (lines[0] ?? "").split(c).length }))
    .sort((a, b) => b.n - a.n)[0]!.c;

  const header = splitLine(lines[0] ?? "", sep);
  const index: Partial<Record<keyof RawRow, number>> = {};
  header.forEach((h, i) => {
    const key = COLUMN_ALIASES[norm(h)];
    if (key) index[key] = i;
  });

  const required: (keyof RawRow)[] = ["date", "group", "buyers", "commission", "cashback", "gmv"];
  const missing = required.filter((k) => index[k] === undefined);
  if (missing.length)
    throw new Error(
      `Colunas obrigatórias ausentes: ${missing.join(", ")}. Cabeçalho lido: ${header.join(", ")}`,
    );
  if (index.partner === undefined)
    warnings.push("Coluna 'Parceiro' ausente — parceiro registrado como 'Nao informado'.");

  const rowsIn = lines.length - 1;
  let badDate = 0;
  let incomplete = 0;
  let negatives = 0;
  let zeroBuyers = 0;
  const byKey = new Map<string, DailyRow>();

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i] ?? "", sep);
    const dateRaw = (cells[index.date!] ?? "").trim();
    const date = /^\d{4}-\d{2}-\d{2}/.test(dateRaw)
      ? dateRaw.slice(0, 10)
      : /^\d{2}\/\d{2}\/\d{4}$/.test(dateRaw)
        ? dateRaw.split("/").reverse().join("-")
        : "";
    const group = (cells[index.group!] ?? "").trim();
    if (!date) {
      badDate++;
      continue;
    }
    if (!group) {
      incomplete++;
      continue;
    }
    const buyers = Number(String(cells[index.buyers!] ?? "").replace(/\./g, "").replace(",", "."));
    const commission = parseMoney(cells[index.commission!] ?? "");
    const cashback = parseMoney(cells[index.cashback!] ?? "");
    const gmv = parseMoney(cells[index.gmv!] ?? "");
    if (![buyers, commission, cashback, gmv].every((n) => Number.isFinite(n))) {
      incomplete++;
      continue;
    }
    if ([buyers, commission, cashback, gmv].some((n) => n < 0)) negatives++;
    if (buyers === 0) zeroBuyers++;

    const partner = (index.partner !== undefined ? cells[index.partner] : "")?.trim() || "Nao informado";
    const key = `${date}|${group}`;
    const prev = byKey.get(key);
    if (prev) {
      prev.buyers += buyers;
      prev.commission += commission;
      prev.cashback += cashback;
      prev.gmv += gmv;
    } else {
      byKey.set(key, {
        date,
        group,
        partner,
        buyers,
        commission,
        cashback,
        gmv,
        net: 0,
        netPerBuyer: 0,
        gmvPerBuyer: 0,
      });
    }
  }

  if (badDate) warnings.push(`${badDate} linha(s) com data invalida foram descartadas.`);
  if (incomplete) warnings.push(`${incomplete} linha(s) com metricas vazias/invalidas foram descartadas.`);
  if (negatives) warnings.push(`${negatives} linha(s) com valores negativos — verificar origem.`);
  if (zeroBuyers) warnings.push(`${zeroBuyers} dia(s) com 0 compradores.`);
  const dups = rowsIn - badDate - incomplete - byKey.size;
  if (dups > 0)
    warnings.push(`${dups} par(es) data+variante duplicados — agregados por soma antes da análise.`);

  const rows = [...byKey.values()].map((r) => ({
    ...r,
    net: r.commission - r.cashback,
    netPerBuyer: r.buyers ? (r.commission - r.cashback) / r.buyers : NaN,
    gmvPerBuyer: r.buyers ? r.gmv / r.buyers : NaN,
  }));
  if (!rows.length) throw new Error("Nenhuma linha valida apos a limpeza — verifique o arquivo.");
  warnings.push(`${rows.length} de ${rowsIn} linhas aproveitadas na análise.`);

  rows.sort((a, b) => (a.group === b.group ? a.date.localeCompare(b.date) : a.group.localeCompare(b.group)));
  return { rows, warnings };
}

/* ---------------------------- estatística ---------------------------- */

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
};

function logGamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const tiny = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    c = 1 + aa / c;
    if (Math.abs(d) < tiny) d = tiny;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    c = 1 + aa / c;
    if (Math.abs(d) < tiny) d = tiny;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return h;
}

function betainc(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta);
  if (x < (a + 1) / (a + b + 2)) return (front * betacf(a, b, x)) / a;
  return 1 - (Math.exp(Math.log(1 - x) * b + Math.log(x) * a - lbeta) * betacf(b, a, 1 - x)) / b;
}

export function welchTTest(sample: number[], control: number[]) {
  const a = sample.filter(Number.isFinite);
  const b = control.filter(Number.isFinite);
  if (a.length < 2 || b.length < 2)
    return { diff: NaN, t: NaN, df: NaN, pValue: NaN, ci: [NaN, NaN] as [number, number] };
  const va = variance(a);
  const vb = variance(b);
  const se = Math.sqrt(va / a.length + vb / b.length);
  const diff = mean(a) - mean(b);
  if (se === 0) return { diff, t: 0, df: 0, pValue: 1, ci: [diff, diff] as [number, number] };
  const t = diff / se;
  const df =
    (va / a.length + vb / b.length) ** 2 /
    ((va / a.length) ** 2 / (a.length - 1) + (vb / b.length) ** 2 / (b.length - 1));
  const upper = 0.5 * betainc(df / 2, 0.5, df / (df + t * t));
  const pValue = Math.min(1, Math.max(0, 2 * upper));
  const crit = df > 60 ? 1.96 : 2 + (0.5 * Math.max(0, 30 - df)) / 30;
  return { diff, t, df, pValue, ci: [diff - crit * se, diff + crit * se] as [number, number] };
}

/* ------------------------------ análise ------------------------------ */

function summarize(rows: DailyRow[]): GroupSummary[] {
  const groups = [...new Set(rows.map((r) => r.group))].sort();
  return groups.map((group) => {
    const g = rows.filter((r) => r.group === group);
    const gmv = g.reduce((a, r) => a + r.gmv, 0);
    const buyers = g.reduce((a, r) => a + r.buyers, 0);
    const commission = g.reduce((a, r) => a + r.commission, 0);
    const cashback = g.reduce((a, r) => a + r.cashback, 0);
    const net = commission - cashback;
    return {
      group,
      days: g.length,
      buyers,
      gmv,
      commission,
      cashback,
      net,
      ticket: buyers ? gmv / buyers : NaN,
      cashbackRate: gmv ? cashback / gmv : NaN,
      takeRate: gmv ? commission / gmv : NaN,
      netMargin: gmv ? net / gmv : NaN,
      netPerBuyer: buyers ? net / buyers : NaN,
    };
  });
}

function outlierDays(rows: DailyRow[], z = 3.5) {
  const flags: { group: string; date: string; gmv: number; z: number }[] = [];
  for (const group of new Set(rows.map((r) => r.group))) {
    const g = rows.filter((r) => r.group === group).map((r) => r.gmv);
    const m = mean(g);
    const sd = Math.sqrt(variance(g));
    if (!sd) continue;
    rows
      .filter((r) => r.group === group)
      .forEach((r) => {
        const score = (r.gmv - m) / sd;
        if (Math.abs(score) >= z)
          flags.push({ group, date: r.date, gmv: r.gmv, z: Math.round(score * 100) / 100 });
      });
  }
  return flags.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
}

export function analyze(
  csvText: string,
  options: { sourceFile: string; testName?: string; control?: string; alpha?: number } ,
): AnalysisResult {
  const alpha = options.alpha ?? 0.05;
  const { rows, warnings } = parseCsv(csvText);
  const summary = summarize(rows);
  const variants = summary.map((s) => s.group);
  const control =
    options.control && variants.includes(options.control) ? options.control : (variants[0] ?? "");

  const dates = rows.map((r) => r.date).sort();
  const periodStart = dates[0] ?? "";
  const periodEnd = dates[dates.length - 1] ?? "";
  const days = new Set(dates).size;

  // Janelas diferentes por variante
  const spans = variants.map((v) => {
    const d = rows.filter((r) => r.group === v).map((r) => r.date).sort();
    return { v, min: d[0] ?? "", max: d[d.length - 1] ?? "", n: d.length };
  });
  if (new Set(spans.map((s) => s.min)).size > 1 || new Set(spans.map((s) => s.max)).size > 1)
    warnings.push("Variantes com janelas de data diferentes — risco de vies de sazonalidade.");
  if (new Set(spans.map((s) => s.n)).size > 1)
    warnings.push("Variantes com numero de dias diferente (amostras desbalanceadas).");

  // Sample Ratio Mismatch
  const totalBuyers = summary.reduce((a, s) => a + s.buyers, 0);
  const expected = 1 / summary.length;
  for (const s of summary) {
    const share = s.buyers / totalBuyers;
    if (Math.abs(share / expected - 1) > 0.1)
      warnings.push(
        `Possível Sample Ratio Mismatch: ${s.group} concentra ${(share * 100).toFixed(1)}% dos compradores (esperado ~${(expected * 100).toFixed(1)}%). Checar a divisão de tráfego.`,
      );
  }
  for (const s of summary) {
    if (s.commission && Math.abs(s.cashback - s.commission) / s.commission < 0.001)
      warnings.push(
        `${s.group}: cashback igual a comissão (margem líquida zero) — provavel erro de instrumentacao ou oferta insustentavel.`,
      );
    else if (s.cashback > s.commission)
      warnings.push(`${s.group}: cashback maior que a comissão — a variante opera no negativo.`);
  }

  const base = summary.find((s) => s.group === control)!;
  const comparisons: Comparison[] = summary
    .filter((s) => s.group !== control)
    .map((s) => {
      const test = welchTTest(
        rows.filter((r) => r.group === s.group).map((r) => r.netPerBuyer),
        rows.filter((r) => r.group === control).map((r) => r.netPerBuyer),
      );
      return {
        group: s.group,
        liftNet: base.net ? s.net / base.net - 1 : NaN,
        liftNetPerBuyer: base.netPerBuyer ? s.netPerBuyer / base.netPerBuyer - 1 : NaN,
        liftGmv: base.gmv ? s.gmv / base.gmv - 1 : NaN,
        liftBuyers: base.buyers ? s.buyers / base.buyers - 1 : NaN,
        liftTicket: base.ticket ? s.ticket / base.ticket - 1 : NaN,
        netDelta: s.net - base.net,
        pValue: test.pValue,
        ci: test.ci,
        significant: test.pValue < alpha,
      };
    });

  const best = [...summary].sort((a, b) => b.net - a.net)[0]!;
  let decision: Decision;
  let winner: string;
  let rationale: string;
  if (best.group === control) {
    decision = "manter_controle";
    winner = control;
    rationale = `Nenhuma variante superou o controle (${control}) em receita líquida (comissão - cashback). Manter o controle em 100% do tráfego.`;
  } else {
    const comp = comparisons.find((c) => c.group === best.group)!;
    if (comp.significant) {
      decision = "escalar_variante";
      winner = best.group;
      rationale = `${best.group} lidera a receita líquida (${(comp.liftNet * 100).toFixed(1)}% vs ${control}) com diferença estatisticamente significante no líquido por comprador (p=${comp.pValue.toFixed(4)}). Escalar para 100% do tráfego.`;
    } else {
      decision = "inconclusivo";
      winner = control;
      rationale = `${best.group} lidera a receita líquida (${(comp.liftNet * 100).toFixed(1)}%), mas a diferença no líquido por comprador nao e significante (p=${comp.pValue.toFixed(4)}). Manter o controle e estender o teste.`;
    }
  }

  const partner =
    rows
      .map((r) => r.partner)
      .sort(
        (a, b) =>
          rows.filter((r) => r.partner === b).length - rows.filter((r) => r.partner === a).length,
      )[0] ?? "Nao informado";

  return {
    testName: options.testName || `Cashback A/B — ${partner} (${periodStart} a ${periodEnd})`,
    sourceFile: options.sourceFile,
    partner,
    periodStart,
    periodEnd,
    days,
    control,
    alpha,
    variants,
    summary,
    comparisons,
    daily: rows,
    decision,
    winner,
    rationale,
    warnings,
    outliers: outlierDays(rows),
    generatedAt: new Date().toISOString(),
  };
}

export const DECISION_LABEL: Record<Decision, string> = {
  escalar_variante: "Escalar variante vencedora",
  manter_controle: "Manter controle",
  inconclusivo: "Inconclusivo — estender teste",
};

/** Linha do registro de acompanhamento (planilha de testes). */
export function trackingRow(r: AnalysisResult): string[] {
  const comp = r.comparisons.find((c) => c.group === r.winner);
  const decisão =
    r.decision === "escalar_variante"
      ? `Escalar ${r.winner} para 100% do tráfego`
      : r.decision === "manter_controle"
        ? `Manter ${r.control} (controle)`
        : `Manter ${r.control} e estender o teste`;
  return [
    r.generatedAt.slice(0, 10),
    r.testName,
    `Teste de cashback do ${r.partner} com ${r.variants.length} variantes (${r.variants.join(", ")}) em ${r.days} dias.`,
    r.partner,
    `${r.periodStart} a ${r.periodEnd}`,
    r.variants.join(", "),
    r.rationale,
    decisão,
    "Receita líquida (comissão - cashback)",
    comp ? `${(comp.liftNet * 100).toFixed(1)}%` : "0.0%",
    comp ? comp.pValue.toFixed(4) : "-",
    comp ? comp.netDelta.toFixed(0) : "0",
    r.sourceFile,
  ];
}

export const TRACKING_HEADER = [
  "data_analise",
  "nome_do_teste",
  "descricao",
  "parceiro",
  "período",
  "variantes",
  "resultado",
  "decisão",
  "metrica_principal",
  "lift_receita_liquida",
  "p_valor",
  "impacto_liquido_rs",
  "arquivo_fonte",
];
