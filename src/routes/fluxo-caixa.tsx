import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtDate, CASHFLOW_TYPE, PAYMENT_METHOD } from "@/lib/format";
import { useRows, useSave, useRemove, type CashFlowEntry, type ServiceOrder, type Sale } from "@/lib/db";

export const Route = createFileRoute("/fluxo-caixa")({
  head: () => ({
    meta: [
      { title: "Fluxo de Caixa — MecânicaPRO" },
      { name: "description", content: "Entradas, saídas e saldo do mês com gráfico semanal." },
    ],
  }),
  component: FluxoPage,
});

interface Tx {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  method?: string | null;
  manual: boolean;
  source?: "os" | "pdv";
}

function FluxoPage() {
  const { data: cash = [] } = useRows<CashFlowEntry>("cash_flow", "transaction_date", false);
  const { data: orders = [] } = useRows<ServiceOrder>("service_orders");
  const { data: sales = [] } = useRows<Sale>("sales");
  const save = useSave("cash_flow");
  const remove = useRemove("cash_flow");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<CashFlowEntry>>({});
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const month = new Date().toISOString().slice(0, 7);

  const txs: Tx[] = useMemo(() => {
    const manual: Tx[] = cash.map((c) => ({
      id: c.id,
      date: c.transaction_date,
      description: c.description,
      type: c.type,
      amount: Number(c.amount),
      method: c.payment_method,
      manual: true,
    }));
    const fromOS: Tx[] = orders
      .filter((o) => o.status === "concluida")
      .map((o) => ({
        id: o.id,
        date: (o.completion_date ?? o.entry_date ?? "").slice(0, 10),
        description: `${o.order_number} — ${o.client_name}`,
        type: "entrada",
        amount: Number(o.total_price),
        method: o.payment_method,
        manual: false,
        source: "os" as const,
      }));
    const fromSales: Tx[] = sales.map((s) => ({
      id: s.id,
      date: (s.created_at ?? "").slice(0, 10),
      description: `PDV — ${s.client_name ?? "Consumidor"}`,
      type: "entrada",
      amount: Number(s.total),
      method: s.payment_method,
      manual: false,
      source: "pdv" as const,
    }));
    return [...manual, ...fromOS, ...fromSales].sort((a, b) => b.date.localeCompare(a.date));
  }, [cash, orders, sales]);

  const monthTx = txs.filter((t) => t.date.startsWith(month));
  const inflow = monthTx.filter((t) => t.type === "entrada").reduce((s, t) => s + t.amount, 0);
  const outflow = monthTx.filter((t) => t.type === "saida").reduce((s, t) => s + t.amount, 0);

  const weekly = useMemo(() => {
    const weeks: Record<string, { semana: string; entradas: number; saidas: number }> = {};
    for (const t of monthTx) {
      const day = Number(t.date.slice(8, 10));
      const w = `Semana ${Math.min(4, Math.ceil(day / 7))}`;
      weeks[w] ??= { semana: w, entradas: 0, saidas: 0 };
      if (t.type === "entrada") weeks[w].entradas += t.amount;
      else weeks[w].saidas += t.amount;
    }
    return Object.values(weeks).sort((a, b) => a.semana.localeCompare(b.semana));
  }, [monthTx]);

  const handleSave = () => {
    if (!form.description?.trim()) return toast.error("Informe a descrição");
    save.mutate(
      { ...form, transaction_date: form.transaction_date || new Date().toISOString().slice(0, 10) },
      { onSuccess: () => { toast.success("Lançamento salvo"); setOpen(false); }, onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Fluxo de Caixa"
        subtitle="Lançamentos manuais + OS concluídas"
        action={
          <Button onClick={() => { setForm({ type: "entrada", transaction_date: new Date().toISOString().slice(0, 10) }); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Novo Lançamento
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Entradas do mês</p><p className="truncate text-xl font-bold text-success">{fmtBRL(inflow)}</p></CardContent></Card>
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Saídas do mês</p><p className="truncate text-xl font-bold text-destructive">{fmtBRL(outflow)}</p></CardContent></Card>
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Saldo</p><p className={`truncate text-xl font-bold ${inflow - outflow >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(inflow - outflow)}</p></CardContent></Card>
      </div>

      <Card className="card-shadow mb-4">
        <CardContent className="p-4">
          <h2 className="mb-2 text-sm font-semibold">Entradas vs Saídas por semana</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <XAxis dataKey="semana" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(152 69% 40%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(0 74% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Forma</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.slice(0, 100).map((t) => (
                <TableRow key={`${t.source ?? "manual"}-${t.id}`}>
                  <TableCell>{fmtDate(t.date)}</TableCell>
                  <TableCell className="max-w-52 truncate">{t.description}{t.source && <span className="ml-1 text-xs text-muted-foreground">({t.source === "os" ? "OS" : "PDV"})</span>}</TableCell>
                  <TableCell><StatusBadge map={CASHFLOW_TYPE} value={t.type} /></TableCell>
                  <TableCell className="hidden sm:table-cell">{t.method ? PAYMENT_METHOD[t.method]?.label : "—"}</TableCell>
                  <TableCell className={`text-right font-semibold ${t.type === "entrada" ? "text-success" : "text-destructive"}`}>
                    {t.type === "entrada" ? "+" : "-"}{fmtBRL(t.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {t.manual && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Excluir lançamento?")) remove.mutate(t.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {txs.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma transação.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Descrição *</Label><Input value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type ?? "entrada"} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CASHFLOW_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor</Label><Input type="number" step="0.01" value={form.amount ?? ""} onChange={(e) => set("amount", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
              <div><Label>Data</Label><Input type="date" value={form.transaction_date ?? ""} onChange={(e) => set("transaction_date", e.target.value)} /></div>
              <div>
                <Label>Forma de pagamento</Label>
                <Select value={form.payment_method ?? ""} onValueChange={(v) => set("payment_method", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{Object.entries(PAYMENT_METHOD).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Categoria</Label><Input value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={save.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
