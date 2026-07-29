import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Send, Download, Pencil, Eye, FolderOpen } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { SaveOutputButton } from "@/components/save-output-button";
import { AudioNote } from "@/components/audio-note";
import { OutputsHistory } from "@/components/outputs-history";
import { analyzeDeck, generateDeckHtml } from "@/lib/ai.functions";
import { FileDrop, type PickedFile } from "@/components/file-drop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/materiais/deck")({
  head: () => ({ meta: [{ title: "Avaliação de Deck — Kienbaum Hub de Mkt & Vendas" }] }),
  component: DeckPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };
type OutputRow = Database["public"]["Tables"]["ai_outputs"]["Row"];

function DeckPage() {
  const { user } = useAuth();
  const analyzeFn = useServerFn(analyzeDeck);
  const htmlFn = useServerFn(generateDeckHtml);

  const [cliente, setCliente] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [analise, setAnalise] = useState<string | null>(null);
  const [loadingA, setLoadingA] = useState(false);

  const [html, setHtml] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [loadingH, setLoadingH] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const [materiais, setMateriais] = useState<OutputRow[] | null>(null);

  const canRun = !!file || !!linkUrl.trim() || conteudo.trim().length >= 20;

  async function loadMateriais() {
    if (!user) return;
    const { data } = await supabase
      .from("ai_outputs")
      .select("*")
      .eq("kind", "deck")
      .order("created_at", { ascending: false })
      .limit(20);
    setMateriais((data ?? []).filter((r) => (r.meta as any)?.isHtmlMaterial));
  }

  useEffect(() => { void loadMateriais(); }, [user]);

  async function runAnalise() {
    if (!canRun) return;
    setLoadingA(true); setAnalise(null);
    try {
      const { analysis } = await analyzeFn({ data: { cliente, conteudo, linkUrl, file: file ?? undefined } });
      setAnalise(analysis);
    } catch (e: any) { setAnalise(`⚠️ ${e.message}`); }
    finally { setLoadingA(false); }
  }

  async function runHtml(initial: boolean) {
    setLoadingH(true);
    try {
      const { html: h, comentario } = await htmlFn({
        data: {
          cliente,
          conteudo,
          analise: analise ?? "",
          htmlAtual: initial ? "" : html,
          linkUrl,
          mensagens: initial ? [] : messages,
          file: initial ? file ?? undefined : undefined,
        },
      });
      if (h) setHtml(h);
      if (!initial && comentario) {
        setMessages((m) => [...m, { role: "assistant", content: comentario }]);
      } else if (initial && comentario) {
        setMessages([{ role: "assistant", content: comentario || "Primeira versão gerada." }]);
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${e.message}` }]);
    } finally {
      setLoadingH(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || loadingH) return;
    const next: ChatMsg = { role: "user", content: chatInput.trim() };
    setMessages((m) => [...m, next]);
    setChatInput("");
    setTimeout(() => { void runHtml(false); }, 0);
  }

  async function saveMaterial() {
    if (!user || !html) return;
    await supabase.from("ai_outputs").insert({
      user_id: user.id,
      kind: "deck",
      title: cliente || "Material sem título",
      content: html,
      meta: { isHtmlMaterial: true, cliente } as never,
    });
    void loadMateriais();
  }

  function loadMaterial(row: OutputRow) {
    setHtml(row.content);
    setCliente(row.title);
    setEditMode(false);
  }

  const downloadUrl = useMemo(() => {
    if (!html) return null;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [html]);

  return (
    <PageContainer>
      <PageHeader module="Repositório · 3.2" title="Avaliação & Preparação de Deck com IA"
        description="A IA avalia o deck em texto e gera uma proposta em HTML pronta para envio. Use o chat para refinar." />

      <div className="grid gap-6 lg:grid-cols-[440px,1fr]">
        {/* Coluna esquerda — inputs + análise */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Conteúdo do deck</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5"><Label>Cliente / contexto</Label><Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex.: Proposta CHRO Grupo X" /></div>
              <FileDrop value={file} onChange={setFile} label="Anexar deck (PDF, PPT, Word, HTML)" />
              <div className="space-y-1.5"><Label>Ou link público (Google Drive, etc.)</Label>
                <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://drive.google.com/…" />
              </div>
              <div className="space-y-1.5"><Label>Ou cole o outline / texto integral</Label>
                <Textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={8} placeholder="Cole o conteúdo dos slides (título + bullets de cada slide)…" />
                <AudioNote
                  onTranscript={(t) => setConteudo((c) => (c ? `${c}\n${t}` : t))}
                  hint="Grave ou anexe um áudio descrevendo o deck — a transcrição é adicionada acima."
                />
              </div>
              <div className="grid gap-2">
                <Button onClick={runAnalise} disabled={loadingA || !canRun} className="w-full" variant="outline">
                  {loadingA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Analisar deck (texto)
                </Button>
                <Button onClick={() => void runHtml(true)} disabled={loadingH || !canRun} className="w-full">
                  {loadingH ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Gerar material HTML para cliente
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[280px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Análise crítica</CardTitle>
              {analise && (
                <div className="flex gap-2">
                  <SaveOutputButton kind="deck" title={cliente || "Deck sem título"} content={analise} meta={{ cliente }} />
                  <CopyButton text={analise} />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!analise && !loadingA && <p className="text-sm text-muted-foreground">A análise aparecerá aqui.</p>}
              {loadingA && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Avaliando…</div>}
              {analise && <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{analise}</pre>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" />Materiais gerados</CardTitle></CardHeader>
            <CardContent>
              {(!materiais || materiais.length === 0) && <p className="text-sm text-muted-foreground">Nenhum material HTML salvo ainda.</p>}
              {materiais && materiais.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {materiais.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-foreground">{m.title}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => loadMaterial(m)}>Carregar</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita — preview HTML + chat */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Material HTML para o cliente</CardTitle>
              {html && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditMode((v) => !v)}>
                    {editMode ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    {editMode ? "Ver preview" : "Editar HTML"}
                  </Button>
                  {downloadUrl && (
                    <a href={downloadUrl} download={`kienbaum-${(cliente || "proposta").replace(/\s+/g, "-").toLowerCase()}.html`}>
                      <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5" />Baixar HTML</Button>
                    </a>
                  )}
                  <CopyButton text={html} />
                  <Button size="sm" onClick={saveMaterial} disabled={!user}>Salvar material</Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!html && !loadingH && <p className="text-sm text-muted-foreground">Clique em "Gerar material HTML" para produzir uma versão pronta para envio ao cliente.</p>}
              {loadingH && !html && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Gerando…</div>}
              {html && editMode && (
                <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={22} className="font-mono text-xs" />
              )}
              {html && !editMode && (
                <iframe
                  title="Preview do material"
                  srcDoc={html}
                  sandbox=""
                  className="h-[520px] w-full rounded-md border border-border bg-white"
                />
              )}
            </CardContent>
          </Card>

          {html && (
            <Card>
              <CardHeader><CardTitle className="text-base">Refinar com a IA</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-[220px] space-y-2 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
                  {messages.length === 0 && <p className="text-xs text-muted-foreground">Descreva ajustes desejados: "reduza a seção 2", "adicione bloco de cases regionais", "troque o CTA por reunião de 30 min"…</p>}
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                      <strong className="mr-1">{m.role === "user" ? "Você:" : "IA:"}</strong>
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    </div>
                  ))}
                  {loadingH && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Reescrevendo o material…</div>}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => { e.preventDefault(); void sendChat(); }}
                >
                  <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Peça um ajuste específico…" disabled={loadingH} />
                  <Button type="submit" disabled={loadingH || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6">
        <OutputsHistory kind="deck" title="Histórico deste espaço (análises e materiais)" />
      </div>
    </PageContainer>
  );
}
