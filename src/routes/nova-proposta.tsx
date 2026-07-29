import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { buildProposalHTML, type TituloDesc } from "@/lib/proposalTemplate";
import { buildSlug, buildEmailHTML } from "@/lib/proposalEmail";
import { montarDadosCompletos } from "@/lib/buildProposalData";
import { DEFAULT_LOGOS } from "@/lib/defaultLogos";
import { KienbaumLogo } from "@/components/KienbaumLogo";

export const Route = createFileRoute("/nova-proposta")({
  component: Wizard,
  validateSearch: (search: Record<string, unknown>) => ({
    slug: typeof search.slug === "string" ? search.slug : undefined,
    template: typeof search.template === "string" ? search.template : undefined,
  }),
});

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ModoInvestimento = "por_nivel" | "valor_total";

interface DadosProposta {
  codigo: string;
  data: string;
  empresa: string;
  interlocutor: string;
  cargo: string;
  area: string;
  setor: string;
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
  modo_investimento: ModoInvestimento;
  valor_alta: number;
  valor_media: number;
  valor_baixa: number;
  valor_total: number;
  nota_investimento: string;
  condicoes_pagamento: string;
  validade: string;
  credenciais: string[];
  credencial_extra: string;
  credenciais_logos: Record<string, string>;
  credencial_extra_logo: string;
  duracao: string;
  inicio: string;
  proximos_passos: string;
  decisao_requerida: string;
  observacoes: string;
  aceite_digital: boolean;
  incluir_quem_somos: boolean;
}

const SETORES = ["Saúde", "Financeiro/Cooperativo", "Varejo", "Indústria", "Tecnologia", "Educação", "Agronegócio", "Outro"];
const CONSULTORAS = ["Alessandra Lupo", "Priscila", "Freitas"];
const ENTREGAVEIS = ["Relatório individual", "Relatório consolidado", "PDI", "Mapa de sucessão", "Plano gerencial", "Feedback executivo"];
const INSTRUMENTOS = ["Entrevista estruturada", "Estudo de caso", "Pré-work completo", "OPQ32", "Simulação de liderança", "Heteropercepção"];
const CREDENCIAIS = [
  "Artecola",
  "Be8",
  "Bertolini",
  "Cenex",
  "Lojas Colombo",
  "Docile",
  "Edenred",
  "FCC",
  "Farmácias São João",
  "Genésio A. Mendes",
  "Gerdau",
  "Grupo Grazziotin",
  "Grupo RBS",
  "Grupo Sabemi",
  "Hertz Farmacêutica",
  "Imec Supermercados",
  "JTI",
  "Jost",
  "Ke-Ko",
  "Ma TV Sul",
  "Maqnelson Agro",
  "Marcopolo",
  "Medabil",
  "Nakata Automotiva",
  "Orquídea",
  "Palfinger",
  "Pisani",
  "Pompéia",
  "PUCRS",
  "Randoncorp",
  "SIM",
  "Sicoob",
  "Sicredi",
  "Silvestrin",
  "Simecs",
  "SLC Agrícola",
  "SLC Máquinas",
  "Soprano",
  "Stihl",
  "Supermercado Guanabara",
  "Todeschini",
  "Unicred",
  "Unimed",
  "Unique Rubber Technologies",
  "Universidade Feevale",
  "Vibra Foods",
];

// Setor de atuação de cada cliente do portfólio, usado no filtro da aba Fechamento.
const CREDENCIAL_SETOR: Record<string, string> = {
  Artecola: "Indústria",
  Be8: "Indústria",
  Bertolini: "Indústria",
  Cenex: "Educação",
  "Lojas Colombo": "Varejo",
  Docile: "Indústria",
  Edenred: "Financeiro/Cooperativo",
  FCC: "Outro",
  "Farmácias São João": "Saúde",
  "Genésio A. Mendes": "Indústria",
  Gerdau: "Indústria",
  "Grupo Grazziotin": "Varejo",
  "Grupo RBS": "Outro",
  "Grupo Sabemi": "Financeiro/Cooperativo",
  "Hertz Farmacêutica": "Saúde",
  "Imec Supermercados": "Varejo",
  JTI: "Indústria",
  Jost: "Indústria",
  "Ke-Ko": "Indústria",
  "Ma TV Sul": "Outro",
  "Maqnelson Agro": "Agronegócio",
  Marcopolo: "Indústria",
  Medabil: "Indústria",
  "Nakata Automotiva": "Indústria",
  Orquídea: "Indústria",
  Palfinger: "Indústria",
  Pisani: "Indústria",
  Pompéia: "Varejo",
  PUCRS: "Educação",
  Randoncorp: "Indústria",
  SIM: "Outro",
  Sicoob: "Financeiro/Cooperativo",
  Sicredi: "Financeiro/Cooperativo",
  Silvestrin: "Indústria",
  Simecs: "Indústria",
  "SLC Agrícola": "Agronegócio",
  "SLC Máquinas": "Agronegócio",
  Soprano: "Indústria",
  Stihl: "Indústria",
  "Supermercado Guanabara": "Varejo",
  Todeschini: "Indústria",
  Unicred: "Financeiro/Cooperativo",
  Unimed: "Saúde",
  "Unique Rubber Technologies": "Indústria",
  "Universidade Feevale": "Educação",
  "Vibra Foods": "Indústria",
};

const CONDICOES_PGTO = ["1/3 + 1/3 + 1/3", "50% + 50%", "À vista", "Personalizado"];
const DURACOES = ["4 semanas", "6 semanas", "8 semanas", "12 semanas", "Personalizado"];
const JORNADA_OPCOES = ["Kick-off", "Pré-work", "Convite", "Avaliação", "Relatório", "Feedback"];

// O menu do wizard espelha exatamente o menu lateral da proposta gerada:
// cada aba contém os campos editáveis daquela página específica.
const ETAPAS = [
  "Resumo Executivo",
  "Contexto",
  "Solução",
  "Método",
  "Entregáveis",
  "Execução",
  "Investimento",
  "Quem Somos",
  "Fechamento",
];

const NOSSO_ENTENDIMENTO_PADRAO: TituloDesc[] = [
  { titulo: "Clareza sobre liderança", descricao: "Mapear nível atual de domínio das competências críticas e o potencial de evolução de cada gestor." },
  { titulo: "Decisões com evidência", descricao: "Apoiar movimentações, prioridades de desenvolvimento e sucessão com dados estruturados." },
  { titulo: "Desenvolvimento objetivo", descricao: "Traduzir gaps em Planos de Desenvolvimento Individual conectados ao negócio." },
  { titulo: "Continuidade e sucessão", descricao: "Identificar talentos, riscos de prontidão e alternativas para posições estratégicas." },
];

const PERGUNTAS_PADRAO = [
  "Quais competências precisam ser priorizadas no ciclo atual?",
  "Quais líderes estão prontos para maior complexidade?",
  "Onde existem riscos de sucessão ou baixa prontidão?",
  "Que ações de desenvolvimento trarão maior impacto?",
];

const CEO_RH_USOS_PADRAO = ["priorizar desenvolvimento", "calibrar talentos", "planejar sucessão", "mitigar riscos de liderança"];

const METODO_ETAPAS_PADRAO: TituloDesc[] = [
  { titulo: "Kick-off executivo", descricao: "Alinhamento de objetivos, escopo, governança e critérios de sucesso." },
  { titulo: "Perfil de competências", descricao: "Revisão do modelo de competências, níveis esperados e targets por papel." },
  { titulo: "Participantes e comunicação", descricao: "Definição do público, mensagens-chave, agenda e orientação aos envolvidos." },
  { titulo: "Instrumentos de avaliação", descricao: "Roteiros de entrevista, estudos de caso e materiais customizados ao contexto." },
  { titulo: "Avaliação individual", descricao: "Entrevistas estruturadas, estudos de caso e análise dos dados por consultores seniores." },
  { titulo: "Consolidação e calibragem", descricao: "Relatórios individuais, visão consolidada e discussão de pontos críticos com a liderança." },
  { titulo: "Resultados, feedback e PDI", descricao: "Apresentação executiva, devolutivas e construção dos planos de desenvolvimento." },
];

const DECISAO_REQUERIDA_PADRAO =
  "Aprovação do escopo e condições comerciais.\n\nApós a aprovação do projeto, daremos início às reuniões de alinhamento.";

// Campos que sempre precisam ser revisados ao usar uma proposta como modelo:
// número da proposta, dados do cliente, quantidade de avaliados e investimento.
const CAMPOS_OBRIGATORIOS_VAZIOS: Partial<DadosProposta> = {
  codigo: "",
  data: new Date().toISOString().slice(0, 10),
  empresa: "",
  interlocutor: "",
  cargo: "",
  area: "",
  qtd_alta: 0,
  qtd_media: 0,
  qtd_baixa: 0,
  valor_alta: 0,
  valor_media: 0,
  valor_baixa: 0,
  valor_total: 0,
};

function validarAvanco(etapaAtual: number, d: DadosProposta): string | null {
  if (etapaAtual === 5 && !d.inicio) {
    return "Defina o início previsto antes de avançar.";
  }
  return null;
}

function validarGeracao(d: DadosProposta): string | null {
  if (d.credenciais.length === 0) {
    return "Selecione ao menos um cliente do portfólio antes de gerar a proposta.";
  }
  return null;
}

// -----------------------------------------------------------------------------
// Style helpers (flat, corporate, 0.5px borders, radius <= 4)
// -----------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  border: "0.5px solid #D8D6D2",
  borderRadius: 4,
  padding: "8px 10px",
  fontSize: 13,
  color: "#28434F",
  width: "100%",
  fontFamily: "inherit",
  backgroundColor: "#FFFFFF",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "#726C68",
  textTransform: "uppercase",
  letterSpacing: 0.4,
  marginBottom: 6,
  display: "block",
};

function Field({ label, children, alerta }: { label: string; children: React.ReactNode; alerta?: boolean }) {
  return (
    <div>
      <label style={{ ...labelStyle, color: alerta ? "#B00020" : labelStyle.color }}>
        {label}
        {alerta ? " *" : ""}
      </label>
      {children}
    </div>
  );
}

function inputStyleAlerta(vazio: boolean): React.CSSProperties {
  return vazio ? { ...inputStyle, borderColor: "#B00020" } : inputStyle;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

// -----------------------------------------------------------------------------
// Wizard
// -----------------------------------------------------------------------------

function Wizard() {
  const { signOut } = useAuth();
  const { slug: editSlug, template: templateSlug } = Route.useSearch();
  const [etapa, setEtapa] = useState(0);
  const [gerando, setGerando] = useState(false);
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const [emailCopiado, setEmailCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [carregandoEdicao, setCarregandoEdicao] = useState(!!editSlug || !!templateSlug);

  const [d, setD] = useState<DadosProposta>({
    codigo: "",
    data: new Date().toISOString().slice(0, 10),
    empresa: "",
    interlocutor: "",
    cargo: "",
    area: "",
    setor: "",
    consultora: CONSULTORAS[0],
    contexto: "",
    objetivo: "",
    publico_alvo: "",
    qtd_alta: 0,
    qtd_media: 0,
    qtd_baixa: 0,
    entregaveis: [...ENTREGAVEIS],
    instrumentos: ["Pré-work completo"],
    jornada: ["Convite", "Avaliação", "Relatório", "Feedback"],
    nosso_entendimento: NOSSO_ENTENDIMENTO_PADRAO,
    perguntas: PERGUNTAS_PADRAO,
    ceo_rh_usos: CEO_RH_USOS_PADRAO,
    papel_kienbaum_desc: "Condução metodológica, entrevistas, estudos de caso, análises, relatórios, consolidação executiva e devolutivas.",
    papel_cliente_desc: "Validação do sponsor, lista de participantes, agenda, comunicação interna e alinhamento dos critérios de competências.",
    metodo_etapas: METODO_ETAPAS_PADRAO,
    modo_investimento: "por_nivel",
    valor_alta: 0,
    valor_media: 0,
    valor_baixa: 0,
    valor_total: 0,
    nota_investimento: "",
    condicoes_pagamento: CONDICOES_PGTO[0],
    validade: "7 dias",
    credenciais: [],
    credencial_extra: "",
    credenciais_logos: {},
    credencial_extra_logo: "",
    duracao: DURACOES[0],
    inicio: "",
    proximos_passos: "",
    decisao_requerida: DECISAO_REQUERIDA_PADRAO,
    observacoes: "",
    aceite_digital: true,
    incluir_quem_somos: true,
  });

  useEffect(() => {
    if (!editSlug) return;
    supabase
      .from("propostas")
      .select("id, dados_json")
      .eq("slug", editSlug)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setD((prev) => ({ ...prev, ...(data.dados_json as Partial<DadosProposta>) }));
          setEditingId(data.id as string);
        } else {
          setErro("Não foi possível carregar a proposta para edição.");
        }
        setCarregandoEdicao(false);
      });
  }, [editSlug]);

  useEffect(() => {
    if (!templateSlug) return;
    supabase
      .from("propostas")
      .select("dados_json")
      .eq("slug", templateSlug)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setD((prev) => ({
            ...prev,
            ...(data.dados_json as Partial<DadosProposta>),
            ...CAMPOS_OBRIGATORIOS_VAZIOS,
          }));
        } else {
          setErro("Não foi possível carregar o modelo.");
        }
        setCarregandoEdicao(false);
      });
  }, [templateSlug]);

  const totalAvaliados = d.qtd_alta + d.qtd_media + d.qtd_baixa;
  const subtotalPorNivel = useMemo(
    () => d.qtd_alta * d.valor_alta + d.qtd_media * d.valor_media + d.qtd_baixa * d.valor_baixa,
    [d.qtd_alta, d.qtd_media, d.qtd_baixa, d.valor_alta, d.valor_media, d.valor_baixa],
  );

  function up<K extends keyof DadosProposta>(k: K, v: DadosProposta[K]) {
    setD((prev) => ({ ...prev, [k]: v }));
  }

  function toggleArr(k: "entregaveis" | "instrumentos" | "credenciais", value: string) {
    setD((prev) => ({
      ...prev,
      [k]: prev[k].includes(value) ? prev[k].filter((v) => v !== value) : [...prev[k], value],
    }));
  }

  async function handleGerar() {
    const validacao = validarGeracao(d);
    if (validacao) {
      setErro(validacao);
      return;
    }
    setGerando(true);
    setErro(null);
    try {
      const html = buildProposalHTML(montarDadosCompletos(d));

      if (editingId) {
        const { error } = await supabase
          .from("propostas")
          .update({
            codigo: d.codigo,
            dados_json: d as unknown as never,
            html_gerado: html,
            consultora: d.consultora,
            empresa: d.empresa,
          })
          .eq("id", editingId);
        if (error) throw error;

        const { data: row, error: fetchError } = await supabase
          .from("propostas")
          .select("slug")
          .eq("id", editingId)
          .single();
        if (fetchError) throw fetchError;
        setLinkGerado(`${window.location.origin}/proposta/${row.slug}`);
      } else {
        const slug = buildSlug(d.codigo, d.data, d.empresa);
        const { error } = await supabase.from("propostas").insert({
          slug,
          codigo: d.codigo,
          dados_json: d as unknown as never,
          html_gerado: html,
          consultora: d.consultora,
          empresa: d.empresa,
          status: "enviada",
        });

        if (error) throw error;
        setLinkGerado(`${window.location.origin}/proposta/${slug}`);
      }
    } catch (e: any) {
      if (e.message?.includes("propostas_slug_key")) {
        setErro(
          "Já existe uma proposta com esse código para essa empresa e ano. Altere o código da proposta (ou a data) e gere novamente."
        );
      } else {
        setErro(e.message ?? "Erro ao gerar proposta");
      }
    } finally {
      setGerando(false);
    }
  }

  async function logout() {
    await signOut();
  }

  async function copiarEmailHtml() {
    if (!linkGerado) return;
    const html = buildEmailHTML({
      interlocutor: d.interlocutor,
      empresa: d.empresa,
      consultora: d.consultora,
      link: linkGerado,
    });
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([`Acessar Proposta de Competence Check: ${linkGerado}`], { type: "text/plain" }),
        }),
      ]);
      setEmailCopiado(true);
      setTimeout(() => setEmailCopiado(false), 3000);
    } catch {
      window.alert("Não foi possível copiar automaticamente. Selecione o texto da prévia abaixo e copie manualmente.");
    }
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: "#F7F6F4", color: "#28434F" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col"
        style={{ width: 188, backgroundColor: "#28434F", color: "white", flexShrink: 0 }}
      >
        <div style={{ padding: 20, borderBottom: "0.5px solid rgba(255,255,255,0.15)" }}>
          <div style={{ marginBottom: 12 }}><KienbaumLogo height={22} /></div>
          <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>Gerador de Proposta de Competence Check</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {ETAPAS.map((e, i) => {
            const ativo = i === etapa;
            return (
              <button
                key={e}
                onClick={() => {
                  setErro(null);
                  setEtapa(i);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "10px 20px",
                  gap: 10,
                  color: ativo ? "white" : "rgba(255,255,255,0.65)",
                  fontSize: 12,
                  fontWeight: ativo ? 500 : 400,
                  textAlign: "left",
                  borderLeft: ativo ? "2px solid #5B80A3" : "2px solid transparent",
                  backgroundColor: ativo ? "rgba(91,128,163,0.15)" : "transparent",
                }}
              >
                <span style={{ opacity: 0.6 }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{e}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 20, borderTop: "0.5px solid rgba(255,255,255,0.15)", fontSize: 10, opacity: 0.6 }}>
          <Link
            to="/"
            style={{ display: "block", marginBottom: 8, fontSize: 10, color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}
          >
            ← Voltar ao Hub
          </Link>
          Desenvolvido por Sawitzki Consultoria
          <Link
            to="/propostas"
            style={{ display: "block", marginTop: 12, fontSize: 10, color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}
          >
            Ver propostas salvas
          </Link>
          <button
            onClick={logout}
            style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: "32px 48px", maxWidth: 900 }}>
        {carregandoEdicao ? (
          <p style={{ fontSize: 13, color: "#726C68" }}>Carregando proposta...</p>
        ) : (
        <>
        <div style={{ marginBottom: 24 }}>
          {editingId && (
            <div style={{ fontSize: 11, color: "#5B80A3", fontWeight: 600, marginBottom: 4 }}>
              Editando proposta existente
            </div>
          )}
          <div style={{ fontSize: 11, color: "#726C68", fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase" }}>
            Etapa {etapa + 1} de {ETAPAS.length}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{ETAPAS[etapa]}</h1>
        </div>

        <div
          style={{
            backgroundColor: "white",
            border: "0.5px solid #D8D6D2",
            borderRadius: 4,
            padding: 28,
          }}
        >
          {etapa === 0 && <StepResumo d={d} up={up} />}
          {etapa === 1 && <StepContexto d={d} up={up} />}
          {etapa === 2 && <StepSolucao />}
          {etapa === 3 && <StepMetodo d={d} up={up} toggleArr={toggleArr} />}
          {etapa === 4 && <StepEntregaveis d={d} up={up} toggleArr={toggleArr} />}
          {etapa === 5 && <StepExecucao d={d} up={up} />}
          {etapa === 6 && <StepInvestimento d={d} up={up} subtotal={subtotalPorNivel} totalAvaliados={totalAvaliados} />}
          {etapa === 7 && <StepQuemSomos d={d} up={up} />}
          {etapa === 8 && <StepFechamento d={d} up={up} toggleArr={toggleArr} />}
        </div>

        {/* Nav footer */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={() => {
              setErro(null);
              setEtapa((e) => Math.max(0, e - 1));
            }}
            disabled={etapa === 0}
            style={{
              padding: "10px 20px",
              border: "0.5px solid #D8D6D2",
              borderRadius: 4,
              backgroundColor: "white",
              color: "#28434F",
              fontSize: 13,
              fontWeight: 500,
              opacity: etapa === 0 ? 0.4 : 1,
            }}
          >
            Voltar
          </button>
          {etapa < ETAPAS.length - 1 ? (
            <button
              onClick={() => {
                const validacao = validarAvanco(etapa, d);
                if (validacao) {
                  setErro(validacao);
                  return;
                }
                setErro(null);
                setEtapa((e) => Math.min(ETAPAS.length - 1, e + 1));
              }}
              style={{
                padding: "10px 20px",
                border: "0.5px solid #5B80A3",
                borderRadius: 4,
                backgroundColor: "#5B80A3",
                color: "white",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Próxima etapa
            </button>
          ) : (
            <button
              onClick={handleGerar}
              disabled={gerando}
              style={{
                padding: "10px 20px",
                border: "0.5px solid #28434F",
                borderRadius: 4,
                backgroundColor: "#28434F",
                color: "white",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {gerando ? "Gerando..." : "Gerar proposta"}
            </button>
          )}
        </div>

        {erro && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: "0.5px solid #B00020",
              borderRadius: 4,
              color: "#B00020",
              fontSize: 12,
              backgroundColor: "white",
            }}
          >
            {erro}
          </div>
        )}

        {linkGerado && (
          <div
            style={{
              marginTop: 16,
              padding: 20,
              border: "0.5px solid #5B80A3",
              borderRadius: 4,
              backgroundColor: "white",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 500, color: "#726C68", textTransform: "uppercase", letterSpacing: 0.4 }}>
              Proposta gerada
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <input readOnly value={linkGerado} style={inputStyle} />
              <button
                onClick={() => navigator.clipboard.writeText(linkGerado)}
                style={{
                  padding: "8px 14px",
                  border: "0.5px solid #5B80A3",
                  borderRadius: 4,
                  backgroundColor: "#5B80A3",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Copiar
              </button>
              <a
                href={linkGerado}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 14px",
                  border: "0.5px solid #28434F",
                  borderRadius: 4,
                  color: "#28434F",
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Abrir
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  `Proposta comercial - ${d.empresa}`,
                )}&body=${encodeURIComponent(
                  `Olá ${d.interlocutor},\n\nSegue o link da proposta comercial:\n${linkGerado}\n\nAtenciosamente,\n${d.consultora}`,
                )}`}
                style={{
                  padding: "8px 14px",
                  border: "0.5px solid #D8D6D2",
                  borderRadius: 4,
                  color: "#28434F",
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Enviar por e-mail
              </a>
            </div>

            <div style={{ marginTop: 20, borderTop: "0.5px solid #D8D6D2", paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#726C68", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  E-mail pronto para enviar
                </div>
                <button
                  onClick={copiarEmailHtml}
                  style={{
                    padding: "8px 14px",
                    border: "0.5px solid #5B80A3",
                    borderRadius: 4,
                    backgroundColor: "#5B80A3",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {emailCopiado ? "Copiado!" : "Copiar e-mail"}
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#726C68", marginBottom: 10 }}>
                Clique em "Copiar e-mail" e cole (Ctrl+V) diretamente no corpo de um e-mail novo no Outlook — o botão e a
                formatação vêm junto.
              </p>
              <div
                style={{ border: "0.5px solid #D8D6D2", borderRadius: 4, padding: 20, backgroundColor: "#F7F6F4" }}
                dangerouslySetInnerHTML={{
                  __html: buildEmailHTML({
                    interlocutor: d.interlocutor,
                    empresa: d.empresa,
                    consultora: d.consultora,
                    link: linkGerado,
                  }),
                }}
              />
            </div>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Steps (uma aba por página da proposta gerada)
// -----------------------------------------------------------------------------

type UpFn = <K extends keyof DadosProposta>(k: K, v: DadosProposta[K]) => void;
type ToggleArrFn = (k: "entregaveis" | "instrumentos" | "credenciais", v: string) => void;

function StepResumo({ d, up }: { d: DadosProposta; up: UpFn }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Field label="Código da proposta" alerta={!d.codigo}>
          <input
            style={inputStyleAlerta(!d.codigo)}
            placeholder="Gerado no Monday"
            value={d.codigo}
            onChange={(e) => up("codigo", e.target.value)}
          />
        </Field>
        <Field label="Data">
          <input type="date" style={inputStyle} value={d.data} onChange={(e) => up("data", e.target.value)} />
        </Field>
        <Field label="Consultora responsável">
          <select style={inputStyle} value={d.consultora} onChange={(e) => up("consultora", e.target.value)}>
            {CONSULTORAS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Field label="Nome da empresa" alerta={!d.empresa}>
          <input style={inputStyleAlerta(!d.empresa)} value={d.empresa} onChange={(e) => up("empresa", e.target.value)} />
        </Field>
        <Field label="Nome do interlocutor" alerta={!d.interlocutor}>
          <input style={inputStyleAlerta(!d.interlocutor)} value={d.interlocutor} onChange={(e) => up("interlocutor", e.target.value)} />
        </Field>
        <Field label="Cargo" alerta={!d.cargo}>
          <input style={inputStyleAlerta(!d.cargo)} value={d.cargo} onChange={(e) => up("cargo", e.target.value)} />
        </Field>
        <Field label="Área ou departamento" alerta={!d.area}>
          <input style={inputStyleAlerta(!d.area)} value={d.area} onChange={(e) => up("area", e.target.value)} />
        </Field>
      </div>
      <Field label="Objetivo do projeto" alerta={!d.objetivo}>
        <textarea
          rows={4}
          style={inputStyleAlerta(!d.objetivo)}
          value={d.objetivo}
          onChange={(e) => up("objetivo", e.target.value)}
        />
      </Field>
    </div>
  );
}

function StepContexto({ d, up }: { d: DadosProposta; up: UpFn }) {
  return (
    <div className="space-y-5">
      <Field label="Contexto do cliente" alerta={!d.contexto}>
        <textarea
          rows={5}
          style={inputStyleAlerta(!d.contexto)}
          value={d.contexto}
          onChange={(e) => up("contexto", e.target.value)}
        />
      </Field>
      <Field label="Público-alvo da avaliação" alerta={!d.publico_alvo}>
        <input style={inputStyleAlerta(!d.publico_alvo)} value={d.publico_alvo} onChange={(e) => up("publico_alvo", e.target.value)} />
      </Field>
      <EditableCardList label="Nosso entendimento" items={d.nosso_entendimento} onChange={(v) => up("nosso_entendimento", v)} />
      <EditableList label="Perguntas que o projeto responde" items={d.perguntas} onChange={(v) => up("perguntas", v)} />
    </div>
  );
}

function StepSolucao() {
  return (
    <p style={{ fontSize: 13, color: "#726C68" }}>
      Esta página usa conteúdo padrão da Kienbaum ("Resultados esperados" e "Dimensões avaliadas") e não tem campos
      editáveis por proposta.
    </p>
  );
}

function StepMetodo({ d, up, toggleArr }: { d: DadosProposta; up: UpFn; toggleArr: ToggleArrFn }) {
  return (
    <div className="space-y-6">
      <EditableCardList label="Etapas do método" items={d.metodo_etapas} onChange={(v) => up("metodo_etapas", v)} />
      <div>
        <CheckList label="Instrumentos" options={INSTRUMENTOS} selected={d.instrumentos} onToggle={(v) => toggleArr("instrumentos", v)} />
        <div style={{ fontSize: 11, color: "#B00020", marginTop: 8 }}>Lembre-se de revisar</div>
      </div>
    </div>
  );
}

function StepEntregaveis({ d, up, toggleArr }: { d: DadosProposta; up: UpFn; toggleArr: ToggleArrFn }) {
  return (
    <div className="space-y-6">
      <div>
        <CheckList label="Entregáveis" options={ENTREGAVEIS} selected={d.entregaveis} onToggle={(v) => toggleArr("entregaveis", v)} />
        <div style={{ fontSize: 11, color: "#B00020", marginTop: 8 }}>Lembre-se de revisar</div>
      </div>
      <EditableList label="Como o CEO e o RH usam o resultado" items={d.ceo_rh_usos} onChange={(v) => up("ceo_rh_usos", v)} />
    </div>
  );
}

function StepExecucao({ d, up }: { d: DadosProposta; up: UpFn }) {
  return (
    <div className="space-y-6">
      <Field label="Papel da Kienbaum / Consultoria">
        <textarea
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
          value={d.papel_kienbaum_desc}
          onChange={(e) => up("papel_kienbaum_desc", e.target.value)}
        />
      </Field>
      <Field label="Papel do cliente">
        <textarea
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
          value={d.papel_cliente_desc}
          onChange={(e) => up("papel_cliente_desc", e.target.value)}
        />
      </Field>
      <ReorderableList
        label="Jornada do participante"
        items={d.jornada}
        onChange={(v) => up("jornada", v)}
        placeholder="Ex: Kick-off, Convite, Avaliação..."
      />
      <div className="grid grid-cols-2 gap-5">
        <Field label="Duração estimada">
          {(() => {
            const opcoesFixas = DURACOES.filter((v) => v !== "Personalizado");
            const isPersonalizado = !opcoesFixas.includes(d.duracao);
            return (
              <>
                <select
                  style={inputStyle}
                  value={isPersonalizado ? "Personalizado" : d.duracao}
                  onChange={(e) => up("duracao", e.target.value === "Personalizado" ? "" : e.target.value)}
                >
                  {DURACOES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                {isPersonalizado && (
                  <input
                    style={{ ...inputStyle, marginTop: 8 }}
                    placeholder="Ex: 10 semanas"
                    value={d.duracao}
                    onChange={(e) => up("duracao", e.target.value)}
                  />
                )}
              </>
            );
          })()}
          <div style={{ fontSize: 11, color: "#B00020", marginTop: 6 }}>Lembre-se de revisar</div>
        </Field>
        <Field label="Início previsto" alerta={!d.inicio}>
          <input
            type="date"
            style={inputStyleAlerta(!d.inicio)}
            value={d.inicio}
            onChange={(e) => up("inicio", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function StepQuemSomos({ d, up }: { d: DadosProposta; up: UpFn }) {
  return (
    <Field label="Incluir apresentação sobre a Kienbaum?">
      <div style={{ display: "flex", gap: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input
            type="radio"
            name="incluir_quem_somos"
            checked={d.incluir_quem_somos}
            onChange={() => up("incluir_quem_somos", true)}
          />
          Sim
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input
            type="radio"
            name="incluir_quem_somos"
            checked={!d.incluir_quem_somos}
            onChange={() => up("incluir_quem_somos", false)}
          />
          Não
        </label>
      </div>
      <p style={{ fontSize: 11, color: "#726C68", marginTop: 8 }}>
        Para clientes que já conhecem bem a Kienbaum, essa página pode ser dispensada.
      </p>
    </Field>
  );
}

function CheckList({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <label
              key={o}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                border: "0.5px solid #D8D6D2",
                borderRadius: 4,
                fontSize: 12,
                cursor: "pointer",
                backgroundColor: on ? "rgba(91,128,163,0.08)" : "white",
                borderColor: on ? "#5B80A3" : "#D8D6D2",
              }}
            >
              <input type="checkbox" checked={on} onChange={() => onToggle(o)} />
              <span>{o}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function EditableList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            style={inputStyle}
            placeholder={placeholder}
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            style={{ padding: "0 12px", border: "0.5px solid #D8D6D2", borderRadius: 4, color: "#B00020", fontSize: 14 }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        style={{ fontSize: 12, color: "#5B80A3", fontWeight: 500 }}
      >
        + Adicionar item
      </button>
    </div>
  );
}

function ReorderableList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  function mover(i: number, direcao: -1 | 1) {
    const j = i + direcao;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <p style={{ fontSize: 11, color: "#726C68", marginTop: -2, marginBottom: 8 }}>
        A ordem aqui é a ordem em que as etapas aparecem na proposta.
      </p>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#5B80A3",
              color: "white",
              fontSize: 11,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {i + 1}
          </span>
          <input
            style={inputStyle}
            placeholder={placeholder}
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => mover(i, -1)}
            disabled={i === 0}
            style={{ padding: "0 8px", border: "0.5px solid #D8D6D2", borderRadius: 4, color: "#28434F", fontSize: 12, opacity: i === 0 ? 0.3 : 1 }}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => mover(i, 1)}
            disabled={i === items.length - 1}
            style={{ padding: "0 8px", border: "0.5px solid #D8D6D2", borderRadius: 4, color: "#28434F", fontSize: 12, opacity: i === items.length - 1 ? 0.3 : 1 }}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            style={{ padding: "0 12px", border: "0.5px solid #D8D6D2", borderRadius: 4, color: "#B00020", fontSize: 14 }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        style={{ fontSize: 12, color: "#5B80A3", fontWeight: 500 }}
      >
        + Adicionar etapa
      </button>
    </div>
  );
}

function EditableCardList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: TituloDesc[];
  onChange: (items: TituloDesc[]) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {items.map((item, i) => (
        <div key={i} style={{ border: "0.5px solid #D8D6D2", borderRadius: 4, padding: 12, marginBottom: 8 }}>
          <input
            style={{ ...inputStyle, marginBottom: 8, fontWeight: 600 }}
            placeholder="Título"
            value={item.titulo}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], titulo: e.target.value };
              onChange(next);
            }}
          />
          <textarea
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Descrição"
            value={item.descricao}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], descricao: e.target.value };
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            style={{ marginTop: 8, fontSize: 11, color: "#B00020" }}
          >
            Remover
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { titulo: "", descricao: "" }])}
        style={{ fontSize: 12, color: "#5B80A3", fontWeight: 500 }}
      >
        + Adicionar item
      </button>
    </div>
  );
}

function StepInvestimento({
  d,
  up,
  subtotal,
  totalAvaliados,
}: {
  d: DadosProposta;
  up: UpFn;
  subtotal: number;
  totalAvaliados: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Quantidade por nível</div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Diretoria / Executivos">
            <input
              type="number"
              min={0}
              style={inputStyle}
              value={d.qtd_alta}
              onChange={(e) => up("qtd_alta", parseInt(e.target.value) || 0)}
            />
            <div style={{ fontSize: 10, color: "#726C68", marginTop: 4 }}>CEOs, CFOs, CTOs, Diretores</div>
          </Field>
          <Field label="Liderança média">
            <input
              type="number"
              min={0}
              style={inputStyle}
              value={d.qtd_media}
              onChange={(e) => up("qtd_media", parseInt(e.target.value) || 0)}
            />
            <div style={{ fontSize: 10, color: "#726C68", marginTop: 4 }}>Gerentes Sênior, Gerentes</div>
          </Field>
          <Field label="Liderança inicial">
            <input
              type="number"
              min={0}
              style={inputStyle}
              value={d.qtd_baixa}
              onChange={(e) => up("qtd_baixa", parseInt(e.target.value) || 0)}
            />
            <div style={{ fontSize: 10, color: "#726C68", marginTop: 4 }}>Coordenadores, Supervisores</div>
          </Field>
        </div>
        <div
          style={{
            marginTop: 12,
            padding: 10,
            border: "0.5px solid " + (totalAvaliados === 0 ? "#B00020" : "#D8D6D2"),
            borderRadius: 4,
            fontSize: 12,
            color: totalAvaliados === 0 ? "#B00020" : "#28434F",
          }}
        >
          Total de avaliados: <strong>{totalAvaliados}</strong>
          {totalAvaliados === 0 ? " — preencha ao menos um nível" : ""}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {(["por_nivel", "valor_total"] as ModoInvestimento[]).map((m) => {
          const on = d.modo_investimento === m;
          return (
            <button
              key={m}
              onClick={() => up("modo_investimento", m)}
              style={{
                flex: 1,
                padding: "10px",
                border: "0.5px solid " + (on ? "#5B80A3" : "#D8D6D2"),
                borderRadius: 4,
                backgroundColor: on ? "#5B80A3" : "white",
                color: on ? "white" : "#28434F",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {m === "por_nivel" ? "Por nível de liderança" : "Valor total do projeto"}
            </button>
          );
        })}
      </div>

      {d.modo_investimento === "por_nivel" ? (
        <div style={{ border: "0.5px solid #D8D6D2", borderRadius: 4, overflow: "hidden" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F7F6F4" }}>
                <th style={thStyle}>Nível</th>
                <th style={thStyle}>Qtd</th>
                <th style={thStyle}>Valor unitário (R$)</th>
                <th style={thStyle}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {[
                { nome: "Diretoria / Executivos", q: d.qtd_alta, vk: "valor_alta" as const },
                { nome: "Liderança média", q: d.qtd_media, vk: "valor_media" as const },
                { nome: "Liderança inicial", q: d.qtd_baixa, vk: "valor_baixa" as const },
              ].map((row) => (
                <tr key={row.nome} style={{ borderTop: "0.5px solid #D8D6D2" }}>
                  <td style={tdStyle}>{row.nome}</td>
                  <td style={tdStyle}>{row.q}</td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      style={{ ...inputStyle, padding: "6px 8px" }}
                      value={d[row.vk]}
                      onChange={(e) => up(row.vk, parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td style={tdStyle}>{formatBRL(row.q * d[row.vk])}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "0.5px solid #D8D6D2", backgroundColor: "#F7F6F4" }}>
                <td style={{ ...tdStyle, fontWeight: 600, color: subtotal === 0 ? "#B00020" : undefined }} colSpan={3}>
                  Total{subtotal === 0 ? " — preencha os valores" : ""}
                </td>
                <td style={{ ...tdStyle, fontWeight: 600, color: subtotal === 0 ? "#B00020" : undefined }}>{formatBRL(subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Valor total do projeto (R$)" alerta={d.valor_total === 0}>
            <input
              type="number"
              min={0}
              step={0.01}
              style={inputStyleAlerta(d.valor_total === 0)}
              value={d.valor_total}
              onChange={(e) => up("valor_total", parseFloat(e.target.value) || 0)}
            />
            <div style={{ fontSize: 11, color: "#726C68", marginTop: 6 }}>
              {formatBRL(d.valor_total)}
            </div>
          </Field>
          <Field label="Nota explicativa (opcional)">
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              value={d.nota_investimento}
              onChange={(e) => up("nota_investimento", e.target.value)}
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <Field label="Condições de pagamento">
          {(() => {
            const opcoesFixas = CONDICOES_PGTO.filter((v) => v !== "Personalizado");
            const isPersonalizado = !opcoesFixas.includes(d.condicoes_pagamento);
            return (
              <>
                <select
                  style={inputStyle}
                  value={isPersonalizado ? "Personalizado" : d.condicoes_pagamento}
                  onChange={(e) => up("condicoes_pagamento", e.target.value === "Personalizado" ? "" : e.target.value)}
                >
                  {CONDICOES_PGTO.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {isPersonalizado && (
                  <input
                    style={{ ...inputStyle, marginTop: 8 }}
                    placeholder="Ex: 30% + 30% + 40%"
                    value={d.condicoes_pagamento}
                    onChange={(e) => up("condicoes_pagamento", e.target.value)}
                  />
                )}
              </>
            );
          })()}
        </Field>
        <Field label="Validade da proposta">
          <input
            style={inputStyle}
            placeholder="Ex: 7 dias, 30 dias"
            value={d.validade}
            onChange={(e) => up("validade", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Observações">
        <textarea
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
          value={d.observacoes}
          onChange={(e) => up("observacoes", e.target.value)}
        />
      </Field>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 500,
  color: "#726C68",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};
const tdStyle: React.CSSProperties = { padding: "10px 12px", fontSize: 12 };

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function pdfToPngDataUrl(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d")!, viewport, canvas }).promise;
  return canvas.toDataURL("image/png");
}

function LogoUpload({ dataUrl, onChange }: { dataUrl: string | undefined; onChange: (dataUrl: string) => void }) {
  const [convertendo, setConvertendo] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
      {dataUrl && <img src={dataUrl} alt="logo" style={{ height: 24, maxWidth: 80, objectFit: "contain" }} />}
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,application/pdf"
        style={{ fontSize: 10 }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setConvertendo(true);
          try {
            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
            onChange(isPdf ? await pdfToPngDataUrl(file) : await readFileAsDataURL(file));
          } catch {
            window.alert("Não foi possível ler o arquivo. Tente outro PNG, JPG ou PDF.");
          } finally {
            setConvertendo(false);
          }
        }}
      />
      {convertendo && <span style={{ fontSize: 10, color: "#726C68" }}>Convertendo...</span>}
    </div>
  );
}

function StepFechamento({ d, up, toggleArr }: { d: DadosProposta; up: UpFn; toggleArr: ToggleArrFn }) {
  const [filtro, setFiltro] = useState("Todos");
  return (
    <div className="space-y-6">
      <Field label="Próximos passos após aprovação" alerta={!d.proximos_passos}>
        <textarea
          rows={3}
          style={inputStyleAlerta(!d.proximos_passos)}
          placeholder="Ex: Validar escopo, revisar competências, iniciar execução..."
          value={d.proximos_passos}
          onChange={(e) => up("proximos_passos", e.target.value)}
        />
      </Field>

      <Field label="Decisão requerida">
        <textarea
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          value={d.decisao_requerida}
          onChange={(e) => up("decisao_requerida", e.target.value)}
        />
      </Field>

      <div>
        <Field label="Filtrar por setor">
          <select style={inputStyle} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option>Todos</option>
            {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: d.credenciais.length === 0 ? "#B00020" : "#28434F" }}>
            Clientes do portfólio{d.credenciais.length === 0 ? " — selecione ao menos um" : ""}
          </div>
          <p style={{ fontSize: 11, color: "#726C68", marginTop: -6, marginBottom: 10 }}>
            Marque os clientes e, opcionalmente, envie o logotipo (PNG/JPG/SVG) de cada um.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CREDENCIAIS.filter((c) => filtro === "Todos" || CREDENCIAL_SETOR[c] === filtro).map((c) => {
              const on = d.credenciais.includes(c);
              return (
                <div
                  key={c}
                  style={{
                    padding: "10px",
                    border: "0.5px solid " + (on ? "#5B80A3" : "#D8D6D2"),
                    borderRadius: 4,
                    fontSize: 12,
                    backgroundColor: on ? "rgba(91,128,163,0.08)" : "white",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={on} onChange={() => toggleArr("credenciais", c)} />
                    <span>{c}</span>
                  </label>
                  {on && (
                    <>
                      {DEFAULT_LOGOS[c] && !d.credenciais_logos[c] && (
                        <div style={{ fontSize: 10, color: "#726C68", marginTop: 6 }}>
                          Logo padrão será usado (envie um arquivo abaixo para substituir)
                        </div>
                      )}
                      <LogoUpload
                        dataUrl={d.credenciais_logos[c] ?? DEFAULT_LOGOS[c]}
                        onChange={(dataUrl) => up("credenciais_logos", { ...d.credenciais_logos, [c]: dataUrl })}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field label="Adicionar credencial personalizada">
            <input
              style={inputStyle}
              value={d.credencial_extra}
              onChange={(e) => up("credencial_extra", e.target.value)}
            />
            <LogoUpload dataUrl={d.credencial_extra_logo} onChange={(dataUrl) => up("credencial_extra_logo", dataUrl)} />
          </Field>
        </div>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          border: "0.5px solid " + (d.aceite_digital ? "#5B80A3" : "#D8D6D2"),
          borderRadius: 4,
          fontSize: 12,
          backgroundColor: d.aceite_digital ? "rgba(91,128,163,0.08)" : "white",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={d.aceite_digital}
          onChange={(e) => up("aceite_digital", e.target.checked)}
        />
        <span>Incluir aceite digital na proposta</span>
      </label>
    </div>
  );
}
