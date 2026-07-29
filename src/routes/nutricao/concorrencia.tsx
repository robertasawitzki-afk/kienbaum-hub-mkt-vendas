import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { SaveOutputButton } from "@/components/save-output-button";
import { AudioNote } from "@/components/audio-note";
import { competitionResearch } from "@/lib/ai.functions";

export const Route = createFileRoute("/nutricao/concorrencia")({
  head: () => ({ meta: [{ title: "Pesquisa de Concorrência — Kienbaum Hub de Mkt & Vendas" }] }),
  component: ConcorrenciaPage,
});

const SUGESTOES = ["Korn Ferry", "Spencer Stuart", "Egon Zehnder", "Heidrick & Struggles", "Russell Reynolds", "Fesa", "Flow"];

function firstLine(s: string, max = 60) {
  const line = s.split("\n")[0]?.trim() ?? "";
  return line.length > max ? `${line.slice(0, max)}…` : line || "Concorrente";
}

function ConcorrenciaPage() {
  const fn = useServerFn(competitionResearch);
  const [info, setInfo] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function go(name?: string) {
    const target = name ? `Concorrente: ${name}\nFoco: Executive Search e Liderança` : info;
    if (!target.trim()) return;
    if (name) setInfo(target);
    setLoading(true); setOut(null);
    try {
      const { dossier } = await fn({ data: { info: target } });
      setOut(dossier);
    } catch (e: any) { setOut(`⚠️ ${e.message}`); }
    finally { setLoading(false); }
  }

  const concorrenteLabel = useMemo(() => firstLine(info), [info]);

  return (
    <PageContainer>
      <PageHeader module="Nutrição · 4.1" title="Pesquisa de Concorrência"
        description="Dossiê competitivo: portfólio, posicionamento, pricing percebido e argumentos para vencer a comparação." />
      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Player</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Sobre o concorrente</Label>
              <Textarea
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                rows={5}
                placeholder="Nome do concorrente (ex.: Korn Ferry) e o foco da análise (ex.: Executive Search e Liderança)…"
              />
              <AudioNote
                onTranscript={(t) => setInfo((c) => (c ? `${c}\n${t}` : t))}
                hint="Grave ou anexe um áudio descrevendo o concorrente — a transcrição é adicionada acima."
              />
            </div>
            <Button onClick={() => go()} disabled={loading || !info.trim()} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar dossiê
            </Button>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Sugestões rápidas:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGESTOES.map((s) => (
                  <button key={s} onClick={() => go(s)} disabled={loading}
                    className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted disabled:opacity-50">{s}</button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dossiê</CardTitle>
            {out && (
              <div className="flex gap-2">
                <SaveOutputButton kind="concorrencia" title={concorrenteLabel} content={out} meta={{ info }} />
                <CopyButton text={out} />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!out && !loading && <p className="text-sm text-muted-foreground">Selecione um player ou digite um nome.</p>}
            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Compilando…</div>}
            {out && <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{out}</pre>}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
