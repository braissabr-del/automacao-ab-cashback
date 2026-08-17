import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Uploader } from "@/components/ab/Uploader";
import { DecisionBanner } from "@/components/ab/DecisionBanner";
import { ComparisonTable, DataQuality, VariantTable } from "@/components/ab/ResultTables";
import { TrendCharts } from "@/components/ab/TrendCharts";
import { SheetsPanel } from "@/components/ab/SheetsPanel";
import { analyze, type AnalysisResult } from "@/lib/ab/analysis";
import { brl, int } from "@/lib/ab/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Analisador Cashback Méliuz" },
      {
        name: "description",
        content:
          "Suba o CSV de um teste A/B de cashback e receba relatório executivo, leitura crítica dos dados e a decisão de qual variante escalar.",
      },
      { property: "og:title", content: "Analisador Cashback Méliuz" },
      {
        property: "og:description",
        content:
          "Análise automática de testes A/B de cashback: margem líquida, significância estatística e registro no Google Sheets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleData = (file: string, text: string) => {
    try {
      setResult(analyze(text, { sourceFile: file }));
      setError(null);
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <header className="border-b border-border bg-gradient-to-r from-primary/10 via-card to-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-card">
              <BarChart3 className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Méliuz
              </p>
              <h1 className="text-xl font-semibold text-foreground">
                Analisador Cashback
              </h1>
            </div>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Um dataset por vez, sem tocar em código: leitura crítica dos dados, decisão de qual
            variante escalar e registro do teste na planilha de acompanhamento.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Uploader onData={handleData} />

        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-foreground">
            <strong className="font-semibold">Não foi possível analisar o arquivo:</strong> {error}
          </div>
        ) : null}

        {result ? (
          <>
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{result.testName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.partner} · {result.periodStart} a {result.periodEnd} · {result.days} dias
                    · {result.variants.length} variantes · controle: {result.control} · fonte:{" "}
                    {result.sourceFile}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  <Sparkles className="size-3.5" aria-hidden />
                  Análise gerada automaticamente
                </span>
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "GMV total",
                    value: brl(result.summary.reduce((a, s) => a + s.gmv, 0)),
                  },
                  {
                    label: "Compradores",
                    value: int(result.summary.reduce((a, s) => a + s.buyers, 0)),
                  },
                  {
                    label: "Cashback distribuído",
                    value: brl(result.summary.reduce((a, s) => a + s.cashback, 0)),
                  },
                  {
                    label: "Receita líquida",
                    value: brl(result.summary.reduce((a, s) => a + s.net, 0)),
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-border bg-muted/30 p-4">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      {kpi.label}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                      {kpi.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <DecisionBanner result={result} />
            <VariantTable result={result} />
            <ComparisonTable result={result} />
            <TrendCharts result={result} />
            <div className="grid gap-5 lg:grid-cols-2">
              <DataQuality result={result} />
              <SheetsPanel result={result} />
            </div>
          </>
        ) : null}
      </div>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Métrica de decisão: receita líquida (comissão − cashback). Significância por teste t de
        Welch sobre a série diária.
      </footer>
    </main>
  );
}
