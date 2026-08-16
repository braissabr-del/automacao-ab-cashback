#!/usr/bin/env python3
"""
Analisador reutilizavel de testes A/B de cashback (Meliuz).

Uso:
    python analysis/ab_analysis.py <caminho_do_csv> [--test-name NOME]
        [--control "Grupo 1"] [--alpha 0.05] [--outdir reports]
        [--tracking reports/tracking_testes.csv]

Nao precisa alterar codigo para rodar outro teste: o script descobre
parceiro, periodo e numero de variantes a partir do proprio arquivo.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from report import render_markdown
from stats import welch_ttest

CONTROL_DEFAULT = "Grupo 1"

COLUMN_ALIASES = {
    "data": "date",
    "date": "date",
    "grupos de usuarios": "group",
    "grupo": "group",
    "variante": "group",
    "parceiro": "partner",
    "compradores": "buyers",
    "comissao": "commission",
    "cashback": "cashback",
    "vendas totais": "gmv",
    "gmv": "gmv",
}

MONEY_COLS = ["commission", "cashback", "gmv"]


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", text).strip().lower()


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", _norm(text)).strip("-")


def parse_money(value) -> float:
    """Converte 'R$ 10.273,50' -> 10273.5. Tolera vazio, texto e numero."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return float("nan")
    if isinstance(value, (int, float)):
        return float(value)
    raw = str(value).strip()
    if raw in {"", "-", "--", "n/a", "N/A", "null", "None"}:
        return float("nan")
    raw = raw.replace("R$", "").replace("r$", "").replace("\xa0", " ").strip()
    negative = raw.startswith("(") and raw.endswith(")")
    raw = raw.strip("()").replace(" ", "")
    if "," in raw and "." in raw:
        raw = raw.replace(".", "").replace(",", ".")
    elif "," in raw:
        raw = raw.replace(",", ".")
    try:
        number = float(raw)
    except ValueError:
        return float("nan")
    return -number if negative else number


def load_dataset(path: Path) -> tuple[pd.DataFrame, list[str]]:
    """Le o CSV, normaliza colunas/valores e devolve alertas de qualidade."""
    warnings: list[str] = []
    raw = pd.read_csv(path, sep=None, engine="python", dtype=str)
    rename = {}
    for col in raw.columns:
        key = _norm(col)
        if key in COLUMN_ALIASES:
            rename[col] = COLUMN_ALIASES[key]
    df = raw.rename(columns=rename)

    required = ["date", "group", "buyers", "commission", "cashback", "gmv"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise SystemExit(
            f"Colunas obrigatorias ausentes no arquivo: {missing}. "
            f"Colunas encontradas: {list(raw.columns)}"
        )
    if "partner" not in df.columns:
        df["partner"] = "Nao informado"
        warnings.append("Coluna 'Parceiro' ausente — parceiro registrado como 'Nao informado'.")

    rows_in = len(df)
    df["date"] = pd.to_datetime(df["date"], errors="coerce", dayfirst=False)
    bad_dates = int(df["date"].isna().sum())
    if bad_dates:
        warnings.append(f"{bad_dates} linha(s) com data invalida foram descartadas.")
        df = df[df["date"].notna()]

    df["group"] = df["group"].astype(str).str.strip()
    df["partner"] = df["partner"].astype(str).str.strip()
    df["buyers"] = pd.to_numeric(df["buyers"], errors="coerce")
    for col in MONEY_COLS:
        df[col] = df[col].map(parse_money)

    empty_group = int((df["group"].isin(["", "nan", "None"])).sum())
    if empty_group:
        warnings.append(f"{empty_group} linha(s) sem variante foram descartadas.")
        df = df[~df["group"].isin(["", "nan", "None"])]

    incomplete = int(df[["buyers"] + MONEY_COLS].isna().any(axis=1).sum())
    if incomplete:
        warnings.append(f"{incomplete} linha(s) com metricas vazias/invalidas foram descartadas.")
        df = df.dropna(subset=["buyers"] + MONEY_COLS)

    negatives = int((df[["buyers"] + MONEY_COLS] < 0).any(axis=1).sum())
    if negatives:
        warnings.append(f"{negatives} linha(s) com valores negativos — mantidas, verificar origem.")

    dups = int(df.duplicated(subset=["date", "group"]).sum())
    if dups:
        warnings.append(
            f"{dups} par(es) data+variante duplicados — agregados por soma antes da analise."
        )
        df = (
            df.groupby(["date", "group", "partner"], as_index=False)[["buyers"] + MONEY_COLS]
            .sum()
        )

    zero_buyers = int((df["buyers"] == 0).sum())
    if zero_buyers:
        warnings.append(f"{zero_buyers} dia(s) com 0 compradores.")

    if len(df) == 0:
        raise SystemExit("Nenhuma linha valida apos a limpeza — verifique o arquivo.")

    warnings.append(f"{len(df)} de {rows_in} linhas aproveitadas na analise.")

    # Janelas de datas diferentes entre variantes = comparacao enviesada.
    spans = df.groupby("group")["date"].agg(["min", "max", "count"])
    if spans["min"].nunique() > 1 or spans["max"].nunique() > 1:
        warnings.append(
            "Variantes com janelas de data diferentes — comparacao pode estar enviesada "
            "por sazonalidade."
        )
    if spans["count"].nunique() > 1:
        warnings.append("Variantes com numero de dias diferente (amostras desbalanceadas).")

    return df.sort_values(["group", "date"]).reset_index(drop=True), warnings


def derive_daily(df: pd.DataFrame) -> pd.DataFrame:
    d = df.copy()
    d["net"] = d["commission"] - d["cashback"]
    d["net_per_buyer"] = d.apply(
        lambda r: r["net"] / r["buyers"] if r["buyers"] else float("nan"), axis=1
    )
    d["gmv_per_buyer"] = d.apply(
        lambda r: r["gmv"] / r["buyers"] if r["buyers"] else float("nan"), axis=1
    )
    return d


def group_summary(daily: pd.DataFrame) -> list[dict]:
    out = []
    for group, g in daily.groupby("group"):
        gmv = float(g["gmv"].sum())
        buyers = float(g["buyers"].sum())
        commission = float(g["commission"].sum())
        cashback = float(g["cashback"].sum())
        net = commission - cashback
        out.append(
            {
                "group": group,
                "days": int(len(g)),
                "buyers": buyers,
                "gmv": gmv,
                "commission": commission,
                "cashback": cashback,
                "net": net,
                "ticket": gmv / buyers if buyers else float("nan"),
                "cashback_rate": cashback / gmv if gmv else float("nan"),
                "take_rate": commission / gmv if gmv else float("nan"),
                "net_margin": net / gmv if gmv else float("nan"),
                "net_per_buyer": net / buyers if buyers else float("nan"),
                "roi_cashback": net / cashback if cashback else float("nan"),
            }
        )
    return sorted(out, key=lambda r: r["group"])


def outlier_days(daily: pd.DataFrame, z: float = 3.5) -> list[dict]:
    flags = []
    for group, g in daily.groupby("group"):
        mean, std = g["gmv"].mean(), g["gmv"].std(ddof=1)
        if not std or pd.isna(std):
            continue
        for _, row in g.iterrows():
            score = (row["gmv"] - mean) / std
            if abs(score) >= z:
                flags.append(
                    {
                        "group": group,
                        "date": row["date"].strftime("%Y-%m-%d"),
                        "gmv": float(row["gmv"]),
                        "z": round(float(score), 2),
                    }
                )
    return sorted(flags, key=lambda r: -abs(r["z"]))


def analyze(path: Path, test_name: str | None, control: str, alpha: float) -> dict:
    df, warnings = load_dataset(path)
    daily = derive_daily(df)
    summary = group_summary(daily)
    groups = [row["group"] for row in summary]

    if control not in groups:
        control = groups[0]
        warnings.append(f"Grupo de controle informado nao existe — usando '{control}'.")

    base = next(r for r in summary if r["group"] == control)
    comparisons = []
    for row in summary:
        if row["group"] == control:
            continue
        test_net = welch_ttest(
            daily.loc[daily["group"] == row["group"], "net_per_buyer"].dropna().tolist(),
            daily.loc[daily["group"] == control, "net_per_buyer"].dropna().tolist(),
        )
        test_gmv = welch_ttest(
            daily.loc[daily["group"] == row["group"], "gmv_per_buyer"].dropna().tolist(),
            daily.loc[daily["group"] == control, "gmv_per_buyer"].dropna().tolist(),
        )
        comparisons.append(
            {
                "group": row["group"],
                "lift_net": row["net"] / base["net"] - 1 if base["net"] else float("nan"),
                "lift_net_per_buyer": row["net_per_buyer"] / base["net_per_buyer"] - 1
                if base["net_per_buyer"]
                else float("nan"),
                "lift_gmv": row["gmv"] / base["gmv"] - 1 if base["gmv"] else float("nan"),
                "lift_buyers": row["buyers"] / base["buyers"] - 1 if base["buyers"] else float("nan"),
                "lift_ticket": row["ticket"] / base["ticket"] - 1 if base["ticket"] else float("nan"),
                "net_delta": row["net"] - base["net"],
                "p_value_net_per_buyer": test_net["p_value"],
                "ci_net_per_buyer": test_net["ci"],
                "p_value_gmv_per_buyer": test_gmv["p_value"],
                "significant": bool(test_net["p_value"] < alpha),
            }
        )

    # Decisao: melhor receita liquida total, com significancia no liquido/comprador.
    ranked = sorted(summary, key=lambda r: -r["net"])
    best = ranked[0]
    if best["group"] == control:
        decision = "manter_controle"
        winner = control
        rationale = (
            f"Nenhuma variante superou o controle ({control}) em receita liquida "
            "(comissao - cashback). Manter o controle em 100% do trafego."
        )
    else:
        comp = next(c for c in comparisons if c["group"] == best["group"])
        if comp["significant"]:
            decision = "escalar_variante"
            winner = best["group"]
            rationale = (
                f"{best['group']} lidera a receita liquida (+{comp['lift_net']*100:.1f}% vs "
                f"{control}) com diferenca estatisticamente significante no liquido por "
                f"comprador (p={comp['p_value_net_per_buyer']:.4f}). Escalar para 100%."
            )
        else:
            decision = "inconclusivo"
            winner = control
            rationale = (
                f"{best['group']} lidera a receita liquida (+{comp['lift_net']*100:.1f}%), mas a "
                f"diferenca no liquido por comprador nao e significante "
                f"(p={comp['p_value_net_per_buyer']:.4f}). Manter o controle e estender o teste."
            )

    partner = df["partner"].mode().iat[0]
    period = (df["date"].min().strftime("%Y-%m-%d"), df["date"].max().strftime("%Y-%m-%d"))
    name = test_name or f"Cashback A/B — {partner} ({period[0]} a {period[1]})"

    return {
        "test_name": name,
        "test_slug": slugify(name),
        "source_file": path.name,
        "partner": partner,
        "period_start": period[0],
        "period_end": period[1],
        "days": int(df["date"].nunique()),
        "control": control,
        "alpha": alpha,
        "variants": groups,
        "summary": summary,
        "comparisons": comparisons,
        "decision": decision,
        "winner": winner,
        "rationale": rationale,
        "warnings": warnings,
        "outliers": outlier_days(daily),
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


TRACKING_HEADER = [
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
]


def tracking_row(result: dict) -> dict:
    winner = result["winner"]
    comp = next((c for c in result["comparisons"] if c["group"] == winner), None)
    decisions = {
        "escalar_variante": f"Escalar {winner} para 100% do trafego",
        "manter_controle": f"Manter {result['control']} (controle)",
        "inconclusivo": f"Manter {result['control']} e estender o teste",
    }
    return {
        "data_analise": result["generated_at"][:10],
        "nome_do_teste": result["test_name"],
        "descricao": (
            f"Teste de cashback do {result['partner']} com {len(result['variants'])} variantes "
            f"({', '.join(result['variants'])}) em {result['days']} dias."
        ),
        "parceiro": result["partner"],
        "periodo": f"{result['period_start']} a {result['period_end']}",
        "variantes": ", ".join(result["variants"]),
        "resultado": result["rationale"],
        "decisao": decisions[result["decision"]],
        "metrica_principal": "Receita liquida (comissao - cashback)",
        "lift_receita_liquida": f"{comp['lift_net']*100:.1f}%" if comp else "0.0%",
        "p_valor": f"{comp['p_value_net_per_buyer']:.4f}" if comp else "-",
        "impacto_liquido_rs": f"{comp['net_delta']:.0f}" if comp else "0",
        "arquivo_fonte": result["source_file"],
    }


def append_tracking(path: Path, row: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        df = pd.read_csv(path)
        df = df[df["nome_do_teste"] != row["nome_do_teste"]]
        df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
    else:
        df = pd.DataFrame([row], columns=TRACKING_HEADER)
    df.to_csv(path, index=False, columns=TRACKING_HEADER)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Analise de teste A/B de cashback")
    ap.add_argument("csv", type=Path, help="Caminho do dataset CSV")
    ap.add_argument("--test-name", default=None)
    ap.add_argument("--control", default=CONTROL_DEFAULT)
    ap.add_argument("--alpha", type=float, default=0.05)
    ap.add_argument("--outdir", type=Path, default=Path("reports"))
    ap.add_argument("--tracking", type=Path, default=Path("reports/tracking_testes.csv"))
    args = ap.parse_args(argv)

    if not args.csv.exists():
        raise SystemExit(f"Arquivo nao encontrado: {args.csv}")

    result = analyze(args.csv, args.test_name, args.control, args.alpha)
    args.outdir.mkdir(parents=True, exist_ok=True)
    md_path = args.outdir / f"{result['test_slug']}.md"
    json_path = args.outdir / f"{result['test_slug']}.json"
    md_path.write_text(render_markdown(result), encoding="utf-8")
    json_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    append_tracking(args.tracking, tracking_row(result))

    print(f"Relatorio:  {md_path}")
    print(f"JSON:       {json_path}")
    print(f"Tracking:   {args.tracking}")
    print(f"Decisao:    {result['decision']} -> {result['winner']}")
    print(result["rationale"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
