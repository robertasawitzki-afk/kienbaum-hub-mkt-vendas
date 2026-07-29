import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Acesso — Kienbaum Hub de Mkt & Vendas" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const redirect = useRouterState({ select: (s) => new URLSearchParams(s.location.searchStr).get("redirect") || "/" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) void navigate({ to: redirect });
  }, [loading, user, redirect, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name || email.split("@")[0] }, emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) setErr(error.message);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground text-xl font-bold">K</div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Kienbaum Porto Alegre</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Hub de Marketing e Vendas</h1>
          <p className="text-xs text-muted-foreground">Acesso restrito aos Client Partners.</p>
        </div>
        <Card>
          <Tabs defaultValue="in">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="in">Entrar</TabsTrigger>
                <TabsTrigger value="up">Criar conta</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="in">
                <CardTitle className="mb-1 text-base">Bem-vindo de volta</CardTitle>
                <CardDescription className="mb-4">Use seu e-mail Kienbaum.</CardDescription>
                <form onSubmit={signIn} className="space-y-3">
                  <div><Label htmlFor="e1">E-mail</Label><Input id="e1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div><Label htmlFor="p1">Senha</Label><Input id="p1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                  {err && <p className="text-xs text-destructive">{err}</p>}
                  <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Entrar</Button>
                </form>
              </TabsContent>
              <TabsContent value="up">
                <CardTitle className="mb-1 text-base">Criar conta</CardTitle>
                <CardDescription className="mb-4">Cadastre-se com e-mail e senha.</CardDescription>
                <form onSubmit={signUp} className="space-y-3">
                  <div><Label htmlFor="n">Nome</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te chamar" /></div>
                  <div><Label htmlFor="e2">E-mail</Label><Input id="e2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div><Label htmlFor="p2">Senha</Label><Input id="p2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                  {err && <p className="text-xs text-destructive">{err}</p>}
                  <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Criar conta</Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}