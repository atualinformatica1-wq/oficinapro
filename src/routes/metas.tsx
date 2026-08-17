import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtDate, GOAL_TYPE, GOAL_PERIOD, GOAL_STATUS, labelOf } from "@/lib/format";
import { useRows, useSave, useRemove, type FinancialGoal } from "@/lib/db";

export const Route = createFileRoute("/metas")({
  head: () => ({
    meta: [
      { title: "Metas — MecânicaPRO" },
      { name: "description", content: "Metas financeiras da oficina com acompanhamento de progresso." },
    ],
  }),
  component: MetasPage,
});

const isMoney = (t?: string | null) => !["carros_atendidos", "margem_liquida"].includes(t ?? "");

function MetasPage() {
  const { data: goals = [] } = useRows<FinancialGoal>("financial_goals");
  const save = useSave("financial_goals");
  const remove = useRemove("financial_goals");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<FinancialGoal>>({});
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title?.trim()) return toast.error("Informe o título da meta");
    save.mutate(
      { ...form, deadline: form.deadline || null },
      { onSuccess: () => { toast.success("Meta salva"); setOpen(false); }, onError: (e) => toast.error(e.message) },
    );
  };

  const fmtVal = (g: Partial<FinancialGoal>, v: number) =>
    isMoney(g.type) ? fmtBRL(v) : g.type === "margem_liquida" ? `${v}%` : String(v);

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Metas Financeiras"
        subtitle={`${goals.length} meta(s) cadastrada(s)`}
        action={
          <Button onClick={() => { setForm({ type: "receita_mensal", period: "mensal", status: "em_andamento" }); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Nova Meta
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => {
          const pct = Number(g.target_value) > 0 ? Math.min(100, (Number(g.current_value) / Number(g.target_value)) * 100) : 0;
          return (
            <Card key={g.id} className="card-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{g.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {labelOf(GOAL_TYPE, g.type)} · {labelOf(GOAL_PERIOD, g.period)}
                    </p>
                  </div>
                  <StatusBadge map={GOAL_STATUS} value={g.status} />
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold">{fmtVal(g, Number(g.current_value))}</span>
                    <span className="text-muted-foreground">{fmtVal(g, Number(g.target_value))}</span>
                  </div>
                  <Progress value={pct} />
                  <p className="mt-1 text-xs text-muted-foreground">{pct.toFixed(0)}% atingido{g.deadline ? ` · prazo ${fmtDate(g.deadline)}` : ""}</p>
                </div>
                <div className="mt-3 flex gap-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setForm(g); setOpen(true); }}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Atualizar
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Excluir meta?")) remove.mutate(g.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {goals.length === 0 && <p className="py-12 text-center text-muted-foreground">Nenhuma meta cadastrada.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar Meta" : "Nova Meta"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Título *</Label><Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type ?? "receita_mensal"} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(GOAL_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <Select value={form.period ?? "mensal"} onValueChange={(v) => set("period", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(GOAL_PERIOD).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor alvo</Label><Input type="number" step="0.01" value={form.target_value ?? ""} onChange={(e) => set("target_value", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
            <div><Label>Valor atual</Label><Input type="number" step="0.01" value={form.current_value ?? ""} onChange={(e) => set("current_value", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
            <div><Label>Prazo</Label><Input type="date" value={form.deadline ?? ""} onChange={(e) => set("deadline", e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "em_andamento"} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(GOAL_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
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
