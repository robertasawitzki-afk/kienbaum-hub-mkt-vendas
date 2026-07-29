import {
  Users2,
  GraduationCap,
  Target,
  FolderOpen,
  Sprout,
  User,
  UserSquare2,
  Workflow,
  Handshake,
  Gauge,
  Bot,
  PieChart,
  CalendarCheck,
  FileSearch,
  Search,
  Mail,
  Calculator,
  History,
  Activity,
  BookOpen,
  FileSignature,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  requireGestao?: boolean;
};

export type NavGroup = {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  items: NavItem[];
  requireGestao?: boolean;
};

export const NAV: NavGroup[] = [
  {
    slug: "estrategia-planejamento",
    label: "Estratégia e Planejamento",
    shortLabel: "Estratégia e Planejamento",
    description: "Revisão de carteira, preparação de reuniões e remuneração.",
    icon: Target,
    items: [
      { to: "/rotina/carteira", label: "Revisão de Carteira", icon: PieChart },
      { to: "/rotina/reuniao", label: "Preparação de Reunião", icon: CalendarCheck },
      { to: "/gestao/remuneracao", label: "Calculadora de Remuneração", icon: Calculator, requireGestao: true },
    ],
  },
  {
    slug: "nutricao-clientes",
    label: "Nutrição de Clientes",
    shortLabel: "Nutrição de Clientes",
    description: "Pesquisa de concorrência e e-mails de nutrição com IA.",
    icon: Sprout,
    items: [
      { to: "/nutricao/concorrencia", label: "Pesquisa de Concorrência", icon: Search },
      { to: "/nutricao/emails", label: "E-mails de Nutrição", icon: Mail },
    ],
  },
  {
    slug: "repositorio",
    label: "Repositório",
    shortLabel: "Repositório",
    description: "Materiais comerciais, avaliação de decks e geração de propostas.",
    icon: FolderOpen,
    items: [
      { to: "/materiais/repositorio", label: "Repositório de Materiais", icon: FolderOpen },
      { to: "/materiais/deck", label: "Avaliação & Deck", icon: FileSearch },
      { to: "/propostas", label: "Geração de Propostas de Competence Check", icon: FileSignature },
    ],
  },
  {
    slug: "treinamento-comercial",
    label: "Treinamento Comercial",
    shortLabel: "Treinamento Comercial",
    description: "Técnicas, indicadores, simulações e identidade Kienbaum.",
    icon: GraduationCap,
    items: [
      { to: "/treinamento/tecnicas", label: "Técnicas de Negociação", icon: Handshake },
      { to: "/treinamento/nps-csat", label: "NPS & CSAT", icon: Gauge },
      { to: "/treinamento/simulador", label: "Simulador de Vendas", icon: Bot },
      { to: "/treinamento/sobre", label: "Sobre a Kienbaum", icon: BookOpen },
    ],
  },
  {
    slug: "equipe-comercial",
    label: "Equipe Comercial e de Relacionamento com o Cliente",
    shortLabel: "Equipe Comercial e de Relacionamento",
    description: "Perfil do Client Partner e blueprint do processo comercial.",
    icon: Users2,
    items: [
      { to: "/treinamento/perfil", label: "Perfil do Client Partner", icon: UserSquare2 },
      { to: "/treinamento/blueprint", label: "Blueprint de Processo", icon: Workflow },
    ],
  },
  {
    slug: "minha-conta",
    label: "Minha Conta",
    shortLabel: "Minha Conta",
    description: "Seu perfil, timeline de atividades e histórico de IA.",
    icon: User,
    items: [
      { to: "/conta", label: "Meu Perfil", icon: User },
      { to: "/timeline", label: "Timeline", icon: Activity },
      { to: "/historico", label: "Meu histórico de IA", icon: History },
    ],
  },
];

export const NAV_INDEX: Record<string, { label: string; group: string }> = Object.fromEntries(
  NAV.flatMap((g) =>
    g.items.map((i) => [i.to, { label: i.label, group: g.label }] as const),
  ),
);
