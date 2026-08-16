import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, ExternalLink, Loader2, Sheet, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTrackingSheetFn,
  registerTestFn,
} from "@/lib/tracking.functions";
import { TRACKING_HEADER, trackingRow, type AnalysisResult } from "@/lib/ab/analysis";
import { downloadText, renderMarkdown, toCsv } from "@/lib/ab/markdown";

const STORAGE_KEY = "meliuz_tracking_spreadsheet_id";

export function SheetsPanel({ result }: { result: AnalysisResult }) {
  const createSheet = useServerFn(createTrackingSheetFn);
  const registerTest = useServerFn(registerTestFn);
  const [spreadsheetId, setSpreadsheetId] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || "",
  );
  const [sheetLink, setSheetLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [registering, setRegistering] = useState(false);

  const persist = (id: string) => {
    setSpreadsheetId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const extractId = (value: string) => {
    const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1]! : value.trim();
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createSheet({
        data: { title: "Méliuz — Registro de testes A/B de cashback" },
      });
      persist(res.spreadsheetId);
      setSheetLink(res.url);
      toast.success("Planilha criada", { description: "Cabeçalho já configurado." });
    } catch (e) {
      toast.error("Não foi possível criar a planilha", { description: (e as Error).message });
    } finally {
      setCreating(false);
    }
  };

  const handleRegister = async () => {
    const id = extractId(spreadsheetId);
    if (!id) {
      toast.error("Informe o ID ou o link da planilha.");
      return;
    }
    setRegistering(true);
    try {
      const res = await registerTest({ data: { spreadsheetId: id, row: trackingRow(result) } });
      persist(id);
      setSheetLink(res.url);
      toast.success(res.updated ? "Linha do teste atualizada" : "Teste registrado na planilha", {
        description: `Linha ${res.rowNumber}`,
      });
    } catch (e) {
      toast.error("Falha ao escrever na planilha", { description: (e as Error).message });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Sheet className="size-4 text-primary" aria-hidden />
        Registro do teste
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Grava uma linha por teste na planilha de acompanhamento (Google Sheets) — ou exporta no mesmo
        formato.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="sheet-id" className="text-xs uppercase tracking-wide text-muted-foreground">
            ID ou link da planilha
          </Label>
          <Input
            id="sheet-id"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="mt-1.5"
          />
        </div>
        <Button onClick={handleRegister} disabled={registering}>
          {registering ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Registrar no Sheets
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCreate} disabled={creating}>
          {creating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Criar planilha nova
        </Button>
        {sheetLink ? (
          <Button variant="ghost" size="sm" asChild>
            <a href={sheetLink} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              Abrir planilha
            </a>
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadText(
              "tracking_testes.csv",
              toCsv([TRACKING_HEADER, trackingRow(result)]),
              "text/csv",
            )
          }
        >
          <Table2 className="size-4" aria-hidden />
          Baixar CSV do registro
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadText(`relatorio-${result.partner.toLowerCase().replace(/\s+/g, "-")}.md`, renderMarkdown(result), "text/markdown")
          }
        >
          <Download className="size-4" aria-hidden />
          Baixar relatório (.md)
        </Button>
      </div>
    </div>
  );
}
