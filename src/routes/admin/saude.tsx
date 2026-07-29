import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Users, Sparkles, TrendingUp, FolderOpen, Loader2 } from "lucide-react";

import { dbHealth } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/saude")({
  component: SaudeTab,
});

type HealthData = {
  counts: { profiles: number; ai_total: number; ai_week: number; materiais: number };
  recent_profiles: Array<{ id: string; display_name: string | null; created_at: string }>;
  recent_ai: Array<{ id: string; title: string; kind: string; created_at: string }>;
};

function SaudeTab() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const run = useServerFn(dbHealth);

  const load = async () => {
    setLoading(true);
    try {
      setData((await run({})) as HealthData);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Snapshot somente-leitura.</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard icon={Users} label="Usuários" value={data.counts.profiles} />
            <MetricCard icon={Sparkles} label="Outputs IA (total)" value={data.counts.ai_total} />
            <MetricCard icon={TrendingUp} label="Outputs IA (7d)" value={data.counts.ai_week} />
            <MetricCard icon={FolderOpen} label="Materiais" value={data.counts.materiais} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-primary">Usuários recentes</CardTitle></CardHeader>
              <CardContent>
                {data.recent_profiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário recente.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.recent_profiles.map((p) => (
                      <li key={p.id} className="flex justify-between border-b border-border/50 pb-2 last:border-0">
                        <span>{p.display_name || "—"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-primary">Outputs de IA recentes</CardTitle></CardHeader>
              <CardContent>
                {data.recent_ai.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum output recente.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.recent_ai.map((a) => (
                      <li key={a.id} className="border-b border-border/50 pb-2 last:border-0">
                        <div className="flex justify-between">
                          <span className="truncate">{a.title}</span>
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{a.kind}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
