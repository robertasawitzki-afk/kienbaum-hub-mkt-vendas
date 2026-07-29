import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Bot, Eye, FileText, Loader2, Save, Upload } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Timeline — Kienbaum Hub de Mkt & Vendas" }] }),
  component: TimelinePage,
});

type Row = Database["public"]["Tables"]["activity_log"]["Row"];

const ICONS: Record<string, typeof Activity> = {
  view: Eye,
  ai_run: Bot,
  save: Save,
  upload: Upload,
  action: FileText,
};

const LABELS: Record<string, string> = {
  view: "Acesso",
  ai_run: "Rodou IA",
  save: "Salvou",
  upload: "Upload",
  action: "Ação",
};

function groupByDay(rows: Row[]) {
  const groups: Record<string, Row[]> = {};
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    (groups[key] ??= []).push(r);
  }
  return Object.entries(groups);
}

function TimelinePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data }) => setRows(data ?? []));
  }, [user]);

  return (
    <PageContainer>
      <PageHeader
        module="Minha conta"
        title="Timeline"
        description="Tudo o que você acessou e produziu no Hub de Mkt & Vendas, em ordem cronológica."
      />

      {!rows && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      )}

      {rows && rows.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Activity className="mx-auto mb-2 h-6 w-6" />
            Sua timeline vai aparecer aqui conforme você navegar pelo app.
          </CardContent>
        </Card>
      )}

      {rows && rows.length > 0 && (
        <div className="space-y-8">
          {groupByDay(rows).map(([day, items]) => (
            <section key={day}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {day}
              </h3>
              <ol className="relative space-y-3 border-l border-border pl-6">
                {items.map((it) => {
                  const Icon = ICONS[it.kind] ?? Activity;
                  return (
                    <li key={it.id} className="relative">
                      <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted/40">
                        <Icon className="h-3 w-3 text-primary" />
                      </span>
                      <div className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-card px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {LABELS[it.kind] ?? it.kind}
                            </Badge>
                            <span className="truncate text-sm font-medium">{it.title}</span>
                          </div>
                          {it.route && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {it.route}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(it.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}