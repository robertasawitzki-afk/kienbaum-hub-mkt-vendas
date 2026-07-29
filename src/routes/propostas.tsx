import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { buildEmailHTML } from "@/lib/proposalEmail";
import { buildProposalHTML } from "@/lib/proposalTemplate";
import { montarDadosCompletos } from "@/lib/buildProposalData";
import { KienbaumLogo } from "@/components/KienbaumLogo";

export const Route = createFileRoute("/propostas")({
  head: () => ({ meta: [{ title: "Propostas de Competence Check — Kienbaum Hub de Mkt & Vendas" }] }),
  component: Dashboard,
});

interface PropostaLinha {
  slug: string;
  codigo: string | null;
  empresa: string | null;
  consultora: string | null;
  status: string;
  criado_em: string;
  dados_json: { interlocutor?: string } | null;
  aceites: { nome_signatario: string; aceito_em: string }[];
}

const statusCor: Record<string, string> = {
  rascunho: "#726C68",
  enviada: "#5B80A3",
  aceita: "#2E7D32",
};

function Dashboard() {
  const { signOut } = useAuth();
  const [propostas, setPropostas] = useState<PropostaLinha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiadoSlug, setCopiadoSlug] = useState<string | null>(null);
  const [regenerando, setRegenerando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    supabase
      .from("propostas")
      .select("slug, codigo, empresa, consultora, status, criado_em, dados_json, aceites(nome_signatario, aceito_em)")
      .order("criado_em", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setErro(error.message);
          return;
        }
        setPropostas((data as unknown as PropostaLinha[]) ?? []);
      });
  }

  async function excluir(slug: string) {
    if (!window.confirm("Excluir esta proposta? Essa ação não pode ser desfeita.")) return;
    const { data, error } = await supabase.from("propostas").delete().eq("slug", slug).select("id");
    if (error) {
      window.alert("Erro ao excluir: " + error.message);
      return;
    }
    if (!data || data.length === 0) {
      window.alert("Não foi possível excluir: sem permissão no banco de dados.");
      return;
    }
    setPropostas((prev) => prev?.filter((p) => p.slug !== slug) ?? null);
  }

  async function regenerarTodas() {
    if (
      !window.confirm(
        "Isso vai regenerar o HTML de TODAS as propostas salvas com o modelo mais recente (ex.: correção do menu lateral). Continuar?"
      )
    )
      return;
    setRegenerando(true);
    const { data, error } = await supabase.from("propostas").select("id, dados_json");
    if (error) {
      window.alert("Erro ao buscar propostas: " + error.message);
      setRegenerando(false);
      return;
    }
    let ok = 0;
    let falhas = 0;
    for (const p of data ?? []) {
      try {
        const html = buildProposalHTML(montarDadosCompletos(p.dados_json));
        const { error: upErr } = await supabase.from("propostas").update({ html_gerado: html }).eq("id", p.id);
        if (upErr) falhas++;
        else ok++;
      } catch {
        falhas++;
      }
    }
    setRegenerando(false);
    window.alert(`Atualização concluída: ${ok} propostas atualizadas${falhas ? `, ${falhas} com erro` : ""}.`);
    carregar();
  }

  async function copiarLink(slug: string) {
    const url = `${window.location.origin}/proposta/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiadoSlug(slug);
    setTimeout(() => setCopiadoSlug(null), 2000);
  }

  async function copiarEmail(p: PropostaLinha) {
    const url = `${window.location.origin}/proposta/${p.slug}`;
    const html = buildEmailHTML({
      interlocutor: p.dados_json?.interlocutor ?? "",
      empresa: p.empresa ?? "",
      consultora: p.consultora ?? "",
      link: url,
    });
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([`Acessar Proposta de Competence Check: ${url}`], { type: "text/plain" }),
        }),
      ]);
      setCopiadoSlug(p.slug + ":email");
      setTimeout(() => setCopiadoSlug(null), 2000);
    } catch {
      window.alert("Não foi possível copiar automaticamente.");
    }
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: "#F7F6F4", color: "#28434F" }}>
      <aside className="flex flex-col" style={{ width: 188, backgroundColor: "#28434F", color: "white", flexShrink: 0 }}>
        <div style={{ padding: 20, borderBottom: "0.5px solid rgba(255,255,255,0.15)" }}>
          <div style={{ marginBottom: 12 }}><KienbaumLogo height={22} /></div>
          <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>Gerador de Proposta de Competence Check</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 0" }}>
          <Link
            to="/nova-proposta"
            search={{ slug: undefined, template: undefined }}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "10px 20px",
              fontSize: 12,
              color: "rgba(255,255,255,0.65)",
              textDecoration: "none",
            }}
          >
            Nova proposta
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "10px 20px",
              fontSize: 12,
              fontWeight: 500,
              color: "white",
              borderLeft: "2px solid #5B80A3",
              backgroundColor: "rgba(91,128,163,0.15)",
            }}
          >
            Propostas salvas
          </div>
        </nav>
        <div style={{ padding: 20, borderTop: "0.5px solid rgba(255,255,255,0.15)", fontSize: 10, opacity: 0.6 }}>
          <Link
            to="/"
            style={{ display: "block", marginBottom: 8, fontSize: 10, color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}
          >
            ← Voltar ao Hub
          </Link>
          Desenvolvido por Sawitzki Consultoria
          <button
            onClick={() => void signOut()}
            style={{ display: "block", marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "32px 48px" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#726C68", fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Gestão
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>Propostas salvas</h1>
          </div>
          {!erro && propostas && propostas.length > 0 && (
            <button
              onClick={regenerarTodas}
              disabled={regenerando}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#5B80A3",
                border: "0.5px solid #5B80A3",
                borderRadius: 4,
                padding: "8px 14px",
                backgroundColor: "white",
              }}
            >
              {regenerando ? "Atualizando..." : "Atualizar HTML de todas as propostas"}
            </button>
          )}
        </div>

        {erro && (
          <div style={{ padding: 16, border: "0.5px solid #D8D6D2", borderRadius: 4, backgroundColor: "white", color: "#726C68", fontSize: 13 }}>
            {erro}
          </div>
        )}

        {!erro && propostas === null && (
          <div style={{ fontSize: 13, color: "#726C68" }}>Carregando...</div>
        )}

        {!erro && propostas !== null && propostas.length === 0 && (
          <div style={{ padding: 16, border: "0.5px solid #D8D6D2", borderRadius: 4, backgroundColor: "white", color: "#726C68", fontSize: 13 }}>
            Nenhuma proposta gerada ainda.
          </div>
        )}

        {!erro && propostas && propostas.length > 0 && (
          <div style={{ backgroundColor: "white", border: "0.5px solid #D8D6D2", borderRadius: 4, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#F7F6F4" }}>
                  {["Código", "Empresa", "Consultora", "Status", "Data", "Aceite", "Assinado por", "Data do aceite", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#726C68",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propostas.map((p) => {
                  const aceite = p.aceites?.[0];
                  return (
                    <tr key={p.slug} style={{ borderTop: "0.5px solid #D8D6D2" }}>
                      <td style={{ padding: "10px 14px" }}>{p.codigo || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>{p.empresa || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>{p.consultora || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: statusCor[p.status] ?? "#726C68",
                            textTransform: "capitalize",
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: "10px 14px", color: aceite ? "#2E7D32" : "#726C68", fontWeight: 500 }}>
                        {aceite ? "Sim" : "Não"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>{aceite?.nome_signatario || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {aceite ? new Date(aceite.aceito_em).toLocaleString("pt-BR") : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => copiarLink(p.slug)}
                          style={{ fontSize: 11, color: "#5B80A3", fontWeight: 500, marginRight: 10 }}
                        >
                          {copiadoSlug === p.slug ? "Copiado!" : "Copiar link"}
                        </button>
                        <button
                          onClick={() => copiarEmail(p)}
                          style={{ fontSize: 11, color: "#5B80A3", fontWeight: 500, marginRight: 10 }}
                        >
                          {copiadoSlug === p.slug + ":email" ? "Copiado!" : "Copiar e-mail"}
                        </button>
                        <a
                          href={`/proposta/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 11, color: "#28434F", fontWeight: 500, textDecoration: "none", marginRight: 10 }}
                        >
                          Abrir
                        </a>
                        <Link
                          to="/nova-proposta"
                          search={{ slug: p.slug, template: undefined }}
                          style={{ fontSize: 11, color: "#28434F", fontWeight: 500, textDecoration: "none", marginRight: 10 }}
                        >
                          Editar
                        </Link>
                        <Link
                          to="/nova-proposta"
                          search={{ slug: undefined, template: p.slug }}
                          style={{ fontSize: 11, color: "#5B80A3", fontWeight: 500, textDecoration: "none", marginRight: 10 }}
                        >
                          Usar como modelo
                        </Link>
                        <button
                          onClick={() => excluir(p.slug)}
                          style={{ fontSize: 11, color: "#B00020", fontWeight: 500 }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
