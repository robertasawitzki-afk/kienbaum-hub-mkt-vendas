import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { SaveOutputButton } from "@/components/save-output-button";
import { AudioNote } from "@/components/audio-note";
import { OutputsHistory } from "@/components/outputs-history";
import { prepareMeeting, researchClient } from "@/lib/ai.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDrop, type PickedFile } from "@/components/file-drop";

export const Route = createFileRoute("/rotina/reuniao")({
  head: () => ({ meta: [{ title: "Preparação de Reunião — Kienbaum Hub de Mkt & Vendas" }] }),
  component: ReuniaoPage,
});

function firstLine(s: string, max = 60) {
  const line = s.split("\n")[0]?.trim() ?? "";
  return line.length > max ? `${line.slice(0, max)}…` : line || "Empresa";
}

function ReuniaoPage() {
  const briefFn = useServerFn(prepareMeeting);
  const researchFn = useServerFn(researchClient);

  const [tab, setTab] = useState("pesquisa");

  // Etapa 1 — pesquisa do cliente
  const [infoEmpresa, setInfoEmpresa] = useState("");
  const [pesquisa, setPesquisa] = useState<string | null>(null);
  const [loadingR, setLoadingR] = useState(false);

  // Etapa 2 — briefing
  const [infoReuniao, setInfoReuniao] = useState("");
  const [transcricao, setTranscricao] = useState<PickedFile | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingB, setLoadingB] = useState(false);

  const empresaLabel = useMemo(() => firstLine(infoEmpresa), [infoEmpresa]);

  async function runResearch() {
    if (infoEmpresa.trim().length < 3) return;
    setLoadingR(true); setPesquisa(null);
    try {
      const { research } = await researchFn({ data: { info: infoEmpresa } });
      setPesquisa(research);
      setInfoReuniao((c) => c || `Empresa: ${empresaLabel}\n`);
    } catch (e: any) { setPesquisa(`⚠️ ${e.message}`); }
    finally { setLoadingR(false); }
  }

  async function runBrief() {
    if (infoReuniao.trim().length < 3) return;
    setLoadingB(true); setBriefing(null);
    try {
      const { briefing: b } = await briefFn({
        data: { info: infoReuniao, pesquisa: pesquisa ?? "", transcricao: transcricao ?? undefined },
      });
      setBriefing(b);
    } catch (e: any) { setBriefing(`⚠️ ${e.message}`); }
    finally { setLoadingB(false); }
  }

  return (
    <PageContainer>
      <PageHeader
        module="Rotina · 2.2"
        title="Preparação de Reunião com IA"
        description="Duas etapas: pesquise o cliente e depois monte o briefing executivo com contexto, hipóteses de dor e perguntas SPIN."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pesquisa">1 · Pesquisa do cliente</TabsTrigger>
          <TabsTrigger value="briefing">2 · Briefing da reunião</TabsTrigger>
        </TabsList>

        <TabsContent value="pesquisa">
          <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
            <Card>
              <CardHeader><CardTitle className="text-base">Empresa-alvo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Sobre a empresa-alvo</Label>
                  <Textarea
                    value={infoEmpresa}
                    onChange={(e) => setInfoEmpresa(e.target.value)}
                    rows={6}
                    placeholder="Nome da empresa, setor de atuação, site ou LinkedIn, e qualquer contexto que você já tenha sobre ela…"
                  />
                  <AudioNote
                    onTranscript={(t) => setInfoEmpresa((c) => (c ? `${c}\n${t}` : t))}
                    hint="Grave ou anexe um áudio descrevendo a empresa — a transcrição é adicionada acima."
                  />
                </div>
                <Button onClick={runResearch} disabled={loadingR || infoEmpresa.trim().length < 3} className="w-full">
                  {loadingR ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Pesquisar cliente
                </Button>
                {pesquisa && !loadingR && (
                  <Button variant="outline" onClick={() => setTab("briefing")} className="w-full">
                    Ir para o briefing <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card className="min-h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Pesquisa executiva</CardTitle>
                {pesquisa && (
                  <div className="flex gap-2">
                    <SaveOutputButton kind="reuniao" title={`Pesquisa · ${empresaLabel}`} content={pesquisa} meta={{ info: infoEmpresa }} />
                    <CopyButton text={pesquisa} />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!pesquisa && !loadingR && <p className="text-sm text-muted-foreground">Preencha os dados da empresa para gerar a pesquisa.</p>}
                {loadingR && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Pesquisando…</div>}
                {pesquisa && <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{pesquisa}</pre>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="briefing">
          <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
            <Card>
              <CardHeader><CardTitle className="text-base">Inputs do briefing</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Sobre a reunião</Label>
                  <Textarea
                    value={infoReuniao}
                    onChange={(e) => setInfoReuniao(e.target.value)}
                    rows={6}
                    placeholder="Empresa, stakeholder (nome/cargo), objetivo da reunião (ex.: discovery para sucessão), histórico, indicadores, gatilhos…"
                  />
                  <AudioNote
                    onTranscript={(t) => setInfoReuniao((c) => (c ? `${c}\n${t}` : t))}
                    hint="Grave ou anexe um áudio descrevendo a reunião — a transcrição é adicionada acima."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Transcrição da reunião (opcional)</Label>
                  <FileDrop value={transcricao} onChange={setTranscricao} label="Anexar transcrição (PDF, Word, TXT)" />
                </div>
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {pesquisa ? "Pesquisa da etapa 1 será usada como contexto adicional." : "Nenhuma pesquisa da etapa 1 anexada."}
                </div>
                <Button onClick={runBrief} disabled={loadingB || infoReuniao.trim().length < 3} className="w-full">
                  {loadingB ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Gerar briefing
                </Button>
              </CardContent>
            </Card>
            <Card className="min-h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Briefing</CardTitle>
                {briefing && (
                  <div className="flex gap-2">
                    <SaveOutputButton kind="reuniao" title={firstLine(infoReuniao)} content={briefing} meta={{ info: infoReuniao }} />
                    <CopyButton text={briefing} />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!briefing && !loadingB && <p className="text-sm text-muted-foreground">Preencha os campos e gere um briefing consultivo.</p>}
                {loadingB && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Analisando…</div>}
                {briefing && <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{briefing}</pre>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <OutputsHistory kind="reuniao" />
      </div>
    </PageContainer>
  );
}
