import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Sparkles, Trash2, Search } from "lucide-react";

import { listAllOutputs, deleteOutput } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/conteudo")({
  component: ConteudoTab,
});

type Row = {
  id: string;
  user_id: string;
  author_name: string | null;
  kind: string;
  title: string;
  content: string;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  simulador: "Simulador",
  reuniao: "Reunião",
  deck: "Deck",
  concorrencia: "Concorrência",
  email: "E-mail",
  carteira: "Carteira",
  tecnicas: "Técnicas",
};

function ConteudoTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const runList = useServerFn(listAllOutputs);
  const runDelete = useServerFn(deleteOutput);

  const load = async () => {
    setLoading(true);
    try {
      setRows((await runList({})) as Row[]);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const del = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(id);
    try {
      await runDelete({ data: { id } });
      toast.success("Item excluído");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha");
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const s = search.toLowerCase();
    return rows.filter(
      (r) => r.title.toLowerCase().includes(s) || (r.author_name ?? "").toLowerCase().includes(s),
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título ou autor..." className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">
          <Sparkles className="mr-1 inline h-4 w-4" />
          {filtered.length} de {rows.length}
        </p>
        <Button variant="outline" size="sm" className="ml-auto" onClick={load}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nada gerado ainda.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Espaço</th>
                  <th className="px-4 py-3">Autor</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isOpen = openId === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3">
                          <button className="text-left font-medium hover:underline" onClick={() => setOpenId(isOpen ? null : r.id)}>
                            {r.title}
                          </button>
                        </td>
                        <td className="px-4 py-3"><Badge variant="secondary">{KIND_LABEL[r.kind] ?? r.kind}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{r.author_name ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => del(r.id, r.title)} className="h-7 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </Button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-border/50 last:border-0 bg-muted/20">
                          <td colSpan={5} className="px-4 py-3">
                            <pre className="whitespace-pre-wrap text-xs font-sans leading-relaxed text-foreground/90">{r.content}</pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
