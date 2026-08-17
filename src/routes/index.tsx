import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wrench,
  ShoppingCart,
  Users,
  Package,
  Receipt,
  TrendingUp,
  Clock,
  Wallet,
  AlertCircle,
  History,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL } from "@/lib/format";
import { OS_STATUS } from "@/lib/format";
import { useRows, type ServiceOrder, type CashFlowEntry, type Sale } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — MecânicaPRO" },
      { name: "description", content: "Página inicial do MecânicaPRO: acesse rapidamente ordens de serviço, PDV, clientes, estoque e despesas." },
    ],
  }),
  component: HomePage,
});

// Menu principal com ícones coloridos
const mainMenus = [
  {
    title: "Ordem de Serviço",
    subtitle: "Abra e gerencie OS",
    url: "/ordens",
    icon: Wrench,
    // azul
    iconColor: "text-sky-400",
    ring: "ring-sky-400/30",
    bg: "bg-sky-500/10",
    glow: "group-hover:bg-sky-500/20",
  },
  {
    title: "PDV",
    subtitle: "Ponto de venda",
    url: "/pdv",
    icon: ShoppingCart,
    // verde
    iconColor: "text-emerald-400",
    ring: "ring-emerald-400/30",
    bg: "bg-emerald-500/10",
    glow: "group-hover:bg-emerald-500/20",
  },
  {
    title: "Clientes",
    subtitle: "Cadastros e histórico",
    url: "/clientes",
    icon: Users,
    // roxo
    iconColor: "text-violet-400",
    ring: "ring-violet-400/30",
    bg: "bg-violet-500/10",
    glow: "group-hover:bg-violet-500/20",
  },
  {
    title: "Estoque",
    subtitle: "Peças e produtos",
    url: "/estoque",
    icon: Package,
    // âmbar
    iconColor: "text-amber-400",
    ring: "ring-amber-400/30",
    bg: "bg-amber-500/10",
    glow: "group-hover:bg-amber-500/20",
  },
  {
    title: "Despesas",
    subtitle: "Controle de saídas",
    url: "/despesas",
    icon: Receipt,
    // vermelho/rosa
    iconColor: "text-rose-400",
    ring: "ring-rose-400/30",
    bg: "bg-rose-500/10",
    glow: "group-hover:bg-rose-500/20",
  },
] as const;

function HomePage() {
  const { data: orders = [] } = useRows<ServiceOrder>("service_orders");
  const { data: cash = [] } = useRows<CashFlowEntry>("cash_flow");
  const { data: sales = [] } = useRows<Sale>("sales");

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const openOrders = orders.filter((o) => !["concluida", "cancelada"].includes(o.status));
  const entriesToday =
    cash.filter((c) => c.type === "entrada" && c.transaction_date === today).reduce((s, c) => s + Number(c.amount), 0) +
    sales.filter((s) => (s.created_at ?? "").slice(0, 10) === today).reduce((s2, s) => s2 + Number(s.total), 0) +
    orders
      .filter((o) => o.status === "concluida" && (o.completion_date ?? "").slice(0, 10) === today)
      .reduce((s, o) => s + Number(o.total_price), 0);
  const monthRevenue =
    orders
      .filter((o) => o.status === "concluida" && (o.completion_date ?? o.entry_date ?? "").slice(0, 7) === month)
      .reduce((s, o) => s + Number(o.total_price), 0) +
    sales.filter((s) => (s.created_at ?? "").slice(0, 7) === month).reduce((s2, s) => s2 + Number(s.total), 0);
  const pendingReceivable = orders
    .filter((o) => ["pendente", "parcial", "inadimplente"].includes(o.payment_status) && o.status !== "cancelada")
    .reduce((s, o) => s + Number(o.total_price), 0);

  const statusCounts = openOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const last5 = orders.slice(0, 5);

  const metrics = [
    { label: "OS Abertas", value: String(openOrders.length), icon: Clock },
    { label: "Entradas Hoje", value: fmtBRL(entriesToday), icon: Wallet },
    { label: "Receita do Mês", value: fmtBRL(monthRevenue), icon: TrendingUp },
    { label: "Receber Pendente", value: fmtBRL(pendingReceivable), icon: AlertCircle },
  ];

  return (
    <div className="hero-gradient min-h-full">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">
            Mecânica<span className="text-primary">PRO</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">Acesse os principais módulos da sua oficina</p>
        </div>

        {/* Menu principal com ícones coloridos */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Menu Principal</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {mainMenus.map((m) => (
              <Link key={m.url} to={m.url} className="group">
                <div
                  className={`flex h-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center ring-1 ${m.ring} backdrop-blur transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl`}
                >
                  <div
                    className={`grid h-16 w-16 place-items-center rounded-2xl ${m.bg} ${m.glow} transition-colors`}
                  >
                    <m.icon className={`h-8 w-8 ${m.iconColor}`} strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{m.title}</p>
                    <p className="mt-0.5 text-xs text-white/50">{m.subtitle}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Métricas rápidas */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Resumo</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((m) => (
              <Card key={m.label} className="border-white/10 bg-white/5 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-white/60">
                    <m.icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{m.label}</span>
                  </div>
                  <p className="mt-2 truncate text-xl font-bold text-white md:text-2xl">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {Object.keys(statusCounts).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className="flex items-center gap-1.5">
                <StatusBadge map={OS_STATUS} value={status} />
                <span className="text-sm font-semibold text-white">{count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Atalhos extras */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Outros Acessos</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/historico-clientes"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition-colors hover:bg-white/10"
            >
              <History className="h-4 w-4 text-info" />
              Histórico de Clientes
            </Link>
          </div>
        </div>

        {/* Últimas OS */}
        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Últimas Ordens de Serviço</h2>
            {last5.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/50">
                Nenhuma OS cadastrada ainda.{" "}
                <Link to="/ordens" className="text-primary underline">
                  Criar a primeira
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {last5.map((o) => (
                  <Link
                    key={o.id}
                    to="/ordens"
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {o.order_number} · {o.client_name}
                      </p>
                      <p className="truncate text-xs text-white/50">
                        {o.vehicle_model} {o.vehicle_plate ? `· ${o.vehicle_plate}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge map={OS_STATUS} value={o.status} />
                      <span className="text-sm font-semibold text-white">{fmtBRL(Number(o.total_price))}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
