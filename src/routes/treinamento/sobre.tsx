import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Quote } from "lucide-react";

export const Route = createFileRoute("/treinamento/sobre")({
  head: () => ({ meta: [{ title: "Sobre a Kienbaum — Kienbaum Hub de Mkt & Vendas" }] }),
  component: SobreKienbaumPage,
});

function SobreKienbaumPage() {
  return (
    <PageContainer>
      <PageHeader
        module="Treinamento · 1.5"
        title="Sobre a Kienbaum"
        description="Quem é a Kienbaum e como falamos: guia de estilo, tom de voz e storytelling para todo material comercial e institucional."
      />

      {/* Quem é a Kienbaum */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quem é a Kienbaum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground">
          <p>
            A <strong>Kienbaum</strong> é uma consultoria boutique global de origem alemã, com <strong>80 anos de atuação</strong> e uma das mais respeitadas da Europa em liderança, estratégia e cultura. Atua no ponto de encontro entre <em>Executive Search</em>, <em>Assessment</em>, <em>Coaching</em>, <em>Sucessão</em>, <em>Governança</em> e <em>Transformação Organizacional</em>.
          </p>
          <p>
            Nossa combinação única é <strong>rigor técnico com base em dados</strong> (na tradição analítica alemã) somado à <strong>profundidade humana</strong> na leitura de líderes e culturas. Não vendemos produtos soltos — desenhamos caminhos para desafios estratégicos específicos de cada organização.
          </p>
          <p>
            As operações de <strong>Porto Alegre e Cuiabá</strong> aplicam a expertise global ao contexto local, atendendo grupos familiares, empresas de médio e grande porte e organizações em transformação — sempre com a mesma exigência de qualidade da matriz europeia.
          </p>
          <div className="grid gap-3 md:grid-cols-2 pt-2">
            <Pillar title="Rigor Analítico" text="Estudos globais e insights baseados em evidências. Sem generalidades." />
            <Pillar title="Legado Alemão" text="80 anos transmitindo credibilidade, precisão e continuidade." />
            <Pillar title="Foco Integrado" text="Liderança, estratégia e cultura tratados como um mesmo problema." />
            <Pillar title="Thought Leadership" text="Voz ativa em temas críticos para o futuro do trabalho e da liderança." />
          </div>
        </CardContent>
      </Card>

      {/* Guia de Estilo, Tom de Voz e Storytelling */}
      <PageHeader
        module="Guia editorial"
        title="Guia de Estilo, Tom de Voz e Storytelling"
        description="Referência obrigatória para apresentações, e-mails e textos institucionais."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Princípios do tom de voz</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Bullet label="Consultivo" text="Analítico, sóbrio, focado em negócio, risco, evidências e impacto." />
            <Bullet label="Assertivo" text="Verbos diretos: proponho, sugiro, avaliar, estruturar, evidenciam, indicam, apontam para." />
            <Bullet label="Conectado" text="Liderança e pessoas sempre ligadas a resultado, competitividade, risco e produtividade." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Estrutura de argumentação</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Step n={1} title="Contexto / Diagnóstico de mercado" text="Dados, tendências, pressões (escassez de talentos, VUCA, demografia)." />
            <Step n={2} title="Implicações para liderança" text="O que o contexto passa a exigir da liderança e da organização." />
            <Step n={3} title="Sintomas observáveis" text="Sinais concretos: desalinhamento, perda de talentos, execução frágil." />
            <Step n={4} title="Organização da dor" text="Eixos claros: três frentes de desafio e hipóteses de gargalo." />
            <Step n={5} title="Caminhos de solução" text="Conectados ao desafio — nunca como cardápio de produtos." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Preferir</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Conceitos-âncora:</strong> maturidade de liderança · transformação organizacional · fator competitivo · risco de negócio · evidências e diagnóstico estruturado · jornada de liderança · execução da estratégia · people experience.</p>
            <p><strong>Formas de qualificar:</strong> padrão recorrente · pressão crescente · contexto de alta incerteza · mudanças estruturais · desafios concentrados em três frentes · hipóteses de gargalo.</p>
            <p><strong>Verbos:</strong> proponho, sugiro, requer, exige — sempre com clareza e segurança.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" />Evitar</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Coloquialismos:</strong> "se fizer sentido", "acho que vale", "talvez a gente possa", "bastante", "super", "legal", "a gnt", "vc", "top", "show".</p>
            <p><strong>Tom vendedor:</strong> "imperdível", "incrível", "sensacional".</p>
            <p><strong>Subjetivismos:</strong> "eu sinto que", "na minha visão pessoal".</p>
            <p><strong>Metáforas informais:</strong> "jogo de cintura", "bola quicando", "virar a chave" em materiais institucionais.</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Como falar da Kienbaum</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Regra de ouro:</strong> falar da Kienbaum <em>sempre depois</em> de falar do cliente e do contexto. Nunca abrir por auto-elogio.</p>
            <ul className="ml-5 list-disc space-y-1">
              <li><strong>Legado e reputação:</strong> "Uma das consultorias de liderança mais respeitadas da Europa", "80 anos de atuação".</li>
              <li><strong>Foco:</strong> "Atua onde liderança, estratégia e cultura se encontram".</li>
              <li><strong>Combinação única:</strong> rigor técnico + profundidade humana.</li>
            </ul>
            <p className="italic text-muted-foreground">"Com base em projetos recentes e estudos conduzidos pela Kienbaum, temos observado que…"</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Como falar de produtos e serviços</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Nunca como <em>produtos soltos</em>. Sempre como <strong>caminhos para desafios específicos</strong>, descritos em 3 linhas: (1) para que situação é indicado, (2) o que faz / como atua, (3) que resultado de negócio apoia.</p>
            <div className="grid gap-2 md:grid-cols-3 pt-1">
              <MiniCard title="Executive Search" text="Quando o desafio é acertar quem ocupa cadeiras críticas." />
              <MiniCard title="Assessment de Liderança" text="Quando falta clareza estruturada sobre quem é quem e onde estão os riscos." />
              <MiniCard title="Coaching / Peers Leadership / PDI Sprint" text="Quando o desafio é maturidade de quem já está na cadeira." />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Quote className="h-4 w-4 text-primary" />Frases-modelo que soam Kienbaum</CardTitle></CardHeader>
          <CardContent>
            <ul className="ml-5 list-disc space-y-1 text-sm italic text-foreground/90">
              <li>"Na nossa experiência, esse tipo de contexto tende a gerar…"</li>
              <li>"Os dados indicam que…"</li>
              <li>"A questão central deixa de ser [X] e passa a ser [Y]."</li>
              <li>"A partir dessa lente, a pergunta relevante é…"</li>
              <li>"A combinação de [diagnóstico] e [intervenção] tem se mostrado particularmente eficaz para…"</li>
              <li>"Nossa proposta é estruturar uma jornada de liderança em torno de…"</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Postura em e-mails e apresentações</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Propostas claras:</strong> "Minha proposta é…", "Sugiro uma reunião de 30–45 minutos para…".</p>
            <p><strong>Objetivos explícitos:</strong> sempre listar 2–3 bullets do que se pretende na conversa.</p>
            <p><strong>Janelas de horário:</strong> oferecer opções específicas em vez de "se quiser, me avise".</p>
            <p><strong>Fechamento objetivo:</strong> "Fico à disposição para avançarmos nessa agenda.", "Ajusto a agenda conforme sua disponibilidade."</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function Pillar({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{title}</p>
      <p className="mt-1 text-sm text-foreground">{text}</p>
    </div>
  );
}

function Bullet({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold text-primary">{label}</p>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function MiniCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
