import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  aiComplete,
  transcribeAudio,
  synthesizeSpeech,
  type ChatMessage,
} from "./ai-gateway.server";

/* ---------- Áudio: transcrição e voz (Gemini) ---------- */

export const transcribeAudioFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        mime: z.string().min(1),
        dataBase64: z.string().min(20),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const text = await transcribeAudio({ mime: data.mime, dataBase64: data.dataBase64 });
    return { text };
  });

export const synthesizeSpeechFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ text: z.string().min(1).max(2000) }).parse(input))
  .handler(async ({ data }) => {
    const audioUrl = await synthesizeSpeech(data.text);
    return { audioUrl };
  });

/* ---------- Simulador de Vendas (chat com persona) ---------- */

const PERSONAS: Record<string, string> = {
  ceo_industrial:
    "Você é Roberto Almeida, CEO de uma indústria familiar de médio porte (R$ 400M/ano, 1.200 colaboradores) no Sul do Brasil. Pragmático, cético com consultorias, valoriza ROI claro e cases regionais. Demonstra dor por sucessão e profissionalização da gestão, mas não entrega isso de graça — exige boas perguntas.",
  cfo: "Você é Marina Costa, CFO de uma empresa de serviços B2B (R$ 800M/ano). Analítica, foco em payback, EBITDA e governança. Faz perguntas duras sobre metodologia, fee e mensuração de resultado. Não tolera generalidades.",
  chro: "Você é Paulo Henrique, CHRO de um grupo varejista (15 mil colaboradores). Foco em cultura, liderança e talent assessment. Já foi queimado por consultorias 'caixa-preta'. Quer entender método, entregáveis e como engaja gestores internos.",
  dono_familiar:
    "Você é Dr. Antônio, fundador (72 anos) de empresa familiar de R$ 250M/ano, com 3 filhos no negócio. Emocional, desconfiado, valoriza confiança e reputação. Pergunta sobre experiência prévia com família, sucessão e segredo profissional.",
};

const SIM_SYSTEM = (
  personaKey: string,
) => `Você está em uma simulação de reunião comercial da Kienbaum Porto Alegre (consultoria boutique premium em Executive Search, Assessment, Sucessão e Liderança).

PERSONA QUE VOCÊ DEVE INTERPRETAR:
${PERSONAS[personaKey] ?? PERSONAS.ceo_industrial}

REGRAS:
- Fale APENAS como o cliente, nunca quebre o personagem.
- Respostas curtas (2-4 frases) como em reunião real. Não dê palestra.
- Reaja com naturalidade: impaciência se o Client Partner divagar, abertura se ele fizer boa pergunta GPCT/SPIN, ceticismo se ele tentar vender cedo demais.
- Em algum momento, lance uma objeção realista (preço, prazo, prova social, comparação com concorrente).
- Português do Brasil, tom executivo.`;

export const simulatorChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        persona: z.string().min(1),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            }),
          )
          .max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const messages: ChatMessage[] = [
      { role: "system", content: SIM_SYSTEM(data.persona) },
      ...data.history,
    ];
    const reply = await aiComplete(messages, { temperature: 0.8 });
    return { reply };
  });

export const simulatorFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        persona: z.string(),
        history: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const transcript = data.history
      .map((m) => `${m.role === "user" ? "CP" : "Cliente"}: ${m.content}`)
      .join("\n");
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você é um coach sênior da Kienbaum avaliando uma simulação de reunião comercial. Analise a performance do Client Partner (CP) à luz das técnicas GPCT, BANT e SPIN, e do método consultivo Kienbaum.

Estruture em markdown:
## Diagnóstico geral (1 parágrafo)
## Pontos fortes (3 bullets)
## Pontos de melhoria (3 bullets)
## Sugestões de perguntas que faltaram
## Nota geral: X/10`,
      },
      { role: "user", content: `Persona: ${data.persona}\n\nTranscrição:\n${transcript}` },
    ]);
    return { feedback: reply };
  });

/* ---------- Preparação de Reunião ---------- */

export const researchClient = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        info: z.string().min(3),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você é analista sênior da Kienbaum. Produza uma pesquisa executiva sobre a empresa-alvo para preparar um Client Partner. O usuário informa livremente nome da empresa, setor, site/LinkedIn e qualquer contexto adicional — identifique a empresa a partir desse texto. Markdown estruturado:
## Empresa identificada
(nome, setor, site/LinkedIn se disponíveis)
## Perfil corporativo
(porte estimado, setor, geografia, modelo de negócio)
## Momento atual e sinais públicos
(movimentos recentes, notícias, contratações, M&A, sinais de dor)
## Estrutura organizacional provável
(camadas C-level, tamanho de gestão, complexidade)
## Concorrência atual
(qual player — Executive Search, Assessment, Consultoria de Liderança etc. — hoje atende ou já atendeu esse cliente em serviços similares ao portfólio Kienbaum/Peerz; marque como HIPÓTESE se não houver sinal público)
## Gatilhos de demanda para Kienbaum
(sucessão, executive search, cultura, remuneração, board)
## Hipóteses a validar em reunião
(3-5 bullets)

Se não tiver certeza, marque como HIPÓTESE. Tom analítico, executivo.`,
      },
      {
        role: "user",
        content: `Informações sobre a empresa-alvo:\n${data.info}`,
      },
    ]);
    return { research: reply };
  });

export const prepareMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        info: z.string().min(3),
        pesquisa: z.string().default(""),
        transcricao: z
          .object({
            filename: z.string(),
            mime: z.string(),
            dataBase64: z.string().min(20),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const userContent: ChatMessage["content"] = [
      {
        type: "text",
        text: `Informações da reunião (empresa, stakeholder, objetivo, contexto):\n${data.info}\n\nPesquisa prévia do cliente:\n${data.pesquisa || "— (nenhuma pesquisa anexada)"}${data.transcricao ? `\n\nUma transcrição da reunião anterior foi anexada (arquivo: ${data.transcricao.filename}). Extraia dela pontos-chave, dores mencionadas e próximos passos combinados, e use como contexto principal do briefing.` : ""}`,
      },
    ];
    if (data.transcricao) {
      const dataUrl = `data:${data.transcricao.mime};base64,${data.transcricao.dataBase64}`;
      userContent.push({
        type: "file",
        file: { filename: data.transcricao.filename, file_data: dataUrl },
      });
    }
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você é consultor sênior da Kienbaum preparando um briefing executivo de reunião para um Client Partner. A partir do texto livre do usuário, identifique empresa, stakeholder e objetivo da reunião. Foque em hipóteses de dor, perguntas SPIN/GPCT e abertura consultiva. Tom Kienbaum: analítico, sóbrio, assertivo, sem coloquialismos. Português executivo. Markdown estruturado:
## Empresa e stakeholder identificados
## Contexto provável
## Stakeholders e interesses
## Hipóteses de dor
## Perguntas-chave (SPIN)
## Abertura sugerida (90 segundos)
## Riscos e objeções esperadas`,
      },
      { role: "user", content: userContent },
    ]);
    return { briefing: reply };
  });

/* ---------- Avaliação de Deck ---------- */

export const analyzeDeck = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        conteudo: z.string().default(""),
        cliente: z.string().default(""),
        linkUrl: z.string().default(""),
        file: z
          .object({
            filename: z.string(),
            mime: z.string(),
            dataBase64: z.string().min(20),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!data.file && !data.linkUrl.trim() && data.conteudo.trim().length < 20) {
      throw new Error("Envie um arquivo, um link, ou cole o conteúdo do deck.");
    }
    const userContent: ChatMessage["content"] = [
      {
        type: "text",
        text: `Cliente: ${data.cliente || "—"}\n\n${data.conteudo ? `Conteúdo textual do deck:\n${data.conteudo}\n\n` : ""}${data.file ? `Arquivo anexado: ${data.file.filename}. Analise-o integralmente.` : ""}${data.linkUrl ? `\nMaterial de referência disponível em: ${data.linkUrl}` : ""}`,
      },
    ];
    if (data.file) {
      const dataUrl = `data:${data.file.mime};base64,${data.file.dataBase64}`;
      if (data.file.mime.startsWith("image/")) {
        userContent.push({ type: "image_url", image_url: { url: dataUrl } });
      } else {
        userContent.push({
          type: "file",
          file: { filename: data.file.filename, file_data: dataUrl },
        });
      }
    }
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você é diretor de criação comercial da Kienbaum, avaliando um deck de proposta. Avalie 4 dimensões (0-10 cada): Storyline, Clareza, Proposta de Valor, Call-to-Action. Markdown:
## Avaliação por dimensão
- Storyline: X/10 — comentário
- Clareza: X/10 — comentário
- Proposta de Valor: X/10 — comentário
- Call-to-Action: X/10 — comentário
## Top 3 melhorias prioritárias
## Sugestão de slide-resumo (1 slide reescrito)`,
      },
      { role: "user", content: userContent },
    ]);
    return { analysis: reply };
  });

/* ---------- Análise de Carteira com anexo (Kienbaum) ---------- */

export const analyzeCarteira = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        contexto: z.string().default(""),
        file: z
          .object({
            filename: z.string(),
            mime: z.string(),
            dataBase64: z.string().min(20),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!data.file && data.contexto.trim().length < 20) {
      throw new Error("Envie um arquivo (PDF/PPT/Excel) ou descreva a carteira.");
    }
    const userContent: ChatMessage["content"] = [
      {
        type: "text",
        text: `Analise a carteira segundo o método Kienbaum: Pareto 80/20, potencial de expansão, risco de churn e priorização de ações do Client Partner. Contexto adicional: ${data.contexto || "—"}`,
      },
    ];
    if (data.file) {
      const dataUrl = `data:${data.file.mime};base64,${data.file.dataBase64}`;
      if (data.file.mime.startsWith("image/")) {
        userContent.push({ type: "image_url", image_url: { url: dataUrl } });
      } else {
        userContent.push({
          type: "file",
          file: { filename: data.file.filename, file_data: dataUrl },
        });
      }
    }
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você é sócio da Kienbaum revisando a carteira de um Client Partner. Markdown:
## Diagnóstico da carteira
## Clientes vitais (80% da receita)
## Clientes triviais (ações sugeridas)
## Oportunidades de expansão (produtos Kienbaum aplicáveis)
## Riscos de churn
## Plano de ação 30/60/90 dias
Tom executivo, direto.`,
      },
      { role: "user", content: userContent },
    ]);
    return { analysis: reply };
  });

/* ---------- Pesquisa de Concorrência ---------- */

export const competitionResearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        info: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você é analista de inteligência competitiva da Kienbaum. O usuário informa livremente o nome do concorrente e o foco da análise — identifique-os no texto (se o foco não for claro, assuma "Executive Search e Liderança"). Produza dossiê em markdown:
## Visão geral do player
## Portfólio de serviços
## Posicionamento e pricing percebido
## Clientes atendidos no último ano
(quais clientes esse player atendeu no último ano em serviços similares ao portfólio Kienbaum/Peerz; marque como HIPÓTESE se não houver sinal público)
## Pontos fortes (vs Kienbaum)
## Pontos fracos (vs Kienbaum)
## Como a Kienbaum vence essa comparação (3 argumentos)
Tom analítico, objetivo. Marque hipóteses quando não tiver certeza.`,
      },
      { role: "user", content: `Informações do concorrente:\n${data.info}` },
    ]);
    return { dossier: reply };
  });

/* ---------- E-mails de Nutrição ---------- */

export const nurtureEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        estagio: z.enum([
          "primeiro_contato",
          "pos_reuniao",
          "reengajamento",
          "envio_proposta",
          "fechamento",
        ]),
        info: z.string().min(3),
        artigoUrl: z.string().default(""),
        artigo: z
          .object({
            filename: z.string(),
            mime: z.string(),
            dataBase64: z.string().min(20),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const userContent: ChatMessage["content"] = [
      {
        type: "text",
        text: `Estágio: ${data.estagio}\nDestinatário, empresa e contexto:\n${data.info}${data.artigoUrl ? `\nArtigo/referência (URL ou produto Kienbaum): ${data.artigoUrl}` : ""}${data.artigo ? `\nArtigo de referência anexado: ${data.artigo.filename}. Use insights, dados e frameworks deste artigo para embasar o e-mail. Cite a fonte em uma linha ao final (P.S.: leitura recomendada — ...).` : ""}`,
      },
    ];
    if (data.artigo) {
      const dataUrl = `data:${data.artigo.mime};base64,${data.artigo.dataBase64}`;
      userContent.push({
        type: "file",
        file: { filename: data.artigo.filename, file_data: dataUrl },
      });
    }
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você escreve e-mails comerciais consultivos da Kienbaum (boutique premium alemã, 80 anos). O usuário informa livremente destinatário (nome/cargo), empresa e contexto — identifique-os no texto. Tom: analítico, sóbrio, assertivo, sem coloquialismos, sem "amaciadores" tipo "acho que", "talvez", "se fizer sentido". Máximo 200 palavras. Sempre que houver artigo de referência (MIT, Harvard, INSEAD, BCG, McKinsey, Kienbaum, etc.), embase o argumento em dados/frameworks dele e feche com uma linha "P.S.: leitura recomendada — [título/fonte]".

Markdown com:
**Assunto:** ...

Corpo do e-mail (saudação executiva, 2-3 parágrafos curtos, CTA claro com opções de janela de horário, assinatura genérica "[Seu nome] · Client Partner · Kienbaum Porto Alegre").`,
      },
      { role: "user", content: userContent },
    ]);
    return { email: reply };
  });

/* ---------- Deck — geração/refinamento de HTML para envio ao cliente ---------- */

export const generateDeckHtml = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        cliente: z.string().default(""),
        conteudo: z.string().default(""),
        analise: z.string().default(""),
        htmlAtual: z.string().default(""),
        linkUrl: z.string().default(""),
        mensagens: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            }),
          )
          .max(30)
          .default([]),
        file: z
          .object({
            filename: z.string(),
            mime: z.string(),
            dataBase64: z.string().min(20),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const system = `Você é diretor de criação da Kienbaum. Produza uma página HTML autocontida, pronta para envio ao cliente executivo, seguindo estritamente o Guia de Estilo Kienbaum: tom consultivo, sóbrio, assertivo, analítico; estrutura Contexto → Implicações → Sintomas → Caminhos de Solução; sem coloquialismos.

REGRAS DE OUTPUT:
1. Devolva SEMPRE um bloco fenced \`\`\`html com o documento HTML completo (<!doctype html> ... </html>) — sem markdown fora do bloco, sem comentários explicativos antes ou depois.
2. Depois do bloco html, escreva 1-2 linhas comentando o que mudou nesta versão (para o Client Partner).
3. CSS inline no <style> do <head>. Tipografia: 'Georgia' para títulos, system-ui para corpo. Paleta: fundo #f5f3ee, texto #1a1a2e, acento #4b5563, borda #d8d4cc. Margens generosas, seções bem espaçadas, largura máx 720px centralizada. Responsivo.
4. Estruture como um documento executivo: capa, sumário executivo, seções numeradas, tabelas se fizer sentido, e um bloco final de próximos passos.
5. Ao refinar (turno subsequente), preserve o que estiver bom e altere só o que o CP pediu.`;

    const messages: ChatMessage[] = [{ role: "system", content: system }];

    // Primeira mensagem: contexto completo (cliente, análise prévia, arquivo se houver)
    const firstText = `Cliente/contexto: ${data.cliente || "—"}\n\nOutline / conteúdo do deck:\n${data.conteudo || "— (usar arquivo anexado)"}\n\nAnálise crítica já feita (use como direção editorial):\n${data.analise || "— (nenhuma)"}${data.linkUrl ? `\n\nMaterial de referência disponível em: ${data.linkUrl}` : ""}\n\n${data.htmlAtual ? "HTML atual (para refinar):\n" + data.htmlAtual : "Gere a primeira versão do documento HTML de proposta/apresentação para o cliente."}`;
    const firstContent: ChatMessage["content"] = [{ type: "text", text: firstText }];
    if (data.file) {
      const dataUrl = `data:${data.file.mime};base64,${data.file.dataBase64}`;
      if (data.file.mime.startsWith("image/")) {
        firstContent.push({ type: "image_url", image_url: { url: dataUrl } });
      } else {
        firstContent.push({
          type: "file",
          file: { filename: data.file.filename, file_data: dataUrl },
        });
      }
    }
    messages.push({ role: "user", content: firstContent });
    for (const m of data.mensagens) messages.push({ role: m.role, content: m.content });

    const reply = await aiComplete(messages, { temperature: 0.5 });
    const match = reply.match(/```html\s*([\s\S]*?)```/i);
    const html = match ? match[1].trim() : "";
    const comentario = match ? reply.replace(match[0], "").trim() : reply.trim();
    return { html, comentario };
  });

/* ---------- GPCT — Veredicto Kienbaum ---------- */

export const qualifyGpct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        cliente: z.string().min(1),
        goals: z.string().min(1),
        plans: z.string().min(1),
        challenges: z.string().min(1),
        timeline: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você é um sócio sênior da Kienbaum avaliando se uma oportunidade descrita em GPCT é resolvível pelo portfólio Kienbaum (Executive Search, Assessment, Coaching, Sucessão, Governança, Cultura, Remuneração, Board Services). Seja direto e crítico. Formato markdown:

## Veredicto: [SIM / PARCIALMENTE / NÃO]
## Racional (2-3 frases)
## Produtos Kienbaum aplicáveis
- lista de 1 a 3 produtos com justificativa curta
## Riscos e o que falta descobrir
- 3 bullets
## Próxima pergunta que o CP deveria fazer
- 1 pergunta específica

Tom executivo, sem enrolação.`,
      },
      {
        role: "user",
        content: `Cliente: ${data.cliente}\nGoals: ${data.goals}\nPlans: ${data.plans}\nChallenges: ${data.challenges}\nTimeline: ${data.timeline}`,
      },
    ]);
    return { verdict: reply };
  });

/* ---------- Avaliação de reunião por técnica (SPIN / GPCT / BANT) + Go/No-Go ---------- */

const FRAMEWORK_LABEL: Record<string, string> = {
  spin: "SPIN (Situation, Problem, Implication, Need-payoff)",
  gpct: "GPCT (Goals, Plans, Challenges, Timeline)",
  bant: "BANT (Budget, Authority, Need, Timeline)",
};

export const evaluateMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        framework: z.enum(["spin", "gpct", "bant"]),
        cliente: z.string().min(1),
        data: z.string().min(1),
        notas: z.string().default(""),
        criterios: z.array(
          z.object({ label: z.string(), peso: z.number(), atendido: z.boolean() }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data: d }) => {
    const score = d.criterios.reduce((a, c) => a + (c.atendido ? c.peso : 0), 0);
    const max = d.criterios.reduce((a, c) => a + c.peso, 0);
    const pct = max ? Math.round((score / max) * 100) : 0;
    const criteriosTexto = d.criterios
      .map((c) => `- [${c.atendido ? "x" : " "}] (peso ${c.peso}) ${c.label}`)
      .join("\n");
    const reply = await aiComplete([
      {
        role: "system",
        content: `Você é sócio sênior da Kienbaum avaliando uma reunião comercial conduzida com o framework ${FRAMEWORK_LABEL[d.framework]}. Avalie DUAS coisas: (1) o desempenho do Client Partner (CP) na condução da reunião segundo esse framework; (2) insights sobre o cliente — o quão pronto ele está para contratar um produto Kienbaum/Peerz e quais produtos/serviços do portfólio (Executive Search, Assessment, Coaching, Sucessão, Governança, Cultura, Remuneração, Board Services) seriam mais adequados ao que ele trouxe na reunião. Incorpore explicitamente os critérios Go/No-Go informados — comente cada um. Comece o texto exatamente no formato: "A análise da reunião de ${d.data} com ${d.cliente} demonstrou que:" seguido de bullets. Estruture em markdown:

## Desempenho do Client Partner
## Critérios Go/No-Go avaliados
(comente cada critério listado, indicando se foi atendido e o porquê)
## Decisão: Go / Go condicional / No-Go
## Insights sobre o cliente
## Produtos/serviços Kienbaum recomendados
## Próximos passos

Tom executivo, direto, sem enrolação.`,
      },
      {
        role: "user",
        content: `Cliente/oportunidade: ${d.cliente}\nData: ${d.data}\nFramework: ${d.framework.toUpperCase()}\n\nNotas/transcrição da reunião:\n${d.notas || "— (nenhuma nota, avalie apenas pelos critérios Go/No-Go)"}\n\nCritérios Go/No-Go (pontuação ${score}/${max} = ${pct}%):\n${criteriosTexto}`,
      },
    ]);
    return { analysis: reply, score, max, pct };
  });
