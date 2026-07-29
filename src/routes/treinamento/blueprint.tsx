import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/treinamento/blueprint")({
  head: () => ({ meta: [{ title: "Blueprint de Processo — Kienbaum Hub de Mkt & Vendas" }] }),
  component: BlueprintPage,
});

const PHASES = [
  { title: "Prospecção & Geração", goal: "Identificar empresas-alvo e gerar contato qualificado.", tasks: ["Lista ICP atualizada", "Mapa de stakeholders", "Pretexto de abordagem relevante"], output: "Reunião agendada com decisor." },
  { title: "Discovery Inicial", goal: "Entender contexto, dor e janela. GPCT + SPIN.", tasks: ["Diagnóstico de dor", "Mapeamento de decisores", "Linha do tempo de decisão"], output: "Briefing estruturado da oportunidade." },
  { title: "Qualificação (SPIN Selling + Go/No-Go)", goal: "Decidir se vale investir tempo e estruturar proposta.", tasks: ["SPIN scorado (Situação · Problema · Implicação · Necessidade)", "Go/No-Go formal", "Definição de sponsor"], output: "Decisão Go com critérios mitigados." },
  { title: "Construção de Solução", goal: "Co-criar a abordagem com o cliente e o time técnico.", tasks: ["Workshop de escopo", "Validação de stakeholders", "Alinhamento técnico interno"], output: "Escopo validado e diferenciais documentados." },
  { title: "Proposta & Pricing", goal: "Apresentar proposta boutique, ancorada em valor.", tasks: ["Proposta personalizada", "Pricing por valor", "Apresentação executiva"], output: "Proposta enviada com data de decisão." },
  { title: "Negociação & Fechamento", goal: "Endereçar objeções, blindar valor, formalizar contrato.", tasks: ["Tratamento de objeções", "Ajustes contratuais", "Assinatura formal"], output: "Contrato assinado. Kick-off agendado." },
  { title: "Execução & Acompanhamento", goal: "Garantir entrega de excelência e presença executiva.", tasks: ["Kick-off com sponsor", "Status executivos recorrentes", "Antecipação de riscos"], output: "Entrega no padrão Kienbaum." },
  { title: "Encerramento, NPS & Expansão", goal: "Encerrar com aprendizado, medir NPS, abrir próximo ciclo.", tasks: ["Reunião de encerramento", "Coleta de NPS/CSAT", "Plano de expansão"], output: "Cliente promotor + pipeline de continuidade." },
];

const TOTAL_TASKS = PHASES.reduce((n, p) => n + p.tasks.length, 0);

function BlueprintPage() {
  const { user } = useAuth();
  const [oportunidade, setOportunidade] = useState("default");
  const storageKey = useMemo(
    () => `kienbaum:blueprint:${user?.id ?? "anon"}:${oportunidade.trim() || "default"}`,
    [user?.id, oportunidade],
  );
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setChecks(raw ? JSON.parse(raw) : {});
    } catch { setChecks({}); }
  }, [storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(checks)); } catch { /* noop */ }
  }, [checks, storageKey]);

  const completed = Object.values(checks).filter(Boolean).length;
  const pct = TOTAL_TASKS === 0 ? 0 : Math.round((completed / TOTAL_TASKS) * 100);
  const toggle = (id: string) => setChecks((c) => ({ ...c, [id]: !c[id] }));

  return (
    <PageContainer>
      <PageHeader module="Treinamento · 1.4" title="Blueprint de Processo — 8 Fases" description="Roteiro consultivo end-to-end. Marque as tarefas concluídas por oportunidade — o progresso fica salvo no seu navegador." />
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-end md:gap-6">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Oportunidade / cliente</Label>
            <Input value={oportunidade} onChange={(e) => setOportunidade(e.target.value)} placeholder="Ex.: Grupo Alfa — Executive Search CFO" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Progresso da oportunidade</p>
            <Progress value={pct} className="mt-2 h-2" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{completed}/{TOTAL_TASKS}</p>
            <p className="text-xs text-muted-foreground">{pct}%</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setChecks({})}>Zerar</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {PHASES.map((p, i) => {
          const phaseChecks = p.tasks.map((_, j) => !!checks[`${i}:${j}`]);
          const phaseDone = phaseChecks.every(Boolean);
          const someDone = phaseChecks.some(Boolean);
          return (
            <Card key={p.title} className={cn(phaseDone && "border-primary/40")}>
              <CardHeader className="flex flex-row items-start gap-4 pb-3">
                <div className={cn("mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  phaseDone ? "border-primary bg-primary text-primary-foreground"
                    : someDone ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground")}>
                  {phaseDone ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <CardDescription className="mt-1">{p.goal}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 pl-[60px] md:grid-cols-[1fr_280px]">
                <ul className="space-y-1.5 text-sm">
                  {p.tasks.map((a, j) => {
                    const id = `${i}:${j}`;
                    const checked = !!checks[id];
                    return (
                      <li key={a}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                            checked={checked}
                            onChange={() => toggle(id)}
                          />
                          <span className={cn("flex-1", checked ? "text-muted-foreground line-through" : "text-foreground")}>{a}</span>
                          {!checked && <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />}
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Output esperado</p>
                  <p className="mt-1 text-sm text-foreground">{p.output}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}