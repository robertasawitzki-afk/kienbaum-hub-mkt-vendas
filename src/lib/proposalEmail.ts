import { esc } from "@/lib/proposalTemplate";
import { KIENBAUM_LOGO_GRAY } from "@/lib/kienbaumBrandAssets";

export function buildSlug(codigo: string, data: string, empresa: string): string {
  const ano = (data || "").slice(0, 4) || String(new Date().getFullYear());
  const codigoSlug = (codigo || "PROP").trim().replace(/[^a-zA-Z0-9]/g, "") || "PROP";
  const empresaSlug = (empresa || "Cliente").trim().split(/\s+/)[0]?.replace(/[^a-zA-Z0-9]/g, "") || "Cliente";
  return `${codigoSlug}-${ano}_Proposta_CC_${empresaSlug}`;
}

export function buildEmailHTML(params: {
  interlocutor: string;
  empresa: string;
  consultora: string;
  link: string;
}): string {
  const { interlocutor, empresa, consultora, link } = params;
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#28434F;max-width:560px;margin:0 auto;font-size:14px;line-height:1.5">
  <p>Olá ${esc(interlocutor)},</p>
  <p>Segue o link da proposta comercial preparada para ${esc(empresa)}.</p>
  <div style="text-align:center;margin:28px 0">
    <a href="${esc(link)}" style="background-color:#28434F;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:14px;display:inline-block;font-family:Arial,Helvetica,sans-serif">Acessar Proposta de Competence Check</a>
  </div>
  <p>Qualquer dúvida, estou à disposição.</p>
  <p>Atenciosamente,<br>${esc(consultora)}</p>
  <img src="${KIENBAUM_LOGO_GRAY}" alt="Kienbaum" style="height:28px;margin-top:8px">
</div>`;
}
