import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"in" | "forgot">("in");
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: redirect });
  }, [loading, user, redirect, navigate]);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  }

  async function sendReset(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    if (error) setErr(error.message);
    else setForgotSent(true);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground text-xl font-bold">K</div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Kienbaum Porto Alegre</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Hub de Marketing e Vendas</h1>
          <p className="text-xs text-muted-foreground">Acesso restrito e por convite.</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="mb-1 text-base">{mode === "in" ? "Bem-vindo de volta" : "Recuperar acesso"}</CardTitle>
            <CardDescription>
              {mode === "in" ? "Use o e-mail para o qual você recebeu o convite." : "Enviamos um link para redefinir sua senha."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "forgot" && forgotSent ? (
              <p className="text-sm text-muted-foreground">
                Se esse e-mail tiver uma conta, um link de redefinição chega em instantes.
              </p>
            ) : (
              <form onSubmit={mode === "in" ? signIn : sendReset} className="space-y-3">
                <div><Label htmlFor="e1">E-mail</Label><Input id="e1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                {mode === "in" && (
                  <div><Label htmlFor="p1">Senha</Label><Input id="p1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                )}
                {err && <p className="text-xs text-destructive">{err}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "in" ? "Entrar" : "Enviar link de redefinição"}
                </Button>
              </form>
            )}
            <button
              type="button"
              onClick={() => { setMode(mode === "in" ? "forgot" : "in"); setErr(null); setForgotSent(false); }}
              className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "in" ? "Esqueci minha senha" : "Voltar para o login"}
            </button>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Não tem conta ainda? Peça a um administrador para te convidar.
        </p>
      </div>
    </div>
  );
}
