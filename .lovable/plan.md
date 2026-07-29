# Plano de mudanças no Kienbaum CP Hub

Divido em 7 blocos. Todos usam Lovable AI (sem nova chave) e mantêm a estrutura TanStack Start / Cloud atual.

## 1. Reorganização da navegação (sidebar)

Nova estrutura em `src/lib/nav.ts` (renomeio de grupos, mesmas rotas — evita quebrar links salvos):

- **Equipe Comercial e de Relacionamento com o Cliente**
  - Perfil do Client Partner (`/treinamento/perfil`)
  - Blueprint de Processo (`/treinamento/blueprint`)
- **Treinamento Comercial**
  - Técnicas de Negociação
  - NPS & CSAT
  - Simulador de Vendas
  - **Sobre a Kienbaum** (novo — ver bloco 7)
- **Estratégia e Planejamento**
  - Revisão de Carteira
  - Preparação de Reunião
  - Calculadora de Remuneração (permanece com gate de Gestão)
- **Repositório**
  - Repositório de Materiais
  - Avaliação & Deck
- **Nutrição de Clientes**
  - Pesquisa de Concorrência
  - E-mails de Nutrição
- **Minha conta** (inalterado): Timeline, Meu histórico de IA

## 2. Ajustes pontuais nos módulos

- **NPS & CSAT** (`treinamento/nps-csat.tsx`): inverter ordem — CSAT à esquerda, NPS à direita (e o mesmo nos templates de e-mail).
- **Blueprint de Processo** (item 3): trocar "Qualificação (BANT + Go/No-Go)" por "Qualificação (SPIN Selling + Go/No-Go)" e ajustar tasks (`SPIN scorado` no lugar de `BANT scorado`).
- **Revisão de Carteira** (`rotina/carteira.tsx`): reordenar a página — bloco "Análise de Carteira com IA (upload)" vira o primeiro card; tabela manual + resumo/plano vão para o final.
- **Preparação de Reunião · aba 2**: acrescentar `FileDrop` para transcrição da reunião. O texto extraído entra no prompt do `prepareMeeting` como campo `transcricao` adicional (server function já suporta arquivos via `PickedFile`).

## 3. Repositório — produtos e categorias novos

- Atualizar `KIENBAUM_PRODUCTS` em `src/lib/activity.ts` para os 7 produtos: Apresentação Geral da Kienbaum, Assessment - Competence Check, Coaching Executivo, PDI Sprint, Estratégia de Sucessão (BBB), Executive Search, Peers Leadership.
- Redefinir `CATEGORIES` do admin/materiais para: Apresentação Comercial, Proposta Comercial, One Pager, Templates de E-mails.
- Página pública de Repositório (`materiais/repositorio.tsx`) passa a agrupar por produto e, dentro de cada card, subseções por categoria. Registros antigos ficam órfãos em um card "Sem produto" (já existe placeholder) — o admin reclassifica.

## 4. Redesign do Admin

Hoje o `/admin/*` usa cores hard-coded (`oklch(0.16 0.03 275)`, dourado `oklch(0.78 0.14 78)`, brancos com opacidade). Vou:

- Refazer `src/routes/admin/route.tsx` usando os tokens do design system (`bg-background`, `text-foreground`, `border-border`, `bg-card`), no mesmo padrão dos `PageContainer`/`PageHeader` do resto do app.
- Atualizar `admin/usuarios.tsx`, `admin/materiais.tsx`, `admin/historico.tsx`, `admin/saude.tsx` para trocar `bg-white/[0.03]`, `text-white/60`, cores fixas por classes semânticas (Card, Table, tokens).
- Trocar o accent dourado dos títulos por `text-primary`, já que…

## 5. Nova cor primária

Substituir a Kienbaum-red atual (`--primary: oklch(0.60 0.21 28)`) pelo cinza `#4b5563` do Freitas.
- Converto para oklch: `#4b5563` ≈ `oklch(0.418 0.019 258)`; ajusto também `--ring`, `--destructive` (deixo destructive separado, avermelhado sóbrio, se preferir posso alinhar 100%).
- Reviso onde ainda houver `bg-primary/text-primary-foreground` para garantir contraste (foreground → branco).

> Se você quiser manter algum vermelho como cor de destaque em ações destrutivas, me confirme; senão, adoto o cinza como primário único.

## 6. Deck — geração de HTML + chat de refinamento

Em `materiais/deck.tsx` e `src/lib/ai.functions.ts`:

- Nova server function `generateDeckHtml({ cliente, conteudo, file?, analiseAtual, mensagens[] })` que devolve `{ html, replyToUser }`. Prompt: gerar página HTML autocontida (inline styles, tipografia serifada + neutra, paleta atualizada) para envio ao cliente.
- Layout da página em duas colunas: à esquerda inputs + análise em texto (comportamento atual); à direita um **preview iframe** do HTML + botão "Baixar HTML" (Blob).
- Abaixo do preview, um **chat** simples (mensagens locais no estado + `useServerFn`) onde o CP escreve "diminua a seção X", "adicione slide de cases…". Cada turno reenvia o histórico + HTML atual para regenerar. Sem persistência inicial (posso adicionar depois se pedir).

## 7. E-mails de Nutrição — artigo de referência

- Em `nutricao/emails.tsx`, novos campos:
  - `FileDrop` "Artigo de referência (PDF)"
  - `Input` "URL do artigo (opcional)"
- Atualizar `nurtureEmail` (`src/lib/ai.functions.ts`) para receber `artigo?: PickedFile` e `artigoUrl?: string`, passando o texto extraído/URL como contexto do prompt: "embase o argumento em dados/frameworks de MIT, Harvard, INSEAD ou institutos de renome — inclua uma linha de referência ao artigo".

## 8. Espaço "Sobre a Kienbaum"

- Nova rota `src/routes/treinamento/sobre-kienbaum.tsx` dentro de "Treinamento Comercial".
- Duas seções:
  - **Quem é a Kienbaum** — texto institucional editorial (posso escrever um placeholder consultivo curto; você depois me passa o texto oficial se quiser).
  - **Guia de Estilo, Tom de Voz e Storytelling** — parseio o PDF anexado com `document--parse_document` e transformo o conteúdo em uma página estruturada (princípios, tom de voz, do/don't, exemplos). O PDF fica disponível para download como asset.

## Detalhes técnicos

- **Nav grouping**: apenas mudo `NAV`/`NAV_INDEX`; nada de mudar URLs pra não quebrar links salvos e itens em `activity_log`.
- **Categorias de materiais**: mudar `CATEGORIES` no admin não requer migration (é campo `text` livre). Se quiser enforce no banco, digo — não incluí para não bloquear uploads antigos.
- **HTML do deck**: gerado inline (sem storage) na v1; adiciono botão "Salvar como material" opcional depois.
- **Anexos AI**: reaproveito `PickedFile` + parse já usado em `analyzeCarteira`/`analyzeDeck`.
- Sem novas tabelas/migrations — tudo cabe nas server functions e componentes.

## Fora do escopo desta rodada (posso fazer depois)

- Persistir threads de chat do Deck no banco.
- Restringir upload por categoria/produto no banco (constraint / enum).
- Novos ícones específicos por produto Kienbaum.

Se aprovar, vou executar todos os blocos numa mesma leva.
