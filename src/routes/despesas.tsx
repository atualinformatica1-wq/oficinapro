import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtDate, EXPENSE_CATEGORY, EXPENSE_STATUS, COST_TYPE } from "@/lib/format";
import { useRows, useSave, useRemove, type Expense } from "@/lib/db";

export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — MecânicaPRO" },
      { name: "description", content: "Controle de despesas fixas e variáveis da oficina." },
    ],
  }),
  component: DespesasPage,
});

function DespesasPage() {
  const { data: expenses = [] } = useRows<Expense>("expenses", "expense_date", false);
  const save = useSave("expenses");
  const remove = useRemove("expenses");
  const [cat, setCat] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Expense>>({});
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (e: Expense) => e.payment_status !== "pago" && e.due_date != null && e.due_date < today;

  const filtered = expenses.filter(
    (e) => (cat === "todos" || e.category === cat) && (status === "todos" || e.payment_status === status),
  );

  const handleSave = () => {
    if (!form.description?.trim()) return toast.error("Informe a descrição");
    save.mutate(
      { ...form, due_date: form.due_date || null, expense_date: form.expense_date || today },
      { onSuccess: () => { toast.success("Despesa salva"); setOpen(false); }, onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Despesas"
        subtitle={`Total listado: ${fmtBRL(filtered.reduce((s, e) => s + Number(e.amount), 0))}`}
        action={
          <Button onClick={() => { setForm({ category: "outros", payment_status: "pendente", cost_type: "fixo", is_recurring: false, expense_date: today }); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Nova Despesa
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {Object.entries(EXPENSE_CATEGORY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(EXPENSE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma despesa.</TableCell></TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id} className={isOverdue(e) ? "bg-destructive/5" : ""}>
                    <TableCell className="max-w-52 truncate font-medium">
                      {e.description}
                      {e.is_recurring && <span className="ml-1 text-xs text-muted-foreground">(recorrente)</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell"><StatusBadge map={EXPENSE_CATEGORY} value={e.category} /></TableCell>
                    <TableCell className={`hidden sm:table-cell ${isOverdue(e) ? "font-semibold text-destructive" : ""}`}>
                      {e.due_date ? fmtDate(e.due_date) : "—"}
                    </TableCell>
                    <TableCell><StatusBadge map={EXPENSE_STATUS} value={isOverdue(e) ? "atrasado" : e.payment_status} /></TableCell>
                    <TableCell className="text-right font-semibold">{fmtBRL(Number(e.amount))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setForm(e); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Excluir despesa?")) remove.mutate(e.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Descrição *</Label><Input value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category ?? "outros"} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EXPENSE_CATEGORY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor</Label><Input type="number" step="0.01" value={form.amount ?? ""} onChange={(e) => set("amount", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
            <div><Label>Data da despesa</Label><Input type="date" value={form.expense_date ?? ""} onChange={(e) => set("expense_date", e.target.value)} /></div>
            <div><Label>Vencimento</Label><Input type="date" value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.payment_status ?? "pendente"} onValueChange={(v) => set("payment_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EXPENSE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de custo</Label>
              <Select value={form.cost_type ?? "fixo"} onValueChange={(v) => set("cost_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(COST_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fornecedor</Label><Input value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)} /></div>
            <div className="flex items-center gap-2 pt-5">
              <Checkbox checked={!!form.is_recurring} onCheckedChange={(v) => set("is_recurring", !!v)} id="rec" />
              <Label htmlFor="rec">Despesa recorrente</Label>
            </div>
            <div className="sm:col-span-2"><Label>Notas</Label><Input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
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
