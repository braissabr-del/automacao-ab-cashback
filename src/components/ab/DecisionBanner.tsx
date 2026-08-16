import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { AnalysisResult } from "@/lib/ab/analysis";
import { brl, signedPct } from "@/lib/ab/format";

export function DecisionBanner({ result }: { result: AnalysisResult }) {
  const comp = result.comparisons.find((c) => c.group === result.winner);
  const config = {
    escalar_variante: {
      Icon: CheckCircle2,
      tone: "border-success/40 bg-success/10 text-success-foreground",
      badge: "bg-success text-success-foreground",
      label: "Escalar variante",
      headline: `Escalar ${result.winner} para 100% do tráfego`,
    },
    manter_controle: {
      Icon: ShieldAlert,
      tone: "border-destructive/40 bg-destructive/10 text-foreground",
      badge: "bg-destructive text-destructive-foreground",
      label: "Manter controle",
      headline: `Manter ${result.control} — nenhuma variante venceu`,
    },
    inconclusivo: {
      Icon: AlertTriangle,
      tone: "border-warning/40 bg-warning/10 text-foreground",
      badge: "bg-warning text-warning-foreground",
      label: "Inconclusivo",
      headline: `Manter ${result.control} e estender o teste`,
    },
  }[result.decision];

  return (
    <section className={`rounded-2xl border p-6 shadow-card ${config.tone}`}>
      <div className="flex flex-wrap items-start gap-4">
        <config.Icon className="mt-0.5 size-7 shrink-0" aria-hidden />
        <div className="min-w-64 flex-1">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config.badge}`}
          >
            {config.label}
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {config.headline}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {result.rationale}
          </p>
        </div>
        {comp ? (
          <dl className="grid grid-cols-2 gap-4 rounded-xl bg-card/70 p-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Δ receita líquida</dt>
              <dd className="text-lg font-semibold text-foreground">{signedPct(comp.liftNet)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Impacto no período</dt>
              <dd className="text-lg font-semibold text-foreground">{brl(comp.netDelta)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">p-valor</dt>
              <dd className="text-lg font-semibold text-foreground">{comp.pValue.toFixed(4)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Significante</dt>
              <dd className="text-lg font-semibold text-foreground">
                {comp.significant ? "Sim" : "Não"}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}
