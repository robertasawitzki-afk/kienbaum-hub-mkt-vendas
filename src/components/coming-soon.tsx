import { Sparkles } from "lucide-react";

export function ComingSoon({ note }: { note?: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border bg-card/40 p-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        Em desenvolvimento — próxima fase
      </div>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        {note ??
          "Esta funcionalidade chega na próxima fase, com integração de IA via Lovable Gateway (voz, chat e análise)."}
      </p>
    </div>
  );
}