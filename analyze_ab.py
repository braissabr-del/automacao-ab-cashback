import argparse
from pathlib import Path
import pandas as pd


REQUIRED = [
    "Data",
    "Grupos de usuários",
    "Parceiro",
    "compradores",
    "comissão",
    "cashback",
    "vendas totais",
]


def money(series):
    """Converte valores monetários dos datasets para números."""
    return pd.to_numeric(
        series.astype(str)
        .str.replace("R$", "", regex=False)
        .str.strip()
        .str.replace(",", ".", regex=False),
        errors="coerce",
    )

def main():
    parser = argparse.ArgumentParser(
        description="Analisador automático de testes A/B"
    )

    parser.add_argument("input", help="Caminho para o arquivo CSV")
    parser.add_argument(
        "--output-dir",
        default="reports",
        help="Pasta onde o relatório será salvo",
    )

    args = parser.parse_args()

    df = pd.read_csv(args.input)

    missing = [column for column in REQUIRED if column not in df.columns]

    if missing:
        raise ValueError(f"Schema inválido. Ausentes: {missing}")

    df["Data"] = pd.to_datetime(df["Data"], errors="coerce")

    for column in ["comissão", "cashback", "vendas totais"]:
        df[column] = money(df[column])

    df["cashback_rate"] = df["cashback"] / df["vendas totais"]
    df["commission_rate"] = df["comissão"] / df["vendas totais"]

    df["net_contribution"] = df["comissão"] - df["cashback"]
    df["net_margin"] = df["net_contribution"] / df["vendas totais"]

    df["dq_flag"] = (
        df[REQUIRED].isna().any(axis=1)
        | (df["compradores"] <= 0)
        | (df["vendas totais"] <= 0)
        | (df["comissão"] < 0)
        | (df["cashback"] < 0)
        | (df["cashback_rate"] > 0.20)
        | (df["commission_rate"] > 0.30)
    )

    clean = df[~df["dq_flag"]]

    summary = (
        clean.groupby("Grupos de usuários")
        .agg(
            contribuicao_media=("net_contribution", "mean"),
            margem_liquida_media=("net_margin", "mean"),
        )
        .sort_values("contribuicao_media", ascending=False)
    )

    winner = summary.index[0]

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    report = output_dir / f"{Path(args.input).stem}_relatorio.md"

    report.write_text(
        f"""# Análise A/B — {df["Parceiro"].iloc[0]}

**Decisão:** escalar **{winner}**.

## Métricas

{summary.to_markdown()}

Linhas sinalizadas: {int(df["dq_flag"].sum())}.
""",
        encoding="utf-8",
    )

    print(f"Decisão: escalar {winner}")
    print(f"Linhas sinalizadas: {int(df['dq_flag'].sum())}")
    print(f"Relatório: {report}")


if __name__ == "__main__":
    main()