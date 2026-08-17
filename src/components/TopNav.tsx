import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wrench,
  Users,
  History,
  Package,
  UserCog,
  Truck,
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
  ChevronDown,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const operacao = [
  { title: "Ordens de Serviço", url: "/ordens", icon: Wrench },
  { title: "PDV", url: "/pdv", icon: ShoppingCart },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Histórico de Clientes", url: "/historico-clientes", icon: History },
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Técnicos", url: "/tecnicos", icon: UserCog },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck },
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

export function TopNav() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const groupActive = (items: typeof operacao) =>
    items.some((i) => i.url === currentPath);

  const DesktopGroup = ({
    label,
    items,
  }: {
    label: string;
    items: typeof operacao;
  }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            groupActive(items) && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          {label}
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {items.map((item) => (
          <DropdownMenuItem key={item.url} asChild>
            <Link to={item.url} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sidebar-border bg-sidebar print:hidden">
      <div className="flex h-14 items-center gap-2 px-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-sidebar-accent-foreground sm:inline">
            Mecânica<span className="text-sidebar-primary">PRO</span>
          </span>
        </Link>

        <nav className="ml-4 hidden flex-wrap items-center gap-1 lg:flex">
          {[{ title: "Dashboard", url: "/", icon: LayoutDashboard }, ...operacao].map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                currentPath === item.url && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <DesktopGroup label="Financeiro" items={financeiro} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:inline-flex"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto bg-sidebar p-4">
              <div className="mt-6 space-y-4">
                <MobileGroup
                  label="Operação"
                  items={[{ title: "Dashboard", url: "/", icon: LayoutDashboard }, ...operacao]}
                  currentPath={currentPath}
                  onNavigate={() => setMobileOpen(false)}
                />
                <MobileGroup
                  label="Financeiro"
                  items={financeiro}
                  currentPath={currentPath}
                  onNavigate={() => setMobileOpen(false)}
                />
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MobileGroup({
  label,
  items,
  currentPath,
  onNavigate,
}: {
  label: string;
  items: { title: string; url: string; icon: typeof Wrench }[];
  currentPath: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              currentPath === item.url && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
