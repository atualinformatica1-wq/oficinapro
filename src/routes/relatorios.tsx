import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { fmtBRL, OS_CATEGORY, labelOf } from "@/lib/format";
import { useRows, type ServiceOrder, type Expense, type Sale } from "@/lib/db";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — MecânicaPRO" },
      { name: "description", content: "DRE simplificado, KPIs e análise de break-even da oficina." },
    ],
  }),
  component: RelatoriosPage,
});

const COLORS = ["hsl(217 91% 50%)", "hsl(152 69% 40%)", "hsl(36 90% 50%)", "hsl(262 70% 55%)", "hsl(0 74% 55%)"];

function RelatoriosPage() {
  const { data: orders = [] } = useRows<ServiceOrder>("service_orders");
  const { data: expenses = [] } = useRows<Expense>("expenses");
  const { data: sales = [] } = useRows<Sale>("sales");
  const [period, setPeriod] = useState("mes");

  const start = useMemo(() => {
    const now = new Date();
    if (period === "mes") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "trimestre") return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return new Date(now.getFullYear(), 0, 1);
  }, [period]);
  const startStr = start.toISOString().slice(0, 10);

  const done = orders.filter((o) => o.status === "concluida" && (o.completion_date ?? o.entry_date ?? "").slice(0, 10) >= startStr);
  const periodSales = sales.filter((s) => (s.created_at ?? "").slice(0, 10) >= startStr);
  const periodExpenses = expenses.filter((e) => e.expense_date >= startStr);

  const grossRevenue = done.reduce((s, o) => s + Number(o.total_price), 0) + periodSales.reduce((s2, s) => s2 + Number(s.total), 0);
  const costs = done.reduce((s, o) => s + Number(o.total_cost), 0);
  const totalExpenses = periodExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = grossRevenue - costs - totalExpenses;
  const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const avgTicket = done.length ? done.reduce((s, o) => s + Number(o.total_price), 0) / done.length : 0;
  const hours = done.reduce((s, o) => s + Number(o.actual_hours ?? 0), 0);
  const markups = done.filter((o) => Number(o.total_cost) > 0).map((o) => ((Number(o.total_price) - Number(o.total_cost)) / Number(o.total_cost)) * 100);
  const avgMarkup = markups.length ? markups.reduce((a, b) => a + b, 0) / markups.length : 0;

  const fixed = periodExpenses.filter((e) => e.cost_type === "fixo").reduce((s, e) => s + Number(e.amount), 0);
  const cmRatio = grossRevenue > 0 ? (grossRevenue - costs) / grossRevenue : 0;
  const breakEven = cmRatio > 0 ? fixed / cmRatio : 0;

  const byCategory = Object.keys(OS_CATEGORY).map((k) => ({
    name: labelOf(OS_CATEGORY, k),
    value: done.filter((o) => o.category === k).reduce((s, o) => s + Number(o.total_price), 0),
  })).filter((c) => c.value > 0);

  const revVsCost = [{ name: "Período", receita: grossRevenue, custo: costs, despesas: totalExpenses }];

  const dre = [
    { label: "Receita Bruta", value: grossRevenue, cls: "text-success" },
    { label: "(-) Custos (peças + mão de obra)", value: -costs, cls: "text-destructive" },
    { label: "(-) Despesas Operacionais", value: -totalExpenses, cls: "text-destructive" },
    { label: "= Lucro Líquido", value: netProfit, cls: netProfit >= 0 ? "text-success" : "text-destructive" },
  ];

  const kpis = [
    { label: "Ticket Médio", value: fmtBRL(avgTicket) },
    { label: "OS no Período", value: String(done.length) },
    { label: "Horas Trabalhadas", value: String(hours) },
    { label: "Markup Médio", value: `${avgMarkup.toFixed(1)}%` },
    { label: "Margem Líquida", value: `${margin.toFixed(1)}%` },
    { label: "Break-even (fixos)", value: fmtBRL(breakEven) },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Relatórios"
        subtitle="DRE simplificado e indicadores"
        action={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Mês atual</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Ano</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="card-shadow">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="truncate text-lg font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-shadow">
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold">DRE Simplificado</h2>
            <div className="space-y-2">
              {dre.map((l) => (
                <div key={l.label} className="flex justify-between border-b pb-2 text-sm last:border-0 last:font-bold">
                  <span>{l.label}</span>
                  <span className={l.cls}>{fmtBRL(l.value)}</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Margem líquida: {margin.toFixed(1)}% · Ponto de equilíbrio sobre custos fixos: {fmtBRL(breakEven)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Receita por Categoria</h2>
            <div className="h-56">
              {byCategory.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Sem dados no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label={(e) => e.name}>
                      {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow lg:col-span-2">
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Receita vs Custos vs Despesas</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revVsCost}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="hsl(152 69% 40%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custo" name="Custos" fill="hsl(36 90% 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(0 74% 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
