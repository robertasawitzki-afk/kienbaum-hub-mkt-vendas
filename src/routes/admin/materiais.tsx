import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FolderOpen, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";

import { listAllMaterials, deleteMaterial } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { KIENBAUM_PRODUCTS, MATERIAL_CATEGORIES } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/materiais")({
  component: MateriaisTab,
});

type Mat = {
  id: string;
  title: string;
  category: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  uploader_id: string;
  product: string | null;
  storage_path: string;
};

function MateriaisTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Mat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [product, setProduct] = useState<string>(KIENBAUM_PRODUCTS[0]);
  const [category, setCategory] = useState<string>(MATERIAL_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const runList = useServerFn(listAllMaterials);
  const runDelete = useServerFn(deleteMaterial);

  const load = async () => {
    setLoading(true);
    try {
      setRows((await runList({})) as Mat[]);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const upload = async () => {
    if (!user || !file || !title) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("materiais")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("materiais_files").insert({
        uploader_id: user.id,
        category,
        product,
        title,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (dbErr) throw dbErr;
      toast.success("Material enviado");
      setTitle("");
      setFile(null);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const del = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(id);
    try {
      await runDelete({ data: { id } });
      toast.success("Material excluído");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
            <Upload className="h-4 w-4 text-primary" /> Enviar material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.5fr_1fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs">Produto</Label>
              <Select value={product} onValueChange={(v) => setProduct(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIENBAUM_PRODUCTS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Apresentação Comercial — Executive Search v3"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Arquivo</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={upload} disabled={uploading || !file || !title}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Enviar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <FolderOpen className="mr-1 inline h-4 w-4" />
          {rows.length} arquivo{rows.length === 1 ? "" : "s"} no repositório
        </p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3">Enviado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum material cadastrado.
                  </td>
                </tr>
              )}
              {!loading && rows.map((m) => (
                <tr key={m.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.product ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.size_bytes ? `${(m.size_bytes / 1024).toFixed(1)} KB` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" disabled={busy === m.id} onClick={() => del(m.id, m.title)} className="h-7 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
