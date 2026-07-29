import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Trash2, Loader2, Plus } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/copy-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { KIENBAUM_PRODUCTS } from "@/lib/activity";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/treinamento/nps-csat")({
  head: () => ({ meta: [{ title: "NPS & CSAT — Kienbaum Hub de Mkt & Vendas" }] }),
  component: NpsCsatPage,
});

type ScoreRow = Database["public"]["Tables"]["relationship_scores"]["Row"];

function NpsCsatPage() {
  return (
    <PageContainer>
      <PageHeader
        module="Treinamento · 1.3"
        title="NPS & CSAT"
        description="Templates de envio, planilha de levantamento manual e dashboard consolidado de relacionamento e satisfação."
      />
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">1 · Templates de e-mail</TabsTrigger>
          <TabsTrigger value="planilha">2 · Planilha manual</TabsTrigger>
          <TabsTrigger value="dashboard">3 · Dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-6"><TemplatesTab /></TabsContent>
        <TabsContent value="planilha" className="mt-6"><PlanilhaTab /></TabsContent>
        <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}

/* ---------- 1. Templates de e-mail (com ou sem link do Tally) ---------- */
function TemplatesTab() {
  const [tallyUrl, setTallyUrl] = useState("");
  const link = tallyUrl.trim() || "[LINK DO FORMULÁRIO]";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Link do formulário Tally (opcional)</CardTitle>
          <CardDescription>Se vocês optarem por levantar NPS/CSAT via Tally, cole aqui o link do formulário — ele é inserido automaticamente nos templates "via Tally" abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={tallyUrl} onChange={(e) => setTallyUrl(e.target.value)} placeholder="https://tally.so/r/xxxxxx" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <EmailTemplate title="Template de e-mail — CSAT" description="Envie após entregas específicas (workshop, mapa de sucessão, painel de assessment)." body={CSAT_EMAIL} />
        <EmailTemplate title="Template de e-mail — CSAT (via Tally)" description="Mesmo gatilho, mas direciona para um formulário Tally em vez da escala embutida." body={csatEmailTally(link)} />
        <EmailTemplate title="Template de e-mail — NPS" description="Copie, personalize [Cliente]/[Projeto] e envie ao término do engajamento." body={NPS_EMAIL} />
        <EmailTemplate title="Template de e-mail — NPS (via Tally)" description="Mesmo gatilho, mas direciona para um formulário Tally em vez da escala embutida." body={npsEmailTally(link)} />
      </div>
    </div>
  );
}

function EmailTemplate({ title, description, body }: { title: string; description: string; body: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <CopyButton text={body} />
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed">{body}</pre>
      </CardContent>
    </Card>
  );
}

/* ---------- 2. Planilha manual ---------- */
function PlanilhaTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [tipo, setTipo] = useState<"csat" | "nps">("csat");
  const [cliente, setCliente] = useState("");
  const [produto, setProduto] = useState<string>(KIENBAUM_PRODUCTS[0]);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [quemAtendeu, setQuemAtendeu] = useState("");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: d } = await supabase
      .from("relationship_scores")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    setRows(d ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    const v = Number(nota);
    const max = tipo === "csat" ? 5 : 10;
    const min = tipo === "csat" ? 1 : 0;
    if (!cliente.trim() || !Number.isFinite(v) || v < min || v > max) {
      setError(`Preencha o cliente e uma nota entre ${min} e ${max}.`);
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from("relationship_scores").insert({
      user_id: user.id, tipo, cliente: cliente.trim(), produto, data, quem_atendeu: quemAtendeu.trim() || null, nota: v, origem: "manual",
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setCliente(""); setQuemAtendeu(""); setNota("");
    void load();
  }

  async function remove(id: string) {
    await supabase.from("relationship_scores").delete().eq("id", id);
    void load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar resposta</CardTitle>
          <CardDescription>Use quando o levantamento não passa pelo Tally — registre cliente, produto, data, quem atendeu e a nota.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-1 space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</Label>
              <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as "csat" | "nps")} className="flex gap-3 pt-1.5">
                <label className="flex items-center gap-1.5 text-sm"><RadioGroupItem value="csat" />CSAT</label>
                <label className="flex items-center gap-1.5 text-sm"><RadioGroupItem value="nps" />NPS</label>
              </RadioGroup>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cliente</Label>
              <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Produto</Label>
              <Select value={produto} onValueChange={setProduto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KIENBAUM_PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1 space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quem atendeu</Label>
              <Input value={quemAtendeu} onChange={(e) => setQuemAtendeu(e.target.value)} placeholder="Client Partner responsável" />
            </div>
            <div className="md:col-span-1 space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nota ({tipo === "csat" ? "1–5" : "0–10"})</Label>
              <Input type="number" min={tipo === "csat" ? 1 : 0} max={tipo === "csat" ? 5 : 10} value={nota} onChange={(e) => setNota(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </Button>
            </div>
            {error && <p className="md:col-span-6 text-xs text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Respostas registradas</CardTitle></CardHeader>
        <CardContent>
          {!rows && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando…</div>}
          {rows && rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma resposta registrada ainda.</p>}
          {rows && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-1.5 pr-2">Tipo</th>
                    <th className="py-1.5 pr-2">Cliente</th>
                    <th className="py-1.5 pr-2">Produto</th>
                    <th className="py-1.5 pr-2">Data</th>
                    <th className="py-1.5 pr-2">Quem atendeu</th>
                    <th className="py-1.5 pr-2">Nota</th>
                    <th className="py-1.5 pr-2">Origem</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 last:border-0">
                      <td className="py-1.5 pr-2"><Badge variant="secondary">{r.tipo.toUpperCase()}</Badge></td>
                      <td className="py-1.5 pr-2">{r.cliente}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{r.produto ?? "—"}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{r.quem_atendeu ?? "—"}</td>
                      <td className="py-1.5 pr-2 font-mono">{r.nota}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{r.origem}</td>
                      <td className="py-1.5 text-right">
                        {r.user_id === user?.id && (
                          <Button size="icon" variant="ghost" onClick={() => void remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- 3. Dashboard ---------- */
function DashboardTab() {
  const [rows, setRows] = useState<ScoreRow[] | null>(null);

  useEffect(() => {
    void supabase
      .from("relationship_scores")
      .select("*")
      .then(({ data }) => setRows(data ?? []));
  }, []);

  const csat = useMemo(() => computeCsat((rows ?? []).filter((r) => r.tipo === "csat").map((r) => r.nota)), [rows]);
  const nps = useMemo(() => computeNps((rows ?? []).filter((r) => r.tipo === "nps").map((r) => r.nota)), [rows]);

  if (!rows) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando…</div>;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">Consolidado a partir das respostas registradas na planilha manual (e, futuramente, das recebidas via Tally).</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CSAT — Customer Satisfaction</CardTitle>
            <CardDescription>Escala 1-5. % de respostas 4 e 5 sobre o total.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Satisfeitos (4-5)" value={csat.satisfied} tone="text-emerald-400" />
              <Metric label="Total respostas" value={csat.total} tone="text-muted-foreground" />
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">CSAT</p>
              <p className="mt-1 text-4xl font-bold text-foreground">{csat.total === 0 ? "—" : `${csat.csat}%`}</p>
              {csat.total > 0 && <p className="mt-1 text-xs text-muted-foreground">Média {csat.avg.toFixed(2)} / 5</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NPS — Net Promoter Score</CardTitle>
            <CardDescription>Escala 0-10. Promotores (9-10) menos Detratores (0-6).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Promotores" value={nps.promoters} tone="text-emerald-400" />
              <Metric label="Neutros" value={nps.passives} tone="text-muted-foreground" />
              <Metric label="Detratores" value={nps.detractors} tone="text-primary" />
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">NPS</p>
              <p className="mt-1 text-4xl font-bold text-foreground">{nps.total === 0 ? "—" : nps.nps}</p>
              {nps.total > 0 && <Badge className={`${zoneTone(nps.zone)} mt-2`}>{nps.zone}</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function computeNps(scores: number[]) {
  if (scores.length === 0) return { promoters: 0, passives: 0, detractors: 0, nps: 0, zone: "—", total: 0 };
  let p = 0, n = 0, d = 0;
  for (const s of scores) {
    if (s >= 9) p++;
    else if (s >= 7) n++;
    else d++;
  }
  const nps = Math.round(((p - d) / scores.length) * 100);
  const zone =
    nps >= 75 ? "Excelente" :
    nps >= 50 ? "Muito bom" :
    nps >= 0 ? "Atenção" : "Crítico";
  return { promoters: p, passives: n, detractors: d, nps, zone, total: scores.length };
}

function computeCsat(scores: number[]) {
  if (scores.length === 0) return { satisfied: 0, csat: 0, avg: 0, total: 0 };
  const sat = scores.filter((s) => s >= 4).length;
  const avg = scores.reduce((a, s) => a + s, 0) / scores.length;
  return { satisfied: sat, csat: Math.round((sat / scores.length) * 100), avg, total: scores.length };
}

function zoneTone(z: string) {
  if (z === "Excelente" || z === "Muito bom") return "bg-primary/20 text-primary";
  if (z === "Atenção") return "bg-muted text-muted-foreground";
  return "bg-primary text-primary-foreground";
}

const NPS_EMAIL = `Assunto: [Cliente] — sua avaliação sobre nossa parceria (2 minutos)

Olá [Nome],

Concluímos [Projeto/Engajamento] e sua opinião é fundamental para continuarmos evoluindo a parceria com [Cliente].

Em uma escala de 0 a 10, o quanto você recomendaria a Kienbaum Porto Alegre para um colega executivo?

0 — 1 — 2 — 3 — 4 — 5 — 6 — 7 — 8 — 9 — 10

Se puder complementar em uma linha:
• O que mais gerou valor?
• O que poderíamos ter feito melhor?

Basta responder este e-mail — leio pessoalmente cada resposta.

Obrigado,
[Seu nome]
Client Partner · Kienbaum Porto Alegre`;

const CSAT_EMAIL = `Assunto: [Cliente] — como avalia a entrega de [Projeto]?

Olá [Nome],

Concluímos [entrega específica: workshop, mapa de sucessão, painel de assessment…] esta semana. Gostaria de saber sua percepção sobre esta etapa.

Em uma escala de 1 a 5, o quanto você está satisfeito com esta entrega?

1 (Muito insatisfeito) — 2 — 3 — 4 — 5 (Muito satisfeito)

Comentário curto (opcional):
• Ponto alto da entrega:
• O que ajustaríamos para uma próxima:

Sua resposta orienta diretamente os próximos passos do projeto.

Obrigado,
[Seu nome]
Client Partner · Kienbaum Porto Alegre`;

const npsEmailTally = (link: string) => `Assunto: [Cliente] — sua avaliação sobre nossa parceria (2 minutos)

Olá [Nome],

Concluímos [Projeto/Engajamento] e sua opinião é fundamental para continuarmos evoluindo a parceria com [Cliente].

Preencha esta avaliação rápida (leva 2 minutos):
${link}

Obrigado,
[Seu nome]
Client Partner · Kienbaum Porto Alegre`;

const csatEmailTally = (link: string) => `Assunto: [Cliente] — como avalia a entrega de [Projeto]?

Olá [Nome],

Concluímos [entrega específica: workshop, mapa de sucessão, painel de assessment…] esta semana. Gostaria de saber sua percepção sobre esta etapa.

Preencha esta avaliação rápida (leva 1 minuto):
${link}

Sua resposta orienta diretamente os próximos passos do projeto.

Obrigado,
[Seu nome]
Client Partner · Kienbaum Porto Alegre`;
