import { supabase } from "@/integrations/supabase/client";

export type ActivityKind = "view" | "ai_run" | "save" | "upload" | "action";

export async function logActivity(input: {
  userId: string;
  kind: ActivityKind;
  title: string;
  route?: string;
  details?: Record<string, unknown>;
}) {
  const { userId, kind, title, route, details } = input;
  try {
    await supabase.from("activity_log").insert({
      user_id: userId,
      kind,
      title,
      route: route ?? null,
      details: (details ?? {}) as never,
    });
  } catch {
    // best-effort logging; never blocks the UI
  }
}

export const KIENBAUM_PRODUCTS = [
  "Apresentação Geral da Kienbaum",
  "Assessment - Competence Check",
  "Coaching Executivo",
  "PDI Sprint",
  "Estratégia de Sucessão (BBB)",
  "Executive Search",
  "Peers Leadership",
] as const;
export type KienbaumProduct = (typeof KIENBAUM_PRODUCTS)[number];

export const MATERIAL_CATEGORIES = [
  "Apresentação Comercial",
  "Proposta Comercial",
  "One Pager",
  "Templates de E-mails",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];