import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wrench,
  Users,
  History,
  Package,
  UserCog,
  ShoppingCart,
  Receipt,
  ArrowLeftRight,
  BarChart3,
  Target,
  Calculator,
  BookOpen,
  Lock,
  Settings,
  LogOut,

} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const operacao = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Ordens de Serviço", url: "/ordens", icon: Wrench },
  { title: "PDV", url: "/pdv", icon: ShoppingCart },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Histórico de Clientes", url: "/historico-clientes", icon: History },
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Técnicos", url: "/tecnicos", icon: UserCog },
];

const financeiro = [
  { title: "Despesas", url: "/despesas", icon: Receipt },
  { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: ArrowLeftRight },
  { title: "Fechamento de Caixa", url: "/fechamento-caixa", icon: Lock },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Relatório de Estoque", url: "/relatorio-estoque", icon: Package },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "Precificação", url: "/precificacao", icon: Calculator },
  { title: "Guia Financeiro", url: "/guia", icon: BookOpen },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const renderItems = (items: typeof operacao) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={currentPath === item.url} tooltip={item.title}>
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-sidebar-accent-foreground">
              Mecânica<span className="text-sidebar-primary">PRO</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(operacao)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(financeiro)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!collapsed && user?.email && (
          <div className="px-2 py-1 text-xs text-sidebar-foreground/60 truncate" title={user.email}>
            {user.email}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sair">
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
