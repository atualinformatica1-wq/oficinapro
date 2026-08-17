import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Search, AlertTriangle, Download } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, INVENTORY_CATEGORY, TURNOVER_CLASS, labelOf } from "@/lib/format";
import { useRows, type InventoryItem } from "@/lib/db";

export const Route = createFileRoute("/relatorio-estoque")({
  head: () => ({
    meta: [
      { title: "Relatório de Estoque — MecânicaPRO" },
      { name: "description", content: "Análise completa do estoque: valorização, giro, alertas e categorias." },
    ],
  }),
  component: RelatorioEstoquePage,
});

const COLORS = ["hsl(217 91% 50%)", "hsl(152 69% 40%)", "hsl(36 90% 50%)", "hsl(262 70% 55%)", "hsl(0 74% 55%)", "hsl(190 80% 45%)", "hsl(330 70% 55%)"];

type Filter = "todos" | "criticos" | "parados" | "ok";

function RelatorioEstoquePage() {
  const { data: items = [] } = useRows<InventoryItem>("inventory_items", "name", true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("todos");
  const [filter, setFilter] = useState<Filter>("todos");

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalUnits = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
    const totalCost = items.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.purchase_price ?? 0), 0);
    const totalSale = items.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.sale_price ?? 0), 0);
    const potentialProfit = totalSale - totalCost;
    const low = items.filter((i) => Number(i.quantity) <= Number(i.min_stock));
    const zero = items.filter((i) => Number(i.quantity) === 0);
    const stopped = items.filter((i) => i.turnover_class === "estoque_parado");
    const avgMarkup = (() => {
      const arr = items.filter((i) => Number(i.purchase_price) > 0).map((i) => Number(i.markup_percent ?? 0));
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    })();
    return { totalItems, totalUnits, totalCost, totalSale, potentialProfit, low, zero, stopped, avgMarkup };
  }, [items]);

  const byCategory = useMemo(() => {
    return Object.keys(INVENTORY_CATEGORY).map((k) => {
      const list = items.filter((i) => i.category === k);
      const value = list.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.purchase_price ?? 0), 0);
      return { key: k, name: labelOf(INVENTORY_CATEGORY, k), count: list.length, value };
    }).filter((c) => c.count > 0);
  }, [items]);

  const byTurnover = useMemo(() => {
    return Object.keys(TURNOVER_CLASS).map((k) => ({
      name: labelOf(TURNOVER_CLASS, k),
      quantidade: items.filter((i) => i.turnover_class === k).length,
    }));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (cat !== "todos" && i.category !== cat) return false;
      const q = Number(i.quantity ?? 0);
      const min = Number(i.min_stock ?? 0);
      if (filter === "criticos" && q > min) return false;
      if (filter === "parados" && i.turnover_class !== "estoque_parado") return false;
      if (filter === "ok" && q <= min) return false;
      const s = search.toLowerCase();
      if (s && ![i.name, i.sku, (i as { original_code?: string }).original_code, i.supplier].some((v) => (v ?? "").toLowerCase().includes(s))) return false;
      return true;
    });
  }, [items, cat, filter, search]);

  const exportCsv = () => {
    const header = ["Nome", "Código Loja", "Código Original", "Categoria", "Qtd", "Mín", "Compra", "Venda", "Total Custo", "Total Venda", "Giro", "Fornecedor", "Local"];
    const rows = filtered.map((i) => [
      i.name,
      i.sku ?? "",
      (i as { original_code?: string }).original_code ?? "",
      labelOf(INVENTORY_CATEGORY, i.category),
      Number(i.quantity ?? 0),
      Number(i.min_stock ?? 0),
      Number(i.purchase_price ?? 0).toFixed(2),
      Number(i.sale_price ?? 0).toFixed(2),
      (Number(i.quantity ?? 0) * Number(i.purchase_price ?? 0)).toFixed(2),
      (Number(i.quantity ?? 0) * Number(i.sale_price ?? 0)).toFixed(2),
      labelOf(TURNOVER_CLASS, i.turnover_class),
      i.supplier ?? "",
      i.location ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-estoque-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: "Itens cadastrados", value: String(stats.totalItems) },
    { label: "Unidades em estoque", value: String(stats.totalUnits) },
    { label: "Valor em custo", value: fmtBRL(stats.totalCost) },
    { label: "Valor em venda", value: fmtBRL(stats.totalSale) },
    { label: "Lucro potencial", value: fmtBRL(stats.potentialProfit) },
    { label: "Markup médio", value: `${stats.avgMarkup.toFixed(1)}%` },
    { label: "Itens críticos", value: String(stats.low.length) },
    { label: "Itens zerados", value: String(stats.zero.length) },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Relatório de Estoque"
        subtitle="Valorização, giro e alertas"
        action={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> CSV</Button>
            <Button onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Imprimir</Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="card-shadow">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="truncate text-lg font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.low.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{stats.low.length} item(ns) precisam de reposição: {stats.low.slice(0, 5).map((i) => i.name).join(", ")}{stats.low.length > 5 ? "..." : ""}</span>
        </div>
      )}

      <div className="mb-4 grid gap-4 lg:grid-cols-2 print:hidden">
        <Card className="card-shadow">
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Valor em custo por categoria</h2>
            <div className="h-56">
              {byCategory.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Sem dados.</p>
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
        <Card className="card-shadow">
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Itens por classe de giro</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byTurnover}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantidade" name="Itens" fill="hsl(217 91% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row print:hidden">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, código, fornecedor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {Object.entries(INVENTORY_CATEGORY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os itens</SelectItem>
            <SelectItem value="criticos">Somente críticos</SelectItem>
            <SelectItem value="parados">Estoque parado</SelectItem>
            <SelectItem value="ok">Estoque saudável</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Compra</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Venda</TableHead>
                <TableHead className="text-right">Total custo</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Total venda</TableHead>
                <TableHead className="hidden md:table-cell">Giro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Nenhum item.</TableCell></TableRow>
              ) : (
                filtered.map((i) => {
                  const q = Number(i.quantity ?? 0);
                  const pc = Number(i.purchase_price ?? 0);
                  const pv = Number(i.sale_price ?? 0);
                  const isLow = q <= Number(i.min_stock ?? 0);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="max-w-56 truncate font-medium">
                        {i.name}
                        {i.sku && <div className="text-xs text-muted-foreground">{i.sku}</div>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell"><StatusBadge map={INVENTORY_CATEGORY} value={i.category} /></TableCell>
                      <TableCell className={`text-right font-semibold ${isLow ? "text-destructive" : ""}`}>
                        {q}{isLow && <AlertTriangle className="ml-1 inline h-3.5 w-3.5" />}
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">{fmtBRL(pc)}</TableCell>
                      <TableCell className="hidden text-right sm:table-cell">{fmtBRL(pv)}</TableCell>
                      <TableCell className="text-right">{fmtBRL(q * pc)}</TableCell>
                      <TableCell className="hidden text-right lg:table-cell">{fmtBRL(q * pv)}</TableCell>
                      <TableCell className="hidden md:table-cell"><StatusBadge map={TURNOVER_CLASS} value={i.turnover_class} /></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">Gerado em {new Date().toLocaleString("pt-BR")}</p>
    </div>
  );
}
