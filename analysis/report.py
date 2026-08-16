"""Renderizacao do relatorio em Markdown, formato apresentavel para gestor."""

from __future__ import annotations


def brl(value: float) -> str:
    if value != value:
        return "—"
    s = f"{abs(value):,.0f}".replace(",", ".")
    return f"{'-' if value < 0 else ''}R$ {s}"


def pct(value: float, decimals: int = 1) -> str:
    if value != value:
        return "—"
    return f"{value * 100:.{decimals}f}%"


def signed_pct(value: float) -> str:
    if value != value:
        return "—"
    return f"{'+' if value >= 0 else ''}{value * 100:.1f}%"


def render_markdown(r: dict) -> str:
    decision_label = {
        "escalar_variante": f"✅ Escalar **{r['winner']}** para 100% do trafego",
        "manter_controle": f"⛔ Manter **{r['control']}** (controle) — nenhuma variante venceu",
        "inconclusivo": f"⚠️ Inconclusivo — manter **{r['control']}** e estender o teste",
    }[r["decision"]]

    lines: list[str] = []
    lines.append(f"# {r['test_name']}")
    lines.append("")
    lines.append(
        f"**Parceiro:** {r['partner']}  |  **Periodo:** {r['period_start']} a "
        f"{r['period_end']} ({r['days']} dias)  |  **Variantes:** {', '.join(r['variants'])}  |  "
        f"**Controle:** {r['control']}"
    )
    lines.append("")
    lines.append("## 1. Decisao")
    lines.append("")
    lines.append(f"> {decision_label}")
    lines.append("")
    lines.append(r["rationale"])
    lines.append("")
    lines.append(
        "**Metrica de decisao:** receita liquida do Meliuz = comissao recebida do parceiro − "
        "cashback distribuido. GMV e compradores sao metricas de apoio: cashback maior quase "
        "sempre gera mais volume, mas so vale escalar se sobrar mais margem."
    )
    lines.append("")

    lines.append("## 2. Resultados consolidados")
    lines.append("")
    lines.append(
        "| Variante | Dias | Compradores | GMV | Comissao | Cashback | Receita liquida | "
        "Ticket medio | % cashback / GMV | Margem liquida | Liquido / comprador |"
    )
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for row in r["summary"]:
        tag = " (controle)" if row["group"] == r["control"] else ""
        lines.append(
            f"| **{row['group']}**{tag} | {row['days']} | {row['buyers']:,.0f} | "
            f"{brl(row['gmv'])} | {brl(row['commission'])} | {brl(row['cashback'])} | "
            f"**{brl(row['net'])}** | {brl(row['ticket'])} | {pct(row['cashback_rate'], 2)} | "
            f"{pct(row['net_margin'], 2)} | {brl(row['net_per_buyer'])} |".replace(",", ".")
        )
    lines.append("")

    lines.append("## 3. Comparacao vs controle")
    lines.append("")
    lines.append(
        "| Variante | Δ Receita liquida | Δ liquido/comprador | Δ GMV | Δ Compradores | "
        "Δ Ticket | Impacto liquido no periodo | p-valor | Significante (α=%s) |"
        % r["alpha"]
    )
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|:--:|")
    for c in r["comparisons"]:
        lines.append(
            f"| **{c['group']}** | {signed_pct(c['lift_net'])} | "
            f"{signed_pct(c['lift_net_per_buyer'])} | {signed_pct(c['lift_gmv'])} | "
            f"{signed_pct(c['lift_buyers'])} | {signed_pct(c['lift_ticket'])} | "
            f"{brl(c['net_delta'])} | {c['p_value_net_per_buyer']:.4f} | "
            f"{'Sim' if c['significant'] else 'Nao'} |"
        )
    lines.append("")
    lines.append(
        "O p-valor vem de um teste t de Welch sobre a serie diaria de receita liquida por "
        "comprador (variancias desiguais, amostras possivelmente desbalanceadas)."
    )
    lines.append("")

    lines.append("## 4. Leitura critica dos dados")
    lines.append("")
    for w in r["warnings"]:
        lines.append(f"- {w}")
    if r["outliers"]:
        lines.append(
            f"- {len(r['outliers'])} dia(s) atipico(s) de GMV (|z| ≥ 3,5), que podem inflar "
            "medias: "
            + ", ".join(f"{o['group']} {o['date']} ({brl(o['gmv'])}, z={o['z']})" for o in r["outliers"][:5])
        )
    else:
        lines.append("- Nenhum dia atipico de GMV (|z| ≥ 3,5) detectado.")
    lines.append("")

    lines.append("## 5. Proximos passos sugeridos")
    lines.append("")
    if r["decision"] == "escalar_variante":
        lines.append(f"1. Subir **{r['winner']}** para 100% do trafego do {r['partner']}.")
        lines.append("2. Monitorar margem liquida por 2 semanas pos-rollout (guardrail de queda > 5%).")
        lines.append("3. Testar a proxima faixa de cashback acima da vencedora para achar o teto.")
    else:
        lines.append(f"1. Manter **{r['control']}** no ar — nao ha ganho liquido comprovado.")
        lines.append("2. Estender o teste ou aumentar a amostra antes de nova decisao.")
        lines.append("3. Revisar dias atipicos e janelas de data antes de reanalisar.")
    lines.append("")
    lines.append(
        f"_Gerado automaticamente em {r['generated_at']} a partir de `{r['source_file']}`._"
    )
    lines.append("")
    return "\n".join(lines)
