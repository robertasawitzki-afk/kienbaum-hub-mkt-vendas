import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History, Loader2, Trash2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/historico")({
  head: () => ({ meta: [{ title: "Histórico — Kienbaum Hub de Mkt & Vendas" }] }),
  component: Historico,
});

type Row = Database["public"]["Tables"]["ai_outputs"]["Row"];

const KIND_LABEL: Record<Row["kind"], string> = {
  simulador: "Simulador",
  reuniao: "Reunião",
  deck: "Deck",
  concorrencia: "Concorrência",
  email: "E-mail",
  carteira: "Carteira",
  tecnicas: "Técnicas",
};

function Historico() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("ai_outputs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows(data ?? []));
  }, [user]);

  async function remove(id: string) {
    await supabase.from("ai_outputs").delete().eq("id", id);
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  }

  return (
    <PageContainer>
      <PageHeader module="Histórico" title="Meu histórico de IA" description="Todas as gerações que você salvou." />
      {!rows && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando…</div>}
      {rows && rows.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground"><History className="mx-auto mb-2 h-6 w-6" />Nada salvo ainda. Nos módulos de IA, clique em <b>Salvar no histórico</b>.</CardContent></Card>
      )}
      <div className="space-y-3">
        {rows?.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="secondary">{KIND_LABEL[r.kind]}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <CardTitle className="text-base">{r.title}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setOpenId(openId === r.id ? null : r.id)}>{openId === r.id ? "Recolher" : "Ver"}</Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            {openId === r.id && (
              <CardContent><pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{r.content}</pre></CardContent>
            )}
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}