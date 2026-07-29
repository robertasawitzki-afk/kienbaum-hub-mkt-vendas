import { KIENBAUM_MARK_WHITE } from "@/lib/kienbaumBrandAssets";

export interface TituloDesc {
  titulo: string;
  descricao: string;
}

export interface CredencialLogo {
  nome: string;
  logo?: string;
}

export interface DadosPropostaTemplate {
  codigo: string;
  data: string;
  empresa: string;
  interlocutor: string;
  cargo: string;
  area: string;
  consultora: string;
  contexto: string;
  objetivo: string;
  publico_alvo: string;
  qtd_alta: number;
  qtd_media: number;
  qtd_baixa: number;
  entregaveis: string[];
  instrumentos: string[];
  jornada: string[];
  nosso_entendimento: TituloDesc[];
  perguntas: string[];
  ceo_rh_usos: string[];
  papel_kienbaum_desc: string;
  papel_cliente_desc: string;
  metodo_etapas: TituloDesc[];
  modo_investimento: "por_nivel" | "valor_total";
  valor_alta: number;
  valor_media: number;
  valor_baixa: number;
  valor_total: number;
  nota_investimento: string;
  condicoes_pagamento: string;
  validade: string;
  credenciais_todas: CredencialLogo[];
  duracao: string;
  proximos_passos: string;
  decisao_requerida: string;
  observacoes: string;
  aceite_digital: boolean;
  incluir_quem_somos: boolean;
  total_avaliados: number;
  subtotal_por_nivel: number;
}

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escNl(s: unknown): string {
  return esc(s).replace(/\n/g, "<br>");
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

const ICONS: Record<string, string> = {
  contexto:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
  solucao:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M7.8 7.4 10.6 16M16.2 7.4 13.4 16"/></svg>',
  metodo:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v7M12 10 6 20M12 10l6 10"/></svg>',
  entregaveis:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  investimento:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M14.5 9.3c0-1-1-1.8-2.5-1.8s-2.5.8-2.5 1.8 1 1.5 2.5 1.9 2.5.9 2.5 1.9-1 1.8-2.5 1.8-2.5-.8-2.5-1.8"/></svg>',
  check:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12.5 9 17.5 20 6"/></svg>',
  chat:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5h16v11H9l-5 4V5Z"/></svg>',
  resumo:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></svg>',
  execucao:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 3"/></svg>',
  fechamento:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3v18"/><path d="M6 4h11l-3 4 3 4H6"/></svg>',
  quemsomos:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="3" width="14" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>',
};

function iconCard(iconKey: keyof typeof ICONS, title: string, desc: string): string {
  return `<div class="card-accent"><div class="card-head">${ICONS[iconKey]}<div class="card-title">${esc(title)}</div></div><p>${esc(desc)}</p></div>`;
}

const ENTREGAVEL_DESC: Record<string, string> = {
  "Relatório individual": "Leitura por competência, potencial, pontos fortes, lacunas e recomendações de evolução.",
  "Relatório consolidado": "Mapa do grupo, padrões observados, riscos e prioridades por nível ou área.",
  PDI: "Plano de Desenvolvimento Individual com ações conectadas à estratégia e às metas do negócio.",
  "Mapa de sucessão": "Visão de potenciais sucessores, prontidão e necessidades de desenvolvimento.",
  "Plano gerencial": "Agenda coletiva de desenvolvimento para acelerar competências críticas do time.",
  "Feedback executivo": "Devolutiva estruturada para gerar entendimento, compromisso e próximos movimentos.",
};

const ENTREGAVEL_ICON: Record<string, keyof typeof ICONS> = {
  "Relatório individual": "entregaveis",
  "Relatório consolidado": "metodo",
  PDI: "contexto",
  "Mapa de sucessão": "solucao",
  "Plano gerencial": "check",
  "Feedback executivo": "chat",
};

export function buildProposalHTML(d: DadosPropostaTemplate): string {
  const totalInvestimento = d.modo_investimento === "por_nivel" ? d.subtotal_por_nivel : d.valor_total;

  const escopoChips = d.entregaveis.map((c) => `<span class="chip">${esc(c)}</span>`).join("");

  const investimentoTabela =
    d.modo_investimento === "por_nivel"
      ? `<table class="inv-table">
          <thead><tr><th>Nível</th><th>Qtd.</th><th>Valor un.</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${[
              { nome: "Diretoria / Executivos", q: d.qtd_alta, v: d.valor_alta },
              { nome: "Liderança média", q: d.qtd_media, v: d.valor_media },
              { nome: "Liderança inicial", q: d.qtd_baixa, v: d.valor_baixa },
            ]
              .filter((r) => r.q > 0)
              .map(
                (r) =>
                  `<tr><td>${esc(r.nome)}</td><td>${r.q}</td><td>${formatBRL(r.v)}</td><td><strong>${formatBRL(r.q * r.v)}</strong></td></tr>`,
              )
              .join("")}
            <tr class="total-row"><td colspan="3">Total</td><td><strong>${formatBRL(d.subtotal_por_nivel)}</strong></td></tr>
          </tbody>
        </table>`
      : `<div class="value-note">${d.nota_investimento ? `<p>${escNl(d.nota_investimento)}</p>` : ""}</div>`;

  const condicoesCards =
    d.condicoes_pagamento === "1/3 + 1/3 + 1/3"
      ? `<div class="pay-grid">
          <div class="pay-card"><div class="pay-frac">1/3</div><p>na aprovação da proposta e início do contrato.</p></div>
          <div class="pay-card"><div class="pay-frac">1/3</div><p>30 dias após a aprovação do contrato.</p></div>
          <div class="pay-card"><div class="pay-frac">1/3</div><p>na entrega dos relatórios finais.</p></div>
        </div>`
      : `<div class="pay-simple"><strong>Condição de pagamento:</strong> ${esc(d.condicoes_pagamento)}</div>`;

  const entregaveisCards = d.entregaveis
    .map((e) => iconCard(ENTREGAVEL_ICON[e] ?? "entregaveis", e, ENTREGAVEL_DESC[e] ?? ""))
    .join("");

  const instrumentosChips = d.instrumentos.map((i) => `<span class="chip chip-light">${esc(i)}</span>`).join("");

  const JORNADA_DESC: Record<string, string> = {
    "Kick-off": "Alinhamento inicial",
    "Pré-work": "Preparação prévia",
    Convite: "Entendimento do objetivo",
    Avaliação: "Entrevista e casos",
    Relatório: "Síntese individual",
    Feedback: "Devolutiva e PDI",
  };
  const jornadaCards = d.jornada
    .map((j) => `<div class="jstep"><div class="name">${esc(j)}</div><p>${esc(JORNADA_DESC[j] ?? "")}</p></div>`)
    .join("");

  const credenciaisCards = d.credenciais_todas
    .map((c) =>
      c.logo
        ? `<div class="credencial credencial-logo"><img src="${esc(c.logo)}" alt="${esc(c.nome)}"></div>`
        : `<div class="credencial">${esc(c.nome)}</div>`,
    )
    .join("");

  const NOSSO_ENTENDIMENTO_ICONS: (keyof typeof ICONS)[] = ["contexto", "entregaveis", "check", "solucao"];
  const nossoEntendimentoCards = d.nosso_entendimento
    .map((item, i) => iconCard(NOSSO_ENTENDIMENTO_ICONS[i % NOSSO_ENTENDIMENTO_ICONS.length], item.titulo, item.descricao))
    .join("");

  const perguntasList = d.perguntas.map((p) => `<li>${esc(p)}</li>`).join("");

  const ceoRhChips = d.ceo_rh_usos
    .map((c) => `<span class="chip" style="color:#fff;border-color:rgba(255,255,255,0.5)">${esc(c)}</span>`)
    .join("");

  const metodoStepsHtml = d.metodo_etapas
    .map((etapa, i) => {
      const instrumentosBlock =
        i === 3 && instrumentosChips ? `<div class="chips" style="margin:10px 0 0">${instrumentosChips}</div>` : "";
      return `<div class="step"><div class="n">${i + 1}</div><div><div class="name">${esc(etapa.titulo)}</div><p>${esc(etapa.descricao)}</p>${instrumentosBlock}</div></div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposta Comercial - ${esc(d.empresa)}</title>
<style>
  :root{
    --navy:#28434F;
    --accent:#5B80A3;
    --bg:#F7F6F4;
    --line:#D8D6D2;
    --muted:#726C68;
    --white:#FFFFFF;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--white);color:var(--navy);font-family:Arial, Helvetica, sans-serif;line-height:1.45}
  a{color:inherit}
  .layout{display:flex;min-height:100vh}
  .sidebar{width:200px;flex-shrink:0;background:var(--navy);color:#fff;position:sticky;top:0;align-self:flex-start;height:100vh;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:8px;padding:22px 20px;border-bottom:0.5px solid rgba(255,255,255,0.15);font-size:16px;font-weight:700;letter-spacing:-0.2px}
  .brand .mark{height:18px;width:auto}
  .nav{flex:1;padding:14px 0}
  .nav a{display:flex;align-items:center;gap:10px;padding:10px 20px;font-size:12.5px;font-weight:500;color:rgba(255,255,255,0.75);text-decoration:none;border-left:2px solid transparent}
  .nav a:hover{color:#fff;background:rgba(255,255,255,0.06)}
  .nav a svg{flex-shrink:0}
  .sidebar-footer{padding:16px 20px;border-top:0.5px solid rgba(255,255,255,0.15);font-size:10px;opacity:0.65}
  .main{flex:1;padding:44px 56px;max-width:960px;position:relative}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
  h1{font-size:34px;font-weight:700;letter-spacing:-0.5px;margin:0 0 10px;color:var(--navy)}
  h2{font-size:21px;font-weight:700;margin:0 0 12px;color:var(--navy)}
  h3{font-size:14px;font-weight:700;margin:0 0 6px;color:var(--navy)}
  p{margin:0 0 10px;font-size:13.5px;color:var(--navy)}
  section{padding:36px 0;border-bottom:0.5px solid var(--line)}
  section:last-child{border-bottom:none}
  .subtitle{font-size:15px;color:var(--muted);margin-bottom:22px;max-width:600px}
  .subheadline{color:var(--muted);font-size:14px;font-weight:400;margin:0 0 20px;max-width:640px}
  .cover-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .code-badge{border:0.5px solid var(--accent);color:var(--accent);border-radius:8px;padding:5px 12px;font-size:12px;font-weight:700}
  .hero-card{background:var(--navy);border-radius:16px;padding:32px 36px;position:relative;overflow:hidden;margin-bottom:20px}
  .hero-card .eyebrow{color:rgba(255,255,255,0.75)}
  .hero-card h1{color:#fff;margin-bottom:8px}
  .hero-card .subtitle{color:rgba(255,255,255,0.85);margin-bottom:0}
  .hero-mark{position:absolute;right:28px;top:50%;transform:translateY(-50%);height:56px;width:auto;opacity:0.9}
  .card-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .card-head svg{color:var(--accent);flex-shrink:0}
  .box{border:0.5px solid var(--line);border-radius:14px;background:var(--bg);padding:18px}
  .box-white{border:0.5px solid var(--line);border-radius:14px;background:#fff;padding:18px}
  .box-navy{border-radius:14px;background:var(--navy);color:#fff;padding:20px}
  .box-navy h3,.box-navy p,.box-navy li{color:#fff}
  .box-navy li{font-size:13.5px;margin:4px 0}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
  .chip{border:0.5px solid var(--accent);color:var(--accent);border-radius:999px;padding:6px 14px;font-size:11.5px;font-weight:600}
  .chip-light{border-color:var(--line);color:var(--muted)}
  .big-objective{font-size:19px;font-weight:700;line-height:1.4;color:var(--navy);border-left:3px solid var(--accent);padding-left:16px;margin:20px 0}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
  .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px}
  .stat-box{border:0.5px solid var(--line);border-radius:14px;padding:14px;text-align:center}
  .stat-box .num{font-size:20px;font-weight:700;color:var(--accent)}
  .stat-box .label{font-size:10.5px;color:var(--muted);margin-top:4px}
  .card-accent{border-left:3px solid var(--accent);border-top:0.5px solid var(--line);border-right:0.5px solid var(--line);border-bottom:0.5px solid var(--line);border-radius:0 14px 14px 0;background:#fff;padding:16px}
  .card-title{font-size:13.5px;font-weight:700;color:var(--navy);margin-bottom:6px}
  .card-accent p{font-size:12.5px;color:var(--muted);margin:0}
  .questions{margin-top:16px}
  .questions ol{margin:0;padding-left:18px}
  .questions li{font-size:13.5px;margin:8px 0}
  .steps{margin-top:20px}
  .step{display:flex;gap:16px;padding:16px 0;border-top:0.5px solid var(--line)}
  .step:first-child{border-top:none}
  .step .n{width:28px;height:28px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
  .step .name{font-size:14.5px;font-weight:700;margin-bottom:4px;color:var(--navy)}
  .step p{margin:0;font-size:12.5px;color:var(--muted)}
  .steps-timeline{position:relative}
  .steps-timeline::before{content:"";position:absolute;left:13px;top:14px;bottom:14px;width:1px;background:var(--line)}
  .steps-timeline .step{border-top:none;padding:12px 0}
  .steps-timeline .step .n{position:relative;z-index:1}
  .steps-timeline .step:nth-child(odd) .n{background:var(--navy)}
  .steps-timeline .step:nth-child(even) .n{background:var(--accent)}
  .inv-table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
  .inv-table th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted);font-weight:600;padding:10px 12px;background:var(--bg)}
  .inv-table td{padding:10px 12px;border-top:0.5px solid var(--line)}
  .inv-table .total-row{background:var(--bg);font-weight:700}
  .value-note{margin-top:12px}
  .pay-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .pay-card{border:0.5px solid var(--line);border-radius:14px;padding:16px;text-align:center}
  .pay-frac{font-size:20px;font-weight:700;color:var(--accent);margin-bottom:8px}
  .pay-card p{font-size:12px;color:var(--muted);margin:0}
  .pay-simple{margin-top:14px;font-size:13.5px}
  .credenciais{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
  .credencial{border:0.5px solid var(--line);border-radius:8px;padding:10px 16px;font-size:13px;font-weight:700;color:var(--navy);display:flex;align-items:center;justify-content:center}
  .credencial-logo{width:140px;height:64px;padding:10px}
  .credencial-logo img{max-width:100%;max-height:100%;object-fit:contain}
  .journey{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:16px}
  .journey .jstep{border:0.5px solid var(--line);border-radius:14px;padding:14px;text-align:center}
  .journey .jstep .name{font-size:13px;font-weight:700;color:var(--navy);margin-bottom:4px}
  .journey .jstep p{font-size:11px;color:var(--muted);margin:0}
  .footer-note{font-size:11px;color:var(--muted);margin-top:32px}
  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:36px}
  .signatures .line{border-top:0.5px solid var(--navy);padding-top:8px;font-size:12px;color:var(--muted)}
  .stat-hero{border-radius:14px;background:var(--navy);color:#fff;padding:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-top:18px}
  .stat-hero .label{font-size:12px;opacity:0.8}
  .stat-hero .value{font-size:28px;font-weight:700}
  @media (max-width:800px){.sidebar{display:none}.grid-2,.grid-3,.grid-4,.pay-grid,.journey{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="brand">Kienbaum<img class="mark" src="${KIENBAUM_MARK_WHITE}" alt=""></div>
    <nav class="nav">
      <a href="#resumo">${ICONS.resumo} Resumo Executivo</a>
      <a href="#contexto">${ICONS.contexto} Contexto</a>
      <a href="#solucao">${ICONS.solucao} Solução</a>
      <a href="#metodo">${ICONS.metodo} Método</a>
      <a href="#entregaveis">${ICONS.entregaveis} Entregáveis</a>
      <a href="#execucao">${ICONS.execucao} Execução</a>
      <a href="#investimento">${ICONS.investimento} Investimento</a>
      ${d.incluir_quem_somos ? `<a href="#quemsomos">${ICONS.quemsomos} Quem Somos</a>` : ""}
      <a href="#fechamento">${ICONS.fechamento} Fechamento</a>
    </nav>
    <div class="sidebar-footer">Confidencial<br>${esc(d.consultora)}</div>
  </aside>

  <main class="main">

    <section id="resumo">
      <div class="cover-top">
        <div class="eyebrow" style="margin-bottom:0">Proposta executiva · ${esc(d.data)}</div>
        <div class="code-badge">${esc(d.codigo || "—")}</div>
      </div>

      <div class="hero-card">
        <img class="hero-mark" src="${KIENBAUM_MARK_WHITE}" alt="">
        <div class="eyebrow">Proposta executiva</div>
        <h1>Competence Check</h1>
        <div class="subtitle">Assessment executivo para decisões de liderança, sucessão e desenvolvimento.</div>
      </div>

      <div class="box-white">
        <div class="eyebrow" style="margin-bottom:6px">Preparado para</div>
        <h3 style="font-size:16px">${esc(d.empresa)}</h3>
        <p style="margin:0">${esc(d.interlocutor)}${d.cargo ? ` · ${esc(d.cargo)}` : ""}${d.area ? ` · ${esc(d.area)}` : ""}</p>
      </div>

      <div class="big-objective">${escNl(d.objetivo)}</div>

      <div class="box" style="display:inline-block;margin-top:4px"><strong>${d.metodo_etapas.length}</strong> etapas estruturadas, do alinhamento ao feedback</div>

      <p style="margin-top:20px">Um processo objetivo, com profundidade suficiente para gerar evidências e simples o bastante para orientar decisões da Diretoria Executiva e dar visibilidade estratégica ao Conselho.</p>

      <div class="box-navy" style="margin-top:16px">
        <h3>Leitura executiva</h3>
        <p>O diagnóstico mostra onde há forças, gargalos e riscos por nível. A resposta não será pontual por camada, mas sistêmica: o topo descentraliza responsabilidades; as lideranças médias ampliam maturidade para decidir; e as lideranças iniciais aceleram autonomia.</p>
        <h3 style="margin-top:16px">Direcionadores</h3>
        <ul style="margin:0;padding-left:18px">
          <li>evoluir todos os níveis;</li>
          <li>fortalecer aprendizagem entre pares;</li>
          <li>acompanhar riscos e sucessão.</li>
        </ul>
      </div>
    </section>

    <section id="contexto">
      <div class="eyebrow">Nosso entendimento</div>
      <h2>Contexto e objetivo executivo</h2>
      <p class="subheadline">O momento exige uma leitura clara da liderança: quem entrega hoje, quem tem potencial para crescer e quais competências precisam ser aceleradas para sustentar a estratégia.</p>

      <div class="box-white">
        <div class="eyebrow" style="margin-bottom:6px">Contexto do cliente</div>
        <p style="margin:0">${escNl(d.contexto)}</p>
      </div>

      <div class="box-white" style="margin-top:14px">
        <div class="eyebrow" style="margin-bottom:6px">Escopo do projeto</div>
        <p style="margin:0 0 8px"><strong>Público-alvo:</strong> ${esc(d.publico_alvo)}</p>
        <p style="margin:0"><strong>Avaliados no escopo:</strong> ${d.total_avaliados}</p>
        ${escopoChips ? `<div class="chips">${escopoChips}</div>` : ""}
      </div>

      <div class="grid-2">${nossoEntendimentoCards}</div>

      ${
        d.perguntas.length
          ? `<div class="box-navy questions"><h3>Perguntas que o projeto responde</h3><ol>${perguntasList}</ol></div>`
          : ""
      }
    </section>

    <section id="solucao">
      <div class="eyebrow">Assessment executivo</div>
      <h2>Solução proposta: Competence Check</h2>
      <p class="subheadline">Avaliação executiva estruturada para mapear competências, potencial e prontidão para sucessão.</p>
      <div class="box-white">
        <p style="margin:0">O processo combina entrevistas estruturadas, estudos de caso e consolidação dos resultados em relatórios objetivos para liderança e RH.</p>
      </div>

      <h3 style="margin-top:24px">Resultados esperados</h3>
      <div class="grid-3">
        ${iconCard("check", "Prontidão", "Quem está preparado para assumir maior complexidade no curto prazo.")}
        ${iconCard("solucao", "Potencial", "Quem pode evoluir para posições críticas com desenvolvimento direcionado.")}
        ${iconCard("entregaveis", "Riscos", "Onde há lacunas relevantes de competência, sucessão ou aderência ao papel.")}
      </div>

      <h3 style="margin-top:24px">Dimensões avaliadas</h3>
      <div class="grid-2">
        ${iconCard("contexto", "Competências de liderança", "Nível de entrega esperado por papel e complexidade.")}
        ${iconCard("metodo", "Aderência ao negócio", "Capacidade de atuar em alinhamento com estratégia, cultura e metas.")}
        ${iconCard("solucao", "Potencial de crescimento", "Sinais de aprendizagem, adaptabilidade e prontidão.")}
        ${iconCard("entregaveis", "Prioridades de desenvolvimento", "Gaps críticos convertidos em ações práticas de PDI.")}
      </div>
    </section>

    <section id="metodo">
      <div class="eyebrow">Como o trabalho acontece</div>
      <h2>Abordagem metodológica em etapas</h2>
      <p class="subheadline">A metodologia foi estruturada em uma jornada objetiva, com começo, meio e fim claros para sponsor, RH, lideranças e participantes.</p>

      <div class="steps steps-timeline">${metodoStepsHtml}</div>
    </section>

    <section id="entregaveis">
      <div class="eyebrow">Saídas do projeto</div>
      <h2>Entregáveis que apoiam decisão</h2>
      <p class="subheadline">O pacote de entregáveis traduz a avaliação em prioridades para o Comitê Executivo, RH e cada líder avaliado.</p>

      <div class="grid-2">${entregaveisCards}</div>

      ${
        d.ceo_rh_usos.length
          ? `<div class="box-navy" style="margin-top:20px"><h3>Como o CEO e o RH usam o resultado</h3><div class="chips">${ceoRhChips}</div></div>`
          : ""
      }
    </section>

    <section id="execucao">
      <div class="eyebrow">Execução</div>
      <h2>Governança, papéis e cronograma</h2>
      <p class="subheadline">Papéis de cada parte, jornada do participante e cronograma de referência para a execução do projeto.</p>

      <h3>Papéis no projeto</h3>
      <div class="grid-2">
        ${iconCard("solucao", "Kienbaum / Consultoria", d.papel_kienbaum_desc)}
        ${iconCard("contexto", `${d.empresa} / Cliente`, d.papel_cliente_desc)}
      </div>

      ${
        d.jornada.length
          ? `<h3 style="margin-top:24px">Jornada do participante</h3><div class="journey">${jornadaCards}</div>`
          : ""
      }

      <div class="box" style="margin-top:20px"><strong>Duração estimada:</strong> ${esc(d.duracao)}</div>

      <p class="footer-note"><strong>Atenção:</strong> Para reduzir a ansiedade e ruído interno, a comunicação deve explicar objetivo, critérios, participantes e próximos passos antes do início das avaliações, por isso reforçamos a importância da realização do kickoff antes do início de grandes projetos ou, pelo menos, a comunicação interna efetiva em projetos individuais.</p>
    </section>

    <section id="investimento">
      <div class="eyebrow">Escopo comercial</div>
      <h2>Investimento estimado e condições</h2>
      <p class="subheadline">Composição do investimento e condições comerciais para aprovação do escopo.</p>

      <div class="stat-hero">
        <div><div class="label">Valor total estimado do projeto</div><div class="value">${formatBRL(totalInvestimento)}</div></div>
        <div class="label">Escopo considerado: ${d.total_avaliados} profissional${d.total_avaliados === 1 ? "" : "is"} avaliado${d.total_avaliados === 1 ? "" : "s"}</div>
      </div>

      ${investimentoTabela}

      <h3 style="margin-top:28px">Condições comerciais</h3>
      ${condicoesCards}

      <div class="grid-2" style="margin-top:16px">
        <div class="box"><strong>Validade da proposta:</strong> ${esc(d.validade)}</div>
      </div>

      <p class="footer-note">
        Impostos, taxas e despesas de viagem, hospedagem, deslocamento, alimentação e eventuais traduções não estão incluídos.
        Despesas somente serão realizadas mediante aprovação prévia do cliente.
        ${d.observacoes ? `<br><br>${escNl(d.observacoes)}` : ""}
      </p>
    </section>

    ${
      d.incluir_quem_somos
        ? `<section id="quemsomos">
      <div class="eyebrow">Quem somos</div>
      <h2>80 anos desenvolvendo líderes que movem o futuro</h2>
      <p class="subheadline">Consultoria alemã fundada em 1945, referência em Executive Search e Leadership Advisory, com atuação global integrada entre RH e gestão de negócios.</p>

      <div class="grid-2">
        ${iconCard("resumo", "Origem", "Fundada em 1945 por Gerhard Kienbaum, na Alemanha — pioneira em Executive Search e Leadership Advisory no país.")}
        ${iconCard("solucao", "Presença global", "Presente em 4 continentes, 13 países e 24 escritórios, com atuação integrada entre unidades, padrão global e conhecimento local.")}
        ${iconCard("entregaveis", "Portfólio", "Executive Search, HR Consulting (Competence Check, Plano de Sucessão, Coaching Executivo, Redesenho Organizacional), Governança Empresarial e Familiar e Jornadas Master Leader.")}
        ${iconCard("contexto", "No Brasil", "Escritórios em São Paulo, Porto Alegre, Belo Horizonte, Jaraguá do Sul, Cuiabá e Campinas.")}
      </div>

      <div class="grid-4">
        <div class="stat-box"><div class="num">30 mil</div><div class="label">executivos avaliados pelo Competence Check</div></div>
        <div class="stat-box"><div class="num">+175</div><div class="label">clientes de diversos segmentos</div></div>
        <div class="stat-box"><div class="num">85</div><div class="label">consultores seniores e colaboradores</div></div>
        <div class="stat-box"><div class="num">+400</div><div class="label">participantes em 34 jornadas Master Leader</div></div>
      </div>
    </section>`
        : ""
    }

    <section id="fechamento">
      <div class="eyebrow">Fechamento executivo</div>
      <h2>Próximos passos e aprovação</h2>
      <p class="subheadline">A proposta está estruturada para uma decisão rápida: validar escopo, confirmar participantes e iniciar a comunicação do projeto.</p>

      ${
        d.proximos_passos
          ? `<h3>Próximos passos</h3><div class="box-white">${escNl(d.proximos_passos)}</div>`
          : ""
      }

      ${
        d.credenciais_todas.length
          ? `<h3 style="margin-top:28px">Alguns clientes atendidos</h3><div class="credenciais">${credenciaisCards}</div>`
          : ""
      }

      <div class="box-navy" style="margin-top:28px">
        <h3>Decisão requerida</h3>
        <p>${escNl(d.decisao_requerida)}</p>
      </div>

      <div class="signatures">
        <div class="line">${esc(d.empresa)}</div>
        <div class="line">Kienbaum / Consultoria</div>
      </div>

      ${d.aceite_digital ? `<p class="footer-note" style="margin-top:20px">Este documento requer aceite digital do cliente.</p>` : ""}
    </section>

  </main>
</div>
<script>
  (function () {
    // O iframe rola internamente (tem altura fixa da tela), então a
    // navegação usa a rolagem do próprio documento do iframe.
    document.querySelectorAll('.nav a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  })();
</script>
</body>
</html>`;
}
