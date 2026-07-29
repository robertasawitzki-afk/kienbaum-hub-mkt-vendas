import { useEffect, useState } from "react";
import { History, Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["ai_outputs"]["Row"];
type Kind = Database["public"]["Enums"]["ai_kind"];

/**
 * Histórico do conteúdo gerado pela IA neste espaço, para o usuário atual.
 * Reaproveitado em cada página de módulo, no Meu Perfil e (com allUsers) no Painel Admin.
 */
export function OutputsHistory({
  kind,
  title = "Histórico deste espaço",
  emptyLabel = "Nada salvo ainda aqui. Use “Salvar no histórico” acima para guardar um resultado.",
  limit = 50,
}: {
  kind: Kind | Kind[];
  title?: string;
  emptyLabel?: string;
  limit?: number;
}) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    let q = supabase
      .from("ai_outputs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    q = Array.isArray(kind) ? q.in("kind", kind) : q.eq("kind", kind);
    const { data } = await q;
    setRows(data ?? []);
  }

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [user?.id, Array.isArray(kind) ? kind.join(",") : kind]);

  function startEdit(r: Row) {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditContent(r.content);
    setOpenId(r.id);
  }

  async function saveEdit(id: string) {
    setBusy(true);
    const { error } = await supabase
      .from("ai_outputs")
      .update({ title: editTitle, content: editContent })
      .eq("id", id);
    setBusy(false);
    if (!error) {
      setEditingId(null);
      void load();
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este item do histórico? Não dá para desfazer.")) return;
    await supabase.from("ai_outputs").delete().eq("id", id);
    void load();
  }

  if (!rows) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico…
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {title}
          <Badge variant="outline" className="ml-1 text-[10px]">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
        <ul className="space-y-2">
          {rows.map((r) => {
            const isOpen = openId === r.id;
            const isEditing = editingId === r.id;
            return (
              <li key={r.id} className="rounded-md border border-border bg-muted/20">
                <div className="flex items-start justify-between gap-2 p-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                  >
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </p>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" onClick={() => (isEditing ? setEditingId(null) : startEdit(r))} title="Editar">
                      {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => void remove(r.id)} title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-border/60 p-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título" />
                        <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={8} className="font-sans text-sm" />
                        <Button size="sm" onClick={() => void saveEdit(r.id)} disabled={busy}>
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Salvar edição
                        </Button>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground/90">{r.content}</pre>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
