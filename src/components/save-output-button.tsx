import { useState } from "react";
import { Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

type Kind = Database["public"]["Enums"]["ai_kind"];

export function SaveOutputButton({
  kind, title, content, meta, disabled,
}: {
  kind: Kind;
  title: string;
  content: string;
  meta?: Record<string, unknown>;
  disabled?: boolean;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!user) return;
    setState("saving"); setErr(null);
    const { error } = await supabase.from("ai_outputs").insert({
      user_id: user.id, kind, title, content, meta: (meta ?? {}) as never,
    });
    if (error) { setErr(error.message); setState("error"); return; }
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={save} disabled={disabled || !user || state === "saving"}>
        {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> :
         state === "saved" ? <Check className="h-4 w-4 text-primary" /> :
         <Save className="h-4 w-4" />}
        {state === "saved" ? "Salvo no histórico" : "Salvar no histórico"}
      </Button>
      {err && <span className="text-xs text-destructive">{err}</span>}
    </div>
  );
}