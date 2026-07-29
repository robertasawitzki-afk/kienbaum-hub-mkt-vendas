import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PickedFile = { filename: string; mime: string; dataBase64: string; sizeBytes: number };

const MAX_MB = 15;
const ACCEPT = ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.html,.htm";

export function FileDrop({
  value,
  onChange,
  label = "Anexar arquivo (PDF, PPT, Word, Excel, imagem)",
}: {
  value: PickedFile | null;
  onChange: (f: PickedFile | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    setErr(null);
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`Arquivo maior que ${MAX_MB}MB.`);
      return;
    }
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    onChange({
      filename: file.name,
      mime: file.type || "application/octet-stream",
      dataBase64: b64,
      sizeBytes: file.size,
    });
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {!value ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full justify-start"
        >
          <Paperclip className="h-4 w-4" />
          {label}
        </Button>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="truncate">
            <Paperclip className="mr-2 inline h-3.5 w-3.5" />
            {value.filename}{" "}
            <span className="text-xs text-muted-foreground">
              ({(value.sizeBytes / 1024).toFixed(0)} KB)
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
