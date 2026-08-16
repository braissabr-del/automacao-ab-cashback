export const brl = (v: number, decimals = 0) =>
  Number.isFinite(v)
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(v)
    : "—";

export const pct = (v: number, decimals = 1) =>
  Number.isFinite(v) ? `${(v * 100).toFixed(decimals)}%` : "—";

export const signedPct = (v: number, decimals = 1) =>
  Number.isFinite(v) ? `${v >= 0 ? "+" : ""}${(v * 100).toFixed(decimals)}%` : "—";

export const int = (v: number) =>
  Number.isFinite(v) ? new Intl.NumberFormat("pt-BR").format(Math.round(v)) : "—";

export const shortDate = (iso: string) => iso.slice(5).split("-").reverse().join("/");
