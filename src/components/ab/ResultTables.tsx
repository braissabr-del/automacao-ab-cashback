import type { AnalysisResult } from "@/lib/ab/analysis";
import { brl, int, pct, signedPct } from "@/lib/ab/format";

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${right ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

function Td({ children, right, strong }: { children: React.ReactNode; right?: boolean; strong?: boolean }) {
  return (
    <td
      className={`whitespace-nowrap px-3 py-2.5 text-sm ${right ? "text-right tabular-nums" : ""} ${strong ? "font-semibold text-foreground" : "text-foreground/90"}`}
    >
      {children}
    </td>
  );
}

export function VariantTable({ result }: { result: AnalysisResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <header className="border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-foreground">Resultados consolidados</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Receita líquida = comissão do parceiro − cashback distribuído.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th>Variante</Th>
              <Th right>Dias</Th>
              <Th right>Compradores</Th>
              <Th right>GMV</Th>
              <Th right>Comissão</Th>
              <Th right>Cashback</Th>
              <Th right>Receita líquida</Th>
              <Th right>Ticket médio</Th>
              <Th right>% cashback/GMV</Th>
              <Th right>Margem líquida</Th>
              <Th right>Líquido/comprador</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.summary.map((s) => (
              <tr key={s.group} className={s.group === result.winner ? "bg-success/5" : undefined}>
                <Td strong>
                  {s.group}
                  {s.group === result.control ? (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      controle
                    </span>
                  ) : null}
                </Td>
                <Td right>{s.days}</Td>
                <Td right>{int(s.buyers)}</Td>
                <Td right>{brl(s.gmv)}</Td>
                <Td right>{brl(s.commission)}</Td>
                <Td right>{brl(s.cashback)}</Td>
                <Td right strong>
                  {brl(s.net)}
                </Td>
                <Td right>{brl(s.ticket)}</Td>
                <Td right>{pct(s.cashbackRate, 2)}</Td>
                <Td right>{pct(s.netMargin, 2)}</Td>
                <Td right>{brl(s.netPerBuyer, 2)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ComparisonTable({ result }: { result: AnalysisResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <header className="border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-foreground">
          Comparação vs {result.control} (controle)
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          p-valor: teste t de Welch sobre a série diária de receita líquida por comprador (α ={" "}
          {result.alpha}).
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th>Variante</Th>
              <Th right>Δ receita líquida</Th>
              <Th right>Δ líquido/comprador</Th>
              <Th right>Δ GMV</Th>
              <Th right>Δ compradores</Th>
              <Th right>Δ ticket</Th>
              <Th right>Impacto no período</Th>
              <Th right>p-valor</Th>
              <Th right>Significante</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.comparisons.map((c) => (
              <tr key={c.group}>
                <Td strong>{c.group}</Td>
                <Td right strong>
                  <span className={c.liftNet >= 0 ? "text-success" : "text-destructive"}>
                    {signedPct(c.liftNet)}
                  </span>
                </Td>
                <Td right>{signedPct(c.liftNetPerBuyer)}</Td>
                <Td right>{signedPct(c.liftGmv)}</Td>
                <Td right>{signedPct(c.liftBuyers)}</Td>
                <Td right>{signedPct(c.liftTicket)}</Td>
                <Td right>{brl(c.netDelta)}</Td>
                <Td right>{c.pValue.toFixed(4)}</Td>
                <Td right>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.significant ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {c.significant ? "Sim" : "Não"}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataQuality({ result }: { result: AnalysisResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-base font-semibold text-foreground">Leitura crítica dos dados</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {result.warnings.map((w) => (
          <li key={w} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
            <span>{w}</span>
          </li>
        ))}
        <li className="flex gap-2">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
          <span>
            {result.outliers.length
              ? `${result.outliers.length} dia(s) atípico(s) de GMV (|z| ≥ 3,5): ` +
                result.outliers
                  .slice(0, 4)
                  .map((o) => `${o.group} ${o.date} (${brl(o.gmv)}, z=${o.z})`)
                  .join(" · ")
              : "Nenhum dia atípico de GMV (|z| ≥ 3,5) detectado."}
          </span>
        </li>
      </ul>
    </div>
  );
}
