import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Square, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transcribeAudioFn } from "@/lib/ai.functions";

const ACCEPT = "audio/*,.m4a,.mp3,.wav,.webm,.ogg";

async function fileToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Gravação de voz ou anexo de áudio com transcrição automática via Gemini.
 * O texto transcrito é entregue via onTranscript para o campo de comando da IA.
 */
export function AudioNote({
  onTranscript,
  hint,
}: {
  onTranscript: (text: string) => void;
  hint?: string;
}) {
  const transcribe = useServerFn(transcribeAudioFn);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processBlob(blob: Blob, mime: string) {
    setBusy(true);
    setError(null);
    try {
      const dataBase64 = await fileToBase64(blob);
      const { text } = await transcribe({ data: { mime, dataBase64 } });
      if (text) onTranscript(text);
      else setError("Não foi possível entender o áudio.");
    } catch (e: any) {
      setError(e.message ?? "Erro ao transcrever áudio.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecording() {
    setError(null);
    if (recording) {
      recRef.current?.stop();
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Gravação de áudio não suportada neste navegador.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: mime });
        void processBlob(blob, mime);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Permissão de microfone negada.");
    }
  }

  async function pickFile(file: File | undefined) {
    if (!file) return;
    await processBlob(file, file.type || "audio/mpeg");
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={recording ? "destructive" : "outline"}
          onClick={toggleRecording}
          disabled={busy}
        >
          {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {recording ? "Parar gravação" : "Gravar áudio"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => void pickFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Paperclip className="h-3.5 w-3.5" />
          Anexar áudio
        </Button>
        {busy && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Transcrevendo…
          </span>
        )}
      </div>
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
