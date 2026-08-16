import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisResult } from "@/lib/ab/analysis";
import { brl, shortDate } from "@/lib/ab/format";

const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function TrendCharts({ result }: { result: AnalysisResult }) {
  const dates = [...new Set(result.daily.map((d) => d.date))].sort();
  const cumulative: Record<string, number> = {};
  const series = dates.map((date) => {
    const point: Record<string, string | number> = { date: shortDate(date) };
    for (const v of result.variants) {
      const row = result.daily.find((d) => d.date === date && d.group === v);
      cumulative[v] = (cumulative[v] ?? 0) + (row?.net ?? 0);
      point[v] = Math.round(cumulative[v]);
    }
    return point;
  });

  const bars = result.summary.map((s) => ({
    group: s.group,
    líquido: Math.round(s.net),
    cashback: Math.round(s.cashback),
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-base font-semibold text-foreground">Receita líquida acumulada</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Curvas que se separam cedo indicam efeito consistente, não ruído de um dia.
        </p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                width={44}
              />
              <Tooltip
                formatter={(v: number) => brl(v)}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {result.variants.map((v, i) => (
                <Line
                  key={v}
                  type="monotone"
                  dataKey={v}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-base font-semibold text-foreground">Cashback pago vs líquido gerado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Quanto de margem sobra depois do incentivo, por variante.
        </p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="group" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                width={44}
              />
              <Tooltip
                formatter={(v: number) => brl(v)}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="cashback" name="Cashback pago" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="líquido" name="Receita líquida" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
