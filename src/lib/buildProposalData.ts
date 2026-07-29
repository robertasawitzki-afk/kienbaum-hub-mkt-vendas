import { DEFAULT_LOGOS } from "@/lib/defaultLogos";
import type { DadosPropostaTemplate } from "@/lib/proposalTemplate";

export function montarDadosCompletos(d: any): DadosPropostaTemplate {
  const total_avaliados = (d.qtd_alta || 0) + (d.qtd_media || 0) + (d.qtd_baixa || 0);
  const subtotal_por_nivel =
    (d.qtd_alta || 0) * (d.valor_alta || 0) +
    (d.qtd_media || 0) * (d.valor_media || 0) +
    (d.qtd_baixa || 0) * (d.valor_baixa || 0);
  const credenciais_todas = [
    ...((d.credenciais || []) as string[]).map((nome) => ({
      nome,
      logo: d.credenciais_logos?.[nome] || DEFAULT_LOGOS[nome],
    })),
    ...(d.credencial_extra
      ? [{ nome: d.credencial_extra, logo: d.credencial_extra_logo || DEFAULT_LOGOS[d.credencial_extra] }]
      : []),
  ];
  return { ...d, total_avaliados, subtotal_por_nivel, credenciais_todas };
}
