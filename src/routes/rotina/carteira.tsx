import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileDrop, type PickedFile } from "@/components/file-drop";
import { AudioNote } from "@/components/audio-note";
import { CopyButton } from "@/components/copy-button";
import { SaveOutputButton } from "@/components/save-output-button";
import { OutputsHistory } from "@/components/outputs-history";
import { analyzeCarteira } from "@/lib/ai.functions";

export const Route = createFileRoute("/rotina/carteira")({
  head: () => ({ meta: [{ title: "Revisão de Carteira — Kienbaum Hub de Mkt & Vendas" }] }),
  component: CarteiraPage,
});

function CarteiraPage() {
  const aiFn = useServerFn(analyzeCarteira);
  const [ctx, setCtx] = useState("");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [aiOut, setAiOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAi() {
    if (!file && ctx.trim().length < 20) return;
    setLoading(true); setAiOut(null);
    try {
      const { analysis: a } = await aiFn({ data: { contexto: ctx, file: file ?? undefined } });
      setAiOut(a);
    } catch (e: any) { setAiOut(`⚠️ ${e.message}`); }
    finally { setLoading(false); }
  }

  return (
    <PageContainer>
      <PageHeader module="Rotina · 2.1" title="Revisão de Carteira (Pareto 80/20)"
        description="Anexe sua carteira e deixe a IA gerar a análise Pareto 80/20, priorização e plano de ação. Os dados de clientes ficam no CRM da Kienbaum/Peerz." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Análise de Carteira com IA (upload de material)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[380px,1fr]">
          <div className="space-y-3">
            <FileDrop value={file} onChange={setFile} label="Anexar carteira (PDF, Excel, PPT)" />
            <div className="space-y-1.5">
              <Label>Contexto para a IA</Label>
              <Textarea value={ctx} onChange={(e) => setCtx(e.target.value)} rows={6}
                placeholder="Descreva a carteira: produtos vendidos, metas, receita por cliente, prazos, riscos de churn ou qualquer instrução específica para a análise…" />
              <AudioNote
                onTranscript={(t) => setCtx((c) => (c ? `${c}\n${t}` : t))}
                hint="Grave ou anexe um áudio descrevendo a carteira — a transcrição é adicionada ao contexto acima."
              />
            </div>
            <Button onClick={runAi} disabled={loading || (!file && ctx.trim().length < 20)} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analisar com IA
            </Button>
          </div>
          <div className="min-h-[240px] rounded-md border border-border bg-muted/20 p-4">
            {!aiOut && !loading && <p className="text-sm text-muted-foreground">A análise aparecerá aqui.</p>}
            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Analisando…</div>}
            {aiOut && (
              <>
                <div className="mb-2 flex justify-end gap-2">
                  <SaveOutputButton kind="carteira" title="Análise de carteira" content={aiOut} meta={{ file: file?.filename }} />
                  <CopyButton text={aiOut} />
                </div>
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{aiOut}</pre>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <OutputsHistory kind="carteira" />
      </div>
    </PageContainer>
  );
}
