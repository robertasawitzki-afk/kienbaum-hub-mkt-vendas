import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth-context";
import kienbaumMark from "@/assets/kienbaum-mark-white.png";
import peerzMark from "@/assets/peerz-mark-gray.png";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin, canAccessGestao } = useAuth();

  const visibleGroups = NAV
    .filter((g) => (g.requireGestao ? canAccessGestao : true))
    .map((g) => ({ ...g, items: g.items.filter((i) => (i.requireGestao ? canAccessGestao : true)) }))
    .filter((g) => g.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 items-center gap-2">
            <img src={kienbaumMark} alt="Kienbaum" className="h-7 w-auto" />
            <span className="h-5 w-px bg-sidebar-border" />
            <img src={peerzMark} alt="Peerz" className="h-6 w-auto" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Kienbaum</span>
            <span className="text-[10px] text-muted-foreground">Hub de Marketing e Vendas</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
                <GroupIcon className="h-3.5 w-3.5" />
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.to;
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link to={item.to}>
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <div className="mt-auto border-t border-sidebar-border p-2">
        <Link
          to="/admin"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground group-data-[collapsible=icon]:justify-center"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="group-data-[collapsible=icon]:hidden">
            {isAdmin ? "Painel Admin" : "Configurar admin"}
          </span>
        </Link>
      </div>
    </Sidebar>
  );
}