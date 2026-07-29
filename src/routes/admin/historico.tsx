import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

import { listAudit } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/historico")({
  component: HistoricoTab,
});

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  grant_role: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
  revoke_role: "bg-amber-500/15 text-amber-700 border-amber-500/40",
  bootstrap_admin: "bg-sky-500/15 text-sky-700 border-sky-500/40",
  delete_material: "bg-destructive/15 text-destructive border-destructive/40",
};

function HistoricoTab() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const run = useServerFn(listAudit);

  const load = async () => {
    setLoading(true);
    try {
      setRows((await run({})) as AuditRow[]);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const initials = (email: string | null) => (email ?? "??").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Últimas {rows.length} ações administrativas.</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma ação registrada ainda.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const badgeCls = ACTION_COLORS[r.action] ?? "";
            return (
              <li key={r.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(r.actor_email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{r.actor_email ?? "—"}</span>
                    <Badge variant="outline" className={badgeCls}>{r.action}</Badge>
                    <span className="text-xs text-muted-foreground">{r.resource}</span>
                  </div>
                  {Object.keys(r.details ?? {}).length > 0 && (
                    <div className="mt-1 truncate text-xs text-muted-foreground">{JSON.stringify(r.details)}</div>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
