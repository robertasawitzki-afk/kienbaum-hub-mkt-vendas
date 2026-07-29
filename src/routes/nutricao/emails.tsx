import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { SaveOutputButton } from "@/components/save-output-button";
import { AudioNote } from "@/components/audio-note";
import { nurtureEmail } from "@/lib/ai.functions";
import { FileDrop, type PickedFile } from "@/components/file-drop";

export const Route = createFileRoute("/nutricao/emails")({
  head: () => ({ meta: [{ title: "E-mails de Nutrição — Kienbaum Hub de Mkt & Vendas" }] }),
  component: EmailsPage,
});

const ESTAGIOS = [
  { key: "primeiro_contato", label: "Primeiro contato" },
  { key: "pos_reuniao", label: "Pós-reunião" },
  { key: "reengajamento", label: "Reengajamento" },
  { key: "envio_proposta", label: "Envio de proposta" },
  { key: "fechamento", label: "Fechamento" },
] as const;

function firstLine(s: string, max = 60) {
  const line = s.split("\n")[0]?.trim() ?? "";
  return line.length > max ? `${line.slice(0, max)}…` : line || "Cliente";
}

function EmailsPage() {
  const fn = useServerFn(nurtureEmail);
  const [estagio, setEstagio] = useState<typeof ESTAGIOS[number]["key"]>("primeiro_contato");
  const [info, setInfo] = useState("");
  const [artigo, setArtigo] = useState<PickedFile | null>(null);
  const [artigoUrl, setArtigoUrl] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function go() {
    if (info.trim().length < 3) return;
    setLoading(true); setOut(null);
    try {
      const { email } = await fn({
        data: { estagio, info, artigoUrl, artigo: artigo ?? undefined },
      });
      setOut(email);
    } catch (e: any) { setOut(`⚠️ ${e.message}`); }
    finally { setLoading(false); }
  }

  const label = useMemo(() => firstLine(info), [info]);

  return (
    <PageContainer>
      <PageHeader module="Nutrição · 4.2" title="E-mails de Nutrição com IA"
        description="E-mails consultivos por estágio do funil, no tom boutique Kienbaum. Anexe um artigo do MIT, Harvard, INSEAD ou instituto de renome para embasar o argumento." />
      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Parâmetros</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Estágio</Label>
              <Select value={estagio} onValueChange={(v) => setEstagio(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTAGIOS.map((e) => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Destinatário, empresa e contexto</Label>
              <Textarea
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                rows={5}
                placeholder="Ex.: Marina Costa, CFO do Grupo Randon. Pontos discutidos, gatilho, próximos passos…"
              />
              <AudioNote
                onTranscript={(t) => setInfo((c) => (c ? `${c}\n${t}` : t))}
                hint="Grave ou anexe um áudio descrevendo destinatário, empresa e contexto — a transcrição é adicionada acima."
              />
            </div>

            <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Referência</p>
              <FileDrop value={artigo} onChange={setArtigo} label="Anexar artigo (MIT, Harvard, INSEAD, BCG, McKinsey…)" />
              <div className="space-y-1"><Label className="text-xs">Ou URL — pode ser um artigo, um produto da Kienbaum/Peerz ou uma notícia</Label>
                <Input value={artigoUrl} onChange={(e) => setArtigoUrl(e.target.value)} placeholder="https://hbr.org/… ou link do produto/notícia" />
              </div>
              <p className="text-[10px] text-muted-foreground">A IA embasa o e-mail em dados/frameworks da fonte e cita como leitura recomendada.</p>
            </div>

            <Button onClick={go} disabled={loading || info.trim().length < 3} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar e-mail
            </Button>
          </CardContent>
        </Card>
        <Card className="min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">E-mail</CardTitle>
            {out && (
              <div className="flex gap-2">
                <SaveOutputButton kind="email" title={`${estagio} · ${label}`} content={out} meta={{ estagio, info }} />
                <CopyButton text={out} />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!out && !loading && <p className="text-sm text-muted-foreground">Preencha o briefing para gerar o e-mail.</p>}
            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Redigindo…</div>}
            {out && <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{out}</pre>}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
