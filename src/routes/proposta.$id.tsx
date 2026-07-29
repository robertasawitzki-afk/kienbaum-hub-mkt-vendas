import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/proposta/$id")({
  ssr: false,
  component: PropostaPublica,
});

function PropostaPublica() {
  const { id: slug } = Route.useParams();
  const [propostaId, setPropostaId] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aceiteDigital, setAceiteDigital] = useState(false);
  const [nome, setNome] = useState("");
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aceiteExistente, setAceiteExistente] = useState<{ nome: string; data: string } | null>(null);

  useEffect(() => {
    supabase
      .from("propostas")
      .select("id, html_gerado, dados_json")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setErro("Proposta não encontrada.");
          return;
        }
        setPropostaId(data.id);
        setHtml(data.html_gerado);
        setAceiteDigital(Boolean((data.dados_json as any)?.aceite_digital));

        supabase
          .from("aceites")
          .select("nome_signatario, aceito_em")
          .eq("proposta_id", data.id)
          .order("aceito_em", { ascending: false })
          .limit(1)
          .then(({ data: aceites }) => {
            if (aceites && aceites.length > 0) {
              setAceiteExistente({ nome: aceites[0].nome_signatario, data: aceites[0].aceito_em });
            }
          });
      });
  }, [slug]);

  async function handleAceite() {
    if (!nome.trim() || !propostaId) return;
    setEnviando(true);
    const { error } = await supabase.from("aceites").insert({
      proposta_id: propostaId,
      nome_signatario: nome.trim(),
      aceito_em: new Date().toISOString(),
    });
    if (error) {
      setEnviando(false);
      window.alert("Não foi possível registrar o aceite: " + error.message);
      return;
    }
    const { error: erroStatus } = await supabase
      .from("propostas")
      .update({ status: "aceita" })
      .eq("id", propostaId);
    setEnviando(false);
    if (erroStatus) {
      window.alert("Aceite registrado, mas não foi possível atualizar o status: " + erroStatus.message);
    }
    setAceiteExistente({ nome: nome.trim(), data: new Date().toISOString() });
    setAceito(true);
  }

  if (erro) {
    return (
      <div style={{ padding: 40, fontFamily: "Montserrat, sans-serif", color: "#28434F" }}>
        {erro}
      </div>
    );
  }
  if (!html) {
    return (
      <div style={{ padding: 40, fontFamily: "Montserrat, sans-serif", color: "#726C68" }}>
        Carregando proposta...
      </div>
    );
  }

  return (
    <div>
      <iframe
        title="Proposta"
        srcDoc={html}
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
      {aceiteDigital && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTop: "0.5px solid #D8D6D2",
            padding: "16px 24px",
            fontFamily: "Montserrat, sans-serif",
            color: "#28434F",
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {aceito ? (
            <span style={{ fontSize: 13, fontWeight: 500, color: "#28434F" }}>
              Aceite registrado. Obrigado!
            </span>
          ) : aceiteExistente ? (
            <span style={{ fontSize: 13, fontWeight: 500, color: "#28434F" }}>
              Esta proposta já foi aceita por {aceiteExistente.nome} em{" "}
              {new Date(aceiteExistente.data).toLocaleString("pt-BR")}.
            </span>
          ) : (
            <>
              <input
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{
                  border: "0.5px solid #D8D6D2",
                  borderRadius: 4,
                  padding: "8px 10px",
                  fontSize: 13,
                  minWidth: 240,
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleAceite}
                disabled={enviando || !nome.trim()}
                style={{
                  padding: "8px 16px",
                  border: "0.5px solid #28434F",
                  borderRadius: 4,
                  backgroundColor: "#28434F",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                }}
              >
                {enviando ? "Enviando..." : "Confirmar aceite"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
