import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AudioNote } from "@/components/audio-note";
import { CopyButton } from "@/components/copy-button";
import { qualifyGpct, evaluateMeeting } from "@/lib/ai.functions";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/treinamento/tecnicas")({
  head: () => ({ meta: [{ title: "Técnicas de Negociação — Kienbaum Hub de Mkt & Vendas" }] }),
  component: TecnicasPage,
});

const QUANDO_USAR = [
  { k: "SPIN", quando: "Consultoria boutique/premium com mais tempo de conversa. Use quando há espaço para investigar a fundo situação, problema e implicação antes de propor — ideal em reuniões de 45-60min com stakeholder aberto a discovery." },
  { k: "GPCT", quando: "Discovery amplo no início do relacionamento, para entender metas e planos do cliente antes de qualquer proposta. Use logo nas primeiras conversas, mesmo com pouca informação prévia." },
  { k: "BANT", quando: "Qualificação rápida de oportunidade — orçamento, decisor, dor e prazo. Use quando o tempo é curto ou para decidir rapidamente se vale investir mais tempo no lead." },
];

function TecnicasPage() {
  return (
    <PageContainer>
      <PageHeader
        module="Treinamento · 1.2"
        title="Técnicas de Negociação Consultiva"
        description="Quatro frameworks essenciais para qualificar oportunidades, vender pelo valor e decidir com clareza."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Quando usar cada técnica</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {QUANDO_USAR.map((q) => (
            <div key={q.k} className="rounded-md border border-border bg-muted/30 p-3">
              <p className="mb-1 text-xs font-mono font-bold text-primary">{q.k}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{q.quando}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="spin" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spin">SPIN</TabsTrigger>
          <TabsTrigger value="gpct">GPCT</TabsTrigger>
          <TabsTrigger value="bant">BANT</TabsTrigger>
        </TabsList>

        <TabsContent value="spin" className="mt-6">
          <Spin />
        </TabsContent>
        <TabsContent value="gpct" className="mt-6">
          <Gpct />
        </TabsContent>
        <TabsContent value="bant" className="mt-6">
          <Bant />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

/* ---------- Go/No-Go — critérios embutidos em cada técnica ---------- */
const CRITERIA = [
  { k: "fit",       label: "Fit estratégico com portfólio Kienbaum", w: 3 },
  { k: "decisor",   label: "Acesso ao decisor real",                  w: 3 },
  { k: "valor",     label: "Cliente percebe valor (não só preço)",     w: 2 },
  { k: "prazo",     label: "Prazo realista para entrega",              w: 2 },
  { k: "etica",     label: "Sem off-limits / conflito de interesse",   w: 3 },
  { k: "ticket",    label: "Ticket compatível (boutique premium)",     w: 2 },
  { k: "relacao",   label: "Potencial de relacionamento de LP",        w: 2 },
];

function useGoNoGo() {
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const score = useMemo(() => CRITERIA.reduce((acc, c) => acc + (marks[c.k] ? c.w : 0), 0), [marks]);
  const max = CRITERIA.reduce((a, c) => a + c.w, 0);
  const pct = Math.round((score / max) * 100);
  const decision =
    pct >= 75 ? { label: "GO — Avançar com proposta", tone: "bg-primary text-primary-foreground" } :
    pct >= 50 ? { label: "GO condicional — Mitigar gaps", tone: "bg-primary/20 text-primary" } :
    { label: "NO-GO — Nutrir ou recusar", tone: "bg-muted text-muted-foreground" };
  return { marks, setMarks, score, max, pct, decision };
}

function GoNoGoPanel({ gng }: { gng: ReturnType<typeof useGoNoGo> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Go / No-Go</CardTitle>
        <CardDescription>Marque os critérios atendidos. A pontuação é ponderada pela criticidade e entra na avaliação da reunião.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {CRITERIA.map((c) => (
          <label key={c.k} className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-muted/40 p-3 hover:bg-accent">
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-primary)]"
                checked={!!gng.marks[c.k]}
                onChange={(e) => gng.setMarks({ ...gng.marks, [c.k]: e.target.checked })}
              />
              <span className="text-sm text-foreground">{c.label}</span>
            </span>
            <span className="text-xs text-muted-foreground">peso {c.w}</span>
          </label>
        ))}
        <div className="mt-2 flex items-center justify-between rounded-md border border-border bg-card p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pontuação</p>
            <p className="text-2xl font-bold text-foreground">{gng.score} / {gng.max} <span className="text-sm font-normal text-muted-foreground">({gng.pct}%)</span></p>
          </div>
          <Badge className={gng.decision.tone}>{gng.decision.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Avaliação da reunião (áudio + IA), compartilhada pelas 3 técnicas ---------- */
function EvalPanel({
  framework, cliente, notas, setNotas, gng,
}: {
  framework: "spin" | "gpct" | "bant";
  cliente: string;
  notas: string;
  setNotas: (v: string) => void;
  gng: ReturnType<typeof useGoNoGo>;
}) {
  const { user } = useAuth();
  const runEval = useServerFn(evaluateMeeting);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!cliente.trim()) { toast.error("Informe o cliente / oportunidade"); return; }
    setLoading(true); setAnalysis(null);
    try {
      const criterios = CRITERIA.map((c) => ({ label: c.label, peso: c.w, atendido: !!gng.marks[c.k] }));
      const { analysis: a } = await runEval({
        data: {
          framework,
          cliente,
          data: new Date().toLocaleDateString("pt-BR"),
          notas,
          criterios,
        },
      });
      setAnalysis(a);
    } catch (e: any) {
      setAnalysis(`⚠️ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!user || !analysis) return;
    await logActivity({
      userId: user.id, kind: "save",
      title: `Avaliação de reunião (${framework.toUpperCase()}) — ${cliente}`,
      route: "/treinamento/tecnicas",
      details: { framework, cliente, notas, marks: gng.marks, score: gng.score, max: gng.max, pct: gng.pct, analysis },
    });
    toast.success("Avaliação salva no histórico");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Avaliar reunião</CardTitle>
        <CardDescription>Anexe o áudio da reunião (ou descreva) e gere a avaliação de desempenho do CP e insights sobre o cliente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notas / transcrição da reunião</Label>
          <Textarea rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Cole notas da reunião, ou grave/anexe o áudio abaixo…" />
          <AudioNote onTranscript={(t) => setNotas(notas ? `${notas}\n${t}` : t)} hint="A transcrição do áudio da reunião é adicionada às notas acima." />
        </div>
        <Button onClick={run} disabled={loading || !cliente.trim()} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar avaliação
        </Button>
        {analysis && (
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <div className="mb-2 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={save}>Salvar</Button>
              <CopyButton text={analysis} />
            </div>
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{analysis}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- GPCT ---------- */
function Gpct() {
  const { user } = useAuth();
  const runQualify = useServerFn(qualifyGpct);
  const [v, setV] = useState({ goals: "", plans: "", challenges: "", timeline: "" });
  const [cliente, setCliente] = useState("");
  const [notas, setNotas] = useState("");
  const [verdict, setVerdict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const gng = useGoNoGo();

  const canRun = cliente.trim() && Object.values(v).every((x) => x.trim().length > 3);

  async function run() {
    setLoading(true); setVerdict(null);
    try {
      const { verdict: r } = await runQualify({ data: { cliente, ...v } });
      setVerdict(r);
    } catch (e: any) { setVerdict(`⚠️ ${e.message}`); }
    finally { setLoading(false); }
  }

  async function save() {
    if (!user || !verdict) return;
    await logActivity({
      userId: user.id, kind: "save",
      title: `GPCT — ${cliente}`, route: "/treinamento/tecnicas",
      details: { framework: "gpct", cliente, ...v, verdict },
    });
    toast.success("Qualificação salva no histórico");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>GPCT — Discovery consultiva</CardTitle>
            <CardDescription>
              Goals, Plans, Challenges, Timeline. Use antes de qualquer proposta. Foque em entender,
              não em pitchar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cliente / oportunidade</Label>
              <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex.: Grupo Alfa — sucessão CFO" />
            </div>
            {[
              { k: "goals", label: "Goals", hint: "Quais resultados o cliente precisa atingir?" },
              { k: "plans", label: "Plans", hint: "Como ele pretende chegar lá hoje?" },
              { k: "challenges", label: "Challenges", hint: "O que está bloqueando?" },
              { k: "timeline", label: "Timeline", hint: "Quando precisa estar resolvido?" },
            ].map((f) => (
              <div key={f.k} className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {f.label} <span className="normal-case text-muted-foreground/70">— {f.hint}</span>
                </Label>
                <Textarea
                  rows={2}
                  value={v[f.k as keyof typeof v]}
                  onChange={(e) => setV({ ...v, [f.k]: e.target.value })}
                />
              </div>
            ))}
            <Button onClick={run} disabled={!canRun || loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Avaliar com IA — a Kienbaum resolve?
            </Button>
          </CardContent>
        </Card>
        <GoNoGoPanel gng={gng} />
      </div>
      <div className="space-y-6">
        <Card className="min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Veredicto Kienbaum</CardTitle>
            {verdict && <Button size="sm" variant="outline" onClick={save}>Salvar</Button>}
          </CardHeader>
          <CardContent>
            {!verdict && !loading && (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">G:</strong> Qual é a meta de negócio que torna esse projeto urgente?</p>
                <p><strong className="text-foreground">P:</strong> Quais iniciativas internas já estão em andamento para isso?</p>
                <p><strong className="text-foreground">C:</strong> O que tentaram e não funcionou?</p>
                <p><strong className="text-foreground">T:</strong> Existe um marco que define o "tarde demais"?</p>
              </div>
            )}
            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Avaliando…</div>}
            {verdict && <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{verdict}</pre>}
          </CardContent>
        </Card>
        <EvalPanel framework="gpct" cliente={cliente} notas={notas} setNotas={setNotas} gng={gng} />
      </div>
    </div>
  );
}

/* ---------- BANT ---------- */
const BANT_ITEMS: Array<{ k: "b" | "a" | "n" | "t"; label: string; statement: string }> = [
  { k: "b", label: "Budget",    statement: "O cliente tem orçamento aprovado ou caminho claro para aprovar este investimento." },
  { k: "a", label: "Authority", statement: "Estamos falando diretamente com o decisor final (ou com forte influenciador confirmado)." },
  { k: "n", label: "Need",      statement: "A dor é estratégica, mensurável e urgente para o cliente." },
  { k: "t", label: "Timeline",  statement: "Existe uma janela definida de decisão nos próximos meses." },
];
const LIKERT = [
  { v: 1, label: "Discordo totalmente" },
  { v: 2, label: "Discordo" },
  { v: 3, label: "Neutro" },
  { v: 4, label: "Concordo" },
  { v: 5, label: "Concordo totalmente" },
];

function Bant() {
  const [cliente, setCliente] = useState("");
  const [notas, setNotas] = useState("");
  const [s, setS] = useState<Record<"b" | "a" | "n" | "t", number>>({ b: 3, a: 3, n: 3, t: 3 });
  const gng = useGoNoGo();
  const total = s.b + s.a + s.n + s.t;
  const max = 20;
  const pct = Math.round((total / max) * 100);
  const verdict =
    pct >= 80 ? { label: "Altíssima prioridade", tone: "bg-primary text-primary-foreground" } :
    pct >= 60 ? { label: "Prioridade alta", tone: "bg-primary/20 text-primary" } :
    pct >= 40 ? { label: "Qualificação parcial", tone: "bg-muted text-muted-foreground" } :
    { label: "Desqualificar / Nutrir", tone: "bg-muted text-muted-foreground" };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>BANT — Qualificação por afirmações</CardTitle>
            <CardDescription>Para cada afirmação, marque seu nível de concordância. O score total orienta a priorização.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cliente / oportunidade</Label>
              <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex.: Grupo Alfa — Executive Search CFO" />
            </div>
            {BANT_ITEMS.map((r) => (
              <div key={r.k} className="grid gap-2">
                <Label className="text-sm font-semibold text-foreground">
                  <span className="mr-2 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">{r.label}</span>
                  {r.statement}
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {LIKERT.map((opt) => {
                    const active = s[r.k] === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setS({ ...s, [r.k]: opt.v })}
                        className={`rounded-md border p-2 text-center text-xs transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <span className="block text-base font-bold">{opt.v}</span>
                        <span className="mt-0.5 block leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-md border border-border bg-muted/40 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Score total</p>
                <p className="text-2xl font-bold text-foreground">{total} / {max} <span className="text-sm font-normal text-muted-foreground">({pct}%)</span></p>
              </div>
              <Badge className={verdict.tone}>{verdict.label}</Badge>
            </div>
          </CardContent>
        </Card>
        <GoNoGoPanel gng={gng} />
      </div>
      <EvalPanel framework="bant" cliente={cliente} notas={notas} setNotas={setNotas} gng={gng} />
    </div>
  );
}

/* ---------- SPIN ---------- */
function Spin() {
  const [cliente, setCliente] = useState("");
  const [notas, setNotas] = useState("");
  const gng = useGoNoGo();
  const blocks = [
    {
      k: "S", title: "Situation", color: "text-muted-foreground",
      body: "Entender o contexto: estrutura, números, papéis. Pouco — não vire interrogatório.",
      ex: ["Como está estruturada a liderança hoje?", "Quem responde por essa área?", "Qual o tamanho do time impactado?"],
    },
    {
      k: "P", title: "Problem", color: "text-foreground",
      body: "Identificar dores explícitas e implícitas.",
      ex: ["O que tem te tirado o sono nessa frente?", "Onde sente que perdem mais tempo/dinheiro?", "Já tiveram problema com sucessão de posições críticas?"],
    },
    {
      k: "I", title: "Implication", color: "text-primary",
      body: "Amplificar o custo de não agir. É aqui que se vende valor.",
      ex: ["Se esse cargo ficar vago por 6 meses, qual o impacto?", "Como isso afeta resultado no próximo ciclo?", "Quem mais é impactado quando isso acontece?"],
    },
    {
      k: "N", title: "Need-payoff", color: "text-primary",
      body: "Cliente verbaliza o benefício da solução. Só então propõe.",
      ex: ["Se resolvêssemos isso em 90 dias, o que mudaria?", "Quanto vale ter o sucessor pronto antes da transição?", "Como seria o time se essa liderança fosse high-performance?"],
    },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente / oportunidade</CardTitle>
          <CardDescription>Use este roteiro junto ao Simulador de Vendas para praticar, e aqui para avaliar reuniões reais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex.: Grupo Alfa — sucessão CFO" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((b) => (
          <Card key={b.k}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 font-mono text-base font-bold ${b.color}`}>
                  {b.k}
                </span>
                {b.title}
              </CardTitle>
              <CardDescription>{b.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {b.ex.map((e) => (
                  <li key={e} className="border-l-2 border-primary/30 pl-3 italic">"{e}"</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GoNoGoPanel gng={gng} />
        <EvalPanel framework="spin" cliente={cliente} notas={notas} setNotas={setNotas} gng={gng} />
      </div>
    </div>
  );
}
