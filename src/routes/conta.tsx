import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Save, Shield, User as UserIcon } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { OutputsHistory } from "@/components/outputs-history";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/conta")({
  head: () => ({ meta: [{ title: "Meu Perfil — Kienbaum Hub de Mkt & Vendas" }] }),
  component: ContaPage,
});

type Kind = Database["public"]["Enums"]["ai_kind"];
const ALL_KINDS: Kind[] = ["simulador", "reuniao", "deck", "concorrencia", "email", "carteira", "tecnicas"];

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  socio: "Sócio",
  head_produto: "Head Produto",
  cp: "Client Partner",
  consultora: "Consultora",
  staff: "Staff",
};

function ContaPage() {
  const { user, roles } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? "");
        setLoading(false);
      });
  }, [user?.id]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName.trim() || null }, { onConflict: "id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageContainer>
      <PageHeader
        module="Minha conta"
        title="Meu Perfil"
        description="Suas informações e tudo o que você já gerou com IA no hub, em um só lugar."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" />Identidade</CardTitle>
          <CardDescription>Seu nome de exibição aparece nas suas gerações e para outros Client Partners.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando…</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome de exibição</Label>
                  <div className="flex gap-2">
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Como devemos te chamar" />
                    <Button onClick={save} disabled={saving} size="icon" variant="outline">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4 text-primary" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</Label>
                  <Input value={user?.email ?? ""} disabled />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Papéis atribuídos</Label>
                <div className="flex flex-wrap gap-1.5">
                  {roles.length === 0 && <span className="text-xs text-muted-foreground">Nenhum papel — fale com um admin.</span>}
                  {roles.map((r) => (
                    <Badge key={r} variant="outline"><Shield className="mr-1 h-3 w-3" />{ROLE_LABEL[r] ?? r}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <OutputsHistory
        kind={ALL_KINDS}
        title="Tudo que eu gerei no hub"
        emptyLabel="Nada salvo ainda. Em qualquer espaço de IA do hub, clique em “Salvar no histórico”."
        limit={200}
      />
    </PageContainer>
  );
}
