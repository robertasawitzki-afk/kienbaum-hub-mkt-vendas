import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/definir-senha")({
  ssr: false,
  head: () => ({ meta: [{ title: "Definir senha — Kienbaum Hub de Mkt & Vendas" }] }),
  component: DefinirSenhaPage,
});

function DefinirSenhaPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) { setErr("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setErr("As senhas não coincidem."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
    setTimeout(() => void navigate({ to: "/" }), 1500);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground text-xl font-bold">K</div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Kienbaum Porto Alegre</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Definir senha</h1>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Escolha sua senha</CardTitle>
            <CardDescription>Vale tanto para aceitar um convite quanto para redefinir sua senha atual.</CardDescription>
          </CardHeader>
          <CardContent>
            {!ready && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando o link…
              </div>
            )}
            {ready && done && (
              <p className="text-sm text-muted-foreground">Senha definida! Redirecionando…</p>
            )}
            {ready && !done && (
              <form onSubmit={submit} className="space-y-3">
                <div><Label htmlFor="p1">Nova senha</Label><Input id="p1" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <div><Label htmlFor="p2">Confirmar senha</Label><Input id="p2" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
                {err && <p className="text-xs text-destructive">{err}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar senha
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
