import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/treinamento/perfil")({
  head: () => ({ meta: [{ title: "Perfil do Client Partner — Kienbaum Hub de Mkt & Vendas" }] }),
  component: PerfilPage,
});

const SECTIONS = [
  {
    title: "O Papel do Client Partner",
    body: (
      <p>
        O CP não é vendedor. É um consultor de confiança que conecta necessidades estratégicas do
        cliente ao portfólio Kienbaum. Gera demanda, estrutura propostas, fecha contratos e
        gerencia relacionamento de longo prazo.
      </p>
    ),
  },
  {
    title: "Portfólio de Produtos a Dominar",
    body: (
      <ul className="space-y-2">
        <li>
          <strong className="text-foreground">Assessment / Competence Check</strong> — alimenta
          Coaching, PDI Sprint, Análise de Sucessores e Peers Leadership.
        </li>
        <li>
          <strong className="text-foreground">Coaching Executivo</strong> — desenvolvimento
          individual profundo, transformação comportamental.
        </li>
        <li>
          <strong className="text-foreground">Estratégia de Sucessão (BBB)</strong> — mapeamento de
          potenciais e matriz de sucessão para posições críticas.
        </li>
        <li>
          <strong className="text-foreground">PDI Sprint</strong> — lideranças iniciantes, 6 meses
          de acompanhamento.
        </li>
        <li>
          <strong className="text-foreground">Executive Search</strong> — processo 10 Step Search,
          hunting ativo de candidatos passivos.
        </li>
        <li>Peers Leadership, Redesenho Organizacional, Governança Empresarial/Familiar.</li>
      </ul>
    ),
  },
  {
    title: "Tipos de Atuação",
    body: (
      <div className="space-y-3">
        <p>
          <span className="font-semibold text-primary">Geração + Gestão do Projeto (10%)</span> —
          identifica, gera, estrutura, negocia, fecha e gerencia ativamente do kick-off ao
          encerramento e NPS.
        </p>
        <p>
          <span className="font-semibold text-primary">Geração + Acompanhamento (5%)</span> —
          identifica, gera, fecha, faz handoff e acompanha estrategicamente.
        </p>
        <p>
          <span className="font-semibold text-primary">Execução Técnica</span> — remuneração
          adicional por entrega técnica específica, conforme tabela do produto.
        </p>
      </div>
    ),
  },
  {
    title: "Competências Essenciais",
    body: (
      <ul className="grid gap-2 md:grid-cols-2">
        <li>Visão estratégica de negócios</li>
        <li>Diagnóstico consultivo (perguntas antes de soluções)</li>
        <li>Gestão de relacionamentos C-level de longo prazo</li>
        <li>Domínio do portfólio Kienbaum</li>
        <li>Negociação em ambiente boutique (não transacional)</li>
        <li>Inteligência emocional e presença executiva</li>
      </ul>
    ),
  },
  {
    title: "Cliente Ideal Kienbaum",
    body: (
      <ul className="space-y-2">
        <li>Faturamento R$150MM+ com estrutura de liderança formal.</li>
        <li>Indústria/Manufatura, Agronegócio, Cooperativas, Varejo, Serviços.</li>
        <li>Sul (RS, SC, PR), Sudeste e Centro-Oeste.</li>
        <li>Empresa familiar profissionalizando, em crescimento ou com sucessão planejada.</li>
        <li>Já trabalhou com consultoria — valoriza metodologia.</li>
        <li>Posições típicas: CEO, CFO, COO, Diretor Industrial, Comercial, CHRO, Conselheiros.</li>
      </ul>
    ),
  },
  {
    title: "Quando NÃO Vender",
    body: (
      <ul className="space-y-2 text-muted-foreground">
        <li>Perfil impossível (“unicórnio”).</li>
        <li>Salário muito abaixo de mercado.</li>
        <li>Prazo irrealista (menos de 8 semanas para Search).</li>
        <li>Decisor real não está envolvido.</li>
        <li>Empresa em crise terminal.</li>
        <li>Conflito de interesse (off-limits).</li>
        <li>Histórico de calote.</li>
      </ul>
    ),
  },
];

function PerfilPage() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };
  return (
    <PageContainer>
      <PageHeader
        module="Treinamento · 1.1"
        title="Perfil do Client Partner"
        description="Percorra horizontalmente os blocos: papel, portfólio, tipos de atuação, competências, cliente ideal e quando não vender."
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{SECTIONS.length} blocos</p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label="Anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label="Próximo">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
        >
          {SECTIONS.map((s, i) => (
            <Card
              key={s.title}
              className="min-w-[85%] snap-start md:min-w-[520px] md:max-w-[520px]"
            >
              <CardHeader>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Bloco {i + 1} / {SECTIONS.length}
                </p>
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}