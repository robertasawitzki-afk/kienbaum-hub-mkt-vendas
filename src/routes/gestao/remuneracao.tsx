import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/gestao/remuneracao")({
  head: () => ({ meta: [{ title: "Calculadora de Remuneração — Kienbaum Hub de Mkt & Vendas" }] }),
  component: RemuneracaoPage,
});

type Modo = "gestao" | "acompanhamento" | "tecnica";

function RemuneracaoPage() {
  const [valor, setValor] = useState("");
  const [tecnica, setTecnica] = useState("");
  const [modo, setModo] = useState<Modo>("gestao");

  const v = Number(valor.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  const t = Number(tecnica.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

  const result = useMemo(() => {
    const pct = modo === "gestao" ? 0.10 : modo === "acompanhamento" ? 0.05 : 0;
    const comissao = v * pct;
    const adicional = modo === "tecnica" ? t : 0;
    return { pct, comissao, adicional, total: comissao + adicional };
  }, [v, t, modo]);

  return (
    <PageContainer>
      <PageHeader module="Gestão · 5.1" title="Calculadora de Remuneração do Client Partner"
        description="Estime a remuneração de uma oportunidade conforme o tipo de atuação do CP." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros da oportunidade</CardTitle>
            <CardDescription>Informe o valor do contrato e o tipo de atuação.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Valor do contrato (R$)</Label>
              <Input inputMode="decimal" placeholder="Ex.: 250.000" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo de atuação</Label>
              <RadioGroup value={modo} onValueChange={(v) => setModo(v as Modo)} className="grid gap-2">
                {[
                  { v: "gestao", label: "Geração + Gestão do Projeto", desc: "10% sobre o valor do contrato" },
                  { v: "acompanhamento", label: "Geração + Acompanhamento", desc: "5% sobre o valor do contrato" },
                  { v: "tecnica", label: "Execução Técnica", desc: "Valor adicional por entrega técnica" },
                ].map((o) => (
                  <label key={o.v} className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/40 p-3 hover:bg-accent">
                    <RadioGroupItem value={o.v} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{o.label}</p>
                      <p className="text-xs text-muted-foreground">{o.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {modo === "tecnica" && (
              <div className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Valor da execução técnica (R$)</Label>
                <Input inputMode="decimal" placeholder="Ex.: 30.000" value={tecnica} onChange={(e) => setTecnica(e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remuneração estimada</CardTitle>
            <CardDescription>Cálculo automático.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Row label="Valor do contrato" value={brl(v)} />
            <Row label={`Comissão (${(result.pct * 100).toFixed(0)}%)`} value={brl(result.comissao)} />
            {modo === "tecnica" && <Row label="Execução técnica" value={brl(result.adicional)} />}
            <div className="mt-2 rounded-md border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total CP</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{brl(result.total)}</p>
              <Badge className="mt-2 bg-primary/20 text-primary">
                {modo === "gestao" ? "10% gestão" : modo === "acompanhamento" ? "5% acompanhamento" : "Execução técnica"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}
