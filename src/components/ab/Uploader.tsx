import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import parceiroA from "@/data/dataset_01_parceiroA.csv?raw";
import parceiroB from "@/data/dataset_02_parceiroB.csv?raw";
import parceiroC from "@/data/dataset_03_parceiroC.csv?raw";

const SAMPLES = [
  { label: "Parceiro A", file: "dataset_01_parceiroA.csv", text: parceiroA },
  { label: "Parceiro B", file: "dataset_02_parceiroB.csv", text: parceiroB },
  { label: "Parceiro C", file: "dataset_03_parceiroC.csv", text: parceiroC },
];

export function Uploader({
  onData,
  busy,
}: {
  onData: (fileName: string, text: string) => void;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const read = async (file: File) => {
    const text = await file.text();
    onData(file.name, text);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="text-lg font-semibold text-foreground">1. Escolha o dataset do teste</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Qualquer CSV com as colunas Data, Grupos de usuários, Parceiro, compradores, comissão,
        cashback e vendas totais. Não precisa mexer em nada além do arquivo.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void read(file);
        }}
        className={`mt-5 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
      >
        {busy ? (
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        ) : (
          <FileUp className="size-8 text-primary" aria-hidden />
        )}
        <p className="text-sm text-muted-foreground">
          Arraste o CSV aqui ou selecione do seu computador
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void read(file);
          }}
        />
        <Button variant="default" onClick={() => inputRef.current?.click()} disabled={busy}>
          Selecionar arquivo
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Datasets de exemplo:</span>
        {SAMPLES.map((s) => (
          <Button
            key={s.file}
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onData(s.file, s.text)}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
