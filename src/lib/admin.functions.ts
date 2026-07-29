import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

async function logAudit(
  supabase: any,
  actorId: string,
  actorEmail: string | undefined,
  action: string,
  resource: string,
  details: Record<string, unknown> = {},
) {
  await supabase.from("audit_log").insert({
    actor_id: actorId,
    actor_email: actorEmail ?? null,
    action,
    resource,
    details,
  });
}

/** Bootstrap: if no admin exists yet, current user claims admin. Else forbidden. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) throw new Error("Admin já existe");
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (insErr) throw new Error(insErr.message);
    await logAudit(supabase, userId, claims?.email, "bootstrap_admin", `user:${userId}`);
    return { ok: true };
  });

/** Returns whether at least one admin exists (used for bootstrap gate). */
export const adminExists = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { count } = await supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    return { exists: (count ?? 0) > 0 };
  });

/** Lista usuários (admin only). Combina profiles + roles. */
export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ search: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);

    let q = supabase
      .from("profiles")
      .select("id, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.search) q = q.ilike("display_name", `%${data.search}%`);
    const { data: profiles, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p: any) => p.id);
    const { data: roles } = ids.length
      ? await supabase.from("user_roles").select("user_id, role").in("user_id", ids)
      : { data: [] as any[] };

    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });

    return (profiles ?? []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      created_at: p.created_at,
      roles: roleMap.get(p.id) ?? [],
    }));
  });

const ROLE_ENUM = z.enum(["admin", "cp", "socio", "head_produto", "consultora", "staff"]);

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ user_id: z.string().uuid(), role: ROLE_ENUM }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context as any;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    await logAudit(supabase, userId, claims?.email, "grant_role", `user:${data.user_id}`, {
      role: data.role,
    });
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ user_id: z.string().uuid(), role: ROLE_ENUM }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context as any;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    await logAudit(supabase, userId, claims?.email, "revoke_role", `user:${data.user_id}`, {
      role: data.role,
    });
    return { ok: true };
  });

const ROLE_ENUM_INVITE = z.enum(["admin", "cp", "socio", "head_produto", "consultora", "staff"]);

/** Convida uma pessoa por e-mail (Supabase Auth) e já atribui um papel inicial. */
export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      email: z.string().email(),
      role: ROLE_ENUM_INVITE,
      redirectTo: z.string().url(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context as any;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: data.redirectTo,
    });
    if (error) throw new Error(error.message);

    const newUserId = invited.user.id;
    await supabaseAdmin.from("profiles").upsert(
      { id: newUserId, display_name: data.email.split("@")[0] },
      { onConflict: "id", ignoreDuplicates: true },
    );
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: newUserId, role: data.role }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    await logAudit(supabase, userId, claims?.email, "invite_user", `user:${newUserId}`, {
      email: data.email,
      role: data.role,
    });
    return { ok: true, userId: newUserId };
  });

/** Saúde do banco: contagens agregadas. */
export const dbHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();

    const [profiles, aiTotal, aiWeek, mats, recentProfiles, recentAi] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("ai_outputs").select("id", { count: "exact", head: true }),
      supabase
        .from("ai_outputs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabase.from("materiais_files").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("ai_outputs")
        .select("id, title, kind, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      counts: {
        profiles: profiles.count ?? 0,
        ai_total: aiTotal.count ?? 0,
        ai_week: aiWeek.count ?? 0,
        materiais: mats.count ?? 0,
      },
      recent_profiles: recentProfiles.data ?? [],
      recent_ai: recentAi.data ?? [],
    };
  });

export const listAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Lista o conteúdo gerado por IA de todos os usuários (admin only). */
export const listAllOutputs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { data: outputs, error } = await supabase
      .from("ai_outputs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const ids = [...new Set((outputs ?? []).map((o: any) => o.user_id))];
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, display_name").in("id", ids)
      : { data: [] as any[] };
    const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name]));

    return (outputs ?? []).map((o: any) => ({ ...o, author_name: nameMap.get(o.user_id) ?? null }));
  });

/** Admin exclui qualquer item de conteúdo gerado (moderação). */
export const deleteOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context as any;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("ai_outputs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(supabase, userId, claims?.email, "delete_output", `ai_output:${data.id}`);
    return { ok: true };
  });

export const listAllMaterials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("materiais_files")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context as any;
    await assertAdmin(supabase, userId);
    const { data: row } = await supabase
      .from("materiais_files")
      .select("storage_path, title")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.storage_path) {
      await supabase.storage.from("materiais").remove([row.storage_path]);
    }
    const { error } = await supabase.from("materiais_files").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(supabase, userId, claims?.email, "delete_material", `material:${data.id}`, {
      title: row?.title,
    });
    return { ok: true };
  });