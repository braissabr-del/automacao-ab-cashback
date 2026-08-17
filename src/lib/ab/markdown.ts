import type { AnalysisResult } from "./analysis";
import { brl, pct, signedPct, int } from "./format";

/** Relatorio em Markdown, mesmo formato do script Python. */
export function renderMarkdown(r: AnalysisResult): string {
  const decision = {
    escalar_variante: `Escalar **${r.winner}** para 100% do tráfego`,
    manter_controle: `Manter **${r.control}** (controle) — nenhuma variante venceu`,
    inconclusivo: `Inconclusivo — manter **${r.control}** e estender o teste`,
  }[r.decision];

  const l: string[] = [];
  l.push(`# ${r.testName}`, "");
  l.push(
    `**Parceiro:** ${r.partner} | **Período:** ${r.periodStart} a ${r.periodEnd} (${r.days} dias) | ` +
      `**Variantes:** ${r.variants.join(", ")} | **Controle:** ${r.control}`,
    "",
  );
  l.push("## 1. Decisão", "", `> ${decision}`, "", r.rationale, "");
  l.push(
    "**Metrica de decisão:** receita líquida = comissão recebida do parceiro − cashback distribuido.",
    "",
  );
  l.push("## 2. Resultados consolidados", "");
  l.push(
    "| Variante | Dias | Compradores | GMV | Comissão | Cashback | Receita líquida | Ticket médio | % cashback/GMV | Margem líquida | Líquido/comprador |",
  );
  l.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
  for (const s of r.summary) {
    l.push(
      `| **${s.group}**${s.group === r.control ? " (controle)" : ""} | ${s.days} | ${int(s.buyers)} | ${brl(s.gmv)} | ${brl(s.commission)} | ${brl(s.cashback)} | **${brl(s.net)}** | ${brl(s.ticket)} | ${pct(s.cashbackRate, 2)} | ${pct(s.netMargin, 2)} | ${brl(s.netPerBuyer, 2)} |`,
    );
  }
  l.push("", "## 3. Comparacao vs controle", "");
  l.push(
    `| Variante | Δ Receita líquida | Δ líquido/comprador | Δ GMV | Δ Compradores | Δ Ticket | Impacto no período | p-valor | Significante (α=${r.alpha}) |`,
  );
  l.push("|---|---:|---:|---:|---:|---:|---:|---:|:--:|");
  for (const c of r.comparisons) {
    l.push(
      `| **${c.group}** | ${signedPct(c.liftNet)} | ${signedPct(c.liftNetPerBuyer)} | ${signedPct(c.liftGmv)} | ${signedPct(c.liftBuyers)} | ${signedPct(c.liftTicket)} | ${brl(c.netDelta)} | ${c.pValue.toFixed(4)} | ${c.significant ? "Sim" : "Nao"} |`,
    );
  }
  l.push(
    "",
    "Teste t de Welch sobre a série diaria de receita líquida por comprador.",
    "",
    "## 4. Leitura critica dos dados",
    "",
  );
  for (const w of r.warnings) l.push(`- ${w}`);
  if (r.outliers.length)
    l.push(
      `- ${r.outliers.length} dia(s) atípico(s) de GMV (|z| >= 3,5): ` +
        r.outliers
          .slice(0, 5)
          .map((o) => `${o.group} ${o.date} (${brl(o.gmv)}, z=${o.z})`)
          .join(", "),
    );
  else l.push("- Nenhum dia atípico de GMV (|z| >= 3,5) detectado.");
  l.push("", "## 5. Proximos passos", "");
  if (r.decision === "escalar_variante") {
    l.push(`1. Subir **${r.winner}** para 100% do tráfego do ${r.partner}.`);
    l.push("2. Monitorar margem líquida por 2 semanas (guardrail de queda > 5%).");
    l.push("3. Testar a proxima faixa de cashback acima da vencedora para achar o teto.");
  } else {
    l.push(`1. Manter **${r.control}** no ar — nao ha ganho líquido comprovado.`);
    l.push("2. Estender o teste ou aumentar a amostra antes de nova decisão.");
    l.push("3. Revisar dias atípicos e a divisão de tráfego antes de reanalisar.");
  }
  l.push("", `_Gerado em ${r.generatedAt} a partir de \`${r.sourceFile}\`._`, "");
  return l.join("\n");
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((r) => r.map((c) => (/[",\n;]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
    .join("\n");
}

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
