import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Shield, ShieldCheck, UserPlus, RefreshCw } from "lucide-react";

import { listUsers, grantRole, revokeRole, bootstrapAdmin, adminExists } from "@/lib/admin.functions";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosTab,
});

const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "socio", label: "Sócio" },
  { value: "head_produto", label: "Head Produto" },
  { value: "cp", label: "Client Partner" },
  { value: "consultora", label: "Consultora" },
  { value: "staff", label: "Staff" },
];

type Row = {
  id: string;
  display_name: string | null;
  created_at: string;
  roles: string[];
};

function UsuariosTab() {
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  const runList = useServerFn(listUsers);
  const runGrant = useServerFn(grantRole);
  const runRevoke = useServerFn(revokeRole);
  const runBootstrap = useServerFn(bootstrapAdmin);
  const runAdminExists = useServerFn(adminExists);

  const load = async () => {
    setLoading(true);
    try {
      if (!isAdmin) {
        const r: any = await runAdminExists({});
        setNeedsBootstrap(!r?.exists);
        setRows([]);
        return;
      }
      const data = await runList({ data: { search: search || undefined } });
      setRows(data as Row[]);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(
      (r) => r.display_name?.toLowerCase().includes(s) || r.id.includes(s),
    );
  }, [rows, search]);

  const toggleRole = async (row: Row, role: AppRole) => {
    setBusy(row.id + role);
    try {
      if (row.roles.includes(role)) {
        await runRevoke({ data: { user_id: row.id, role } });
        toast.success(`Papel ${role} removido`);
      } else {
        await runGrant({ data: { user_id: row.id, role } });
        toast.success(`Papel ${role} concedido`);
      }
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao atualizar papel");
    } finally {
      setBusy(null);
    }
  };

  const noAdmins = needsBootstrap || (rows.length > 0 && rows.every((r) => !r.roles.includes("admin")));

  return (
    <div className="space-y-6">
      {noAdmins && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-foreground">Nenhum admin cadastrado.</p>
          <p className="mt-1 text-muted-foreground">
            Você pode reivindicar o papel de admin agora (disponível apenas enquanto não houver
            nenhum admin no sistema).
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={async () => {
              try {
                await runBootstrap({});
                toast.success("Você agora é admin");
                window.location.reload();
              } catch (e: any) {
                toast.error(e.message ?? "Falha");
              }
            }}
          >
            <ShieldCheck className="h-4 w-4" />
            Tornar-me admin
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="pl-9"
          />
        </div>
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
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Papéis</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {!loading && filtered.map((r) => {
                const isSelf = r.id === user?.id;
                return (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.display_name || "—"}
                        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {r.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">sem papel</span>
                        )}
                        {r.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            <Shield className="mr-1 h-3 w-3" />
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {ALL_ROLES.map(({ value, label }) => (
                          <Button
                            key={value}
                            size="sm"
                            variant="outline"
                            disabled={busy === r.id + value}
                            onClick={() => toggleRole(r, value)}
                            className="h-7 text-[11px]"
                          >
                            {r.roles.includes(value) ? `− ${label}` : `+ ${label}`}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <UserPlus className="mr-1 inline h-3 w-3" />
        Novos usuários entram pela tela de cadastro. Aqui você atribui papéis a quem já se cadastrou.
      </p>
    </div>
  );
}
