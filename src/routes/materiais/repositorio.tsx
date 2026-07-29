import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Package } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { KIENBAUM_PRODUCTS, MATERIAL_CATEGORIES } from "@/lib/activity";

export const Route = createFileRoute("/materiais/repositorio")({
  head: () => ({ meta: [{ title: "Repositório — Kienbaum Hub de Mkt & Vendas" }] }),
  component: RepositorioPage,
});

type FileRow = Database["public"]["Tables"]["materiais_files"]["Row"];

const MIME_BY_EXT: Record<string, string> = {
  html: "text/html", htm: "text/html",
  pdf: "application/pdf",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
  txt: "text/plain", csv: "text/csv",
};

function guessMime(filename: string, fallback: string | null): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? fallback ?? "application/octet-stream";
}

function RepositorioPage() {
  const [files, setFiles] = useState<FileRow[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void supabase
      .from("materiais_files")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setFiles(data ?? []));
  }, []);

  async function view(row: FileRow) {
    // O Content-Type gravado no Storage no upload nem sempre bate com a extensão
    // (ex.: .html salvo como texto puro) — refaz o blob com o mime correto pela
    // extensão do arquivo, senão o navegador mostra o código-fonte em vez de renderizar.
    const { data, error } = await supabase.storage.from("materiais").download(row.storage_path);
    if (error || !data) {
      const { data: signed } = await supabase.storage
        .from("materiais")
        .createSignedUrl(row.storage_path, 300, { download: false });
      if (signed?.signedUrl) window.open(signed.signedUrl, "_blank");
      return;
    }
    const mime = guessMime(row.storage_path, row.mime_type);
    const blob = data.type === mime ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function download(row: FileRow) {
    const { data } = await supabase.storage
      .from("materiais")
      .createSignedUrl(row.storage_path, 60, { download: true });
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  const filtered = useMemo(() => {
    if (!files) return files;
    if (!search.trim()) return files;
    const s = search.toLowerCase();
    return files.filter(
      (f) =>
        f.title.toLowerCase().includes(s) ||
        (f.product ?? "").toLowerCase().includes(s) ||
        (f.category ?? "").toLowerCase().includes(s),
    );
  }, [files, search]);

  const orfaos = (filtered ?? []).filter(
    (f) => !f.product || !(KIENBAUM_PRODUCTS as readonly string[]).includes(f.product),
  );

  return (
    <PageContainer>
      <PageHeader
        module="Repositório · 3.1"
        title="Repositório de Materiais"
        description="Biblioteca central por produto Kienbaum. Cada produto tem seções para Apresentação Comercial, Proposta Comercial, One Pager e Templates de E-mails. Uploads são gerenciados pelo Painel Admin."
        actions={
          <Badge variant="outline" className="border-primary/40 text-primary">
            {files?.length ?? 0} arquivos
          </Badge>
        }
      />

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Buscar por título, produto ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {KIENBAUM_PRODUCTS.map((product) => {
          const items = (filtered ?? []).filter((f) => f.product === product);
          return (
            <Card key={product}>
              <CardHeader>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{product}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {items.length} arquivo{items.length === 1 ? "" : "s"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {MATERIAL_CATEGORIES.map((cat) => {
                  const list = items.filter((f) => f.category === cat);
                  return (
                    <div key={cat}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {cat}
                      </p>
                      {list.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60">— sem material</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {list.map((it) => (
                            <li
                              key={it.id}
                              className="flex items-center justify-between gap-2 border-b border-border/50 py-1 last:border-0"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-foreground">
                                  <FileText className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                                  {it.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(it.created_at).toLocaleDateString("pt-BR")} ·{" "}
                                  {it.size_bytes ? `${Math.round(it.size_bytes / 1024)} KB` : "—"}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <Button size="icon" variant="ghost" title="Visualizar em nova aba" onClick={() => void view(it)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" title="Baixar" onClick={() => void download(it)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {orfaos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Não classificados</CardTitle>
            <p className="text-xs text-muted-foreground">
              {orfaos.length} arquivo{orfaos.length === 1 ? "" : "s"} de versões anteriores — reclassifique no Painel Admin.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {orfaos.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 border-b border-border/50 py-1 last:border-0">
                  <span className="truncate">
                    <FileText className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                    {it.title} <span className="text-xs text-muted-foreground">· {it.product ?? "sem produto"} · {it.category}</span>
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" title="Visualizar em nova aba" onClick={() => void view(it)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Baixar" onClick={() => void download(it)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
