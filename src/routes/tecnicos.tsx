import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, SPECIALTY, TECH_STATUS, labelOf } from "@/lib/format";
import { useRows, useSave, useRemove, type Technician, type ServiceOrder } from "@/lib/db";

export const Route = createFileRoute("/tecnicos")({
  head: () => ({
    meta: [
      { title: "Técnicos — MecânicaPRO" },
      { name: "description", content: "Equipe técnica da oficina com métricas mensais de produtividade." },
    ],
  }),
  component: TecnicosPage,
});

function TecnicosPage() {
  const { data: techs = [] } = useRows<Technician>("technicians", "name", true);
  const { data: orders = [] } = useRows<ServiceOrder>("service_orders");
  const save = useSave("technicians");
  const remove = useRemove("technicians");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Technician>>({});
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const month = new Date().toISOString().slice(0, 7);
  const metricsFor = (t: Technician) => {
    const monthOrders = orders.filter(
      (o) => o.technician_id === t.id && o.status === "concluida" && (o.completion_date ?? "").slice(0, 7) === month,
    );
    return {
      count: monthOrders.length,
      hours: monthOrders.reduce((s, o) => s + Number(o.actual_hours ?? 0), 0),
      revenue: monthOrders.reduce((s, o) => s + Number(o.total_price), 0),
    };
  };

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("Informe o nome");
    save.mutate(
      { ...form, hire_date: form.hire_date || null },
      { onSuccess: () => { toast.success("Técnico salvo"); setOpen(false); }, onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Técnicos"
        subtitle={`${techs.length} técnico(s) na equipe`}
        action={
          <Button onClick={() => { setForm({ specialty: "mecanica_geral", status: "ativo" }); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Novo Técnico
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {techs.map((t) => {
          const m = metricsFor(t);
          return (
            <Card key={t.id} className="card-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {t.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{labelOf(SPECIALTY, t.specialty)}</p>
                    </div>
                  </div>
                  <StatusBadge map={TECH_STATUS} value={t.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted p-2 text-center text-sm">
                  <div><p className="text-xs text-muted-foreground">OS mês</p><p className="font-bold">{m.count}</p></div>
                  <div><p className="text-xs text-muted-foreground">Horas</p><p className="font-bold">{m.hours}</p></div>
                  <div><p className="text-xs text-muted-foreground">Receita</p><p className="truncate font-bold">{fmtBRL(m.revenue)}</p></div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Hora técnica: {fmtBRL(Number(t.hourly_rate))} · Comissão: {Number(t.commission_percent)}%
                </div>
                <div className="mt-3 flex gap-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setForm(t); setOpen(true); }}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Excluir ${t.name}?`)) remove.mutate(t.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {techs.length === 0 && <p className="py-12 text-center text-muted-foreground">Nenhum técnico cadastrado.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar Técnico" : "Novo Técnico"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nome *</Label><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
            <div>
              <Label>Especialidade</Label>
              <Select value={form.specialty ?? "mecanica_geral"} onValueChange={(v) => set("specialty", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SPECIALTY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "ativo"} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TECH_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Salário</Label><Input type="number" step="0.01" value={form.salary ?? ""} onChange={(e) => set("salary", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
            <div><Label>Hora técnica</Label><Input type="number" step="0.01" value={form.hourly_rate ?? ""} onChange={(e) => set("hourly_rate", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
            <div><Label>Comissão %</Label><Input type="number" step="0.1" value={form.commission_percent ?? ""} onChange={(e) => set("commission_percent", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
            <div><Label>Data de contratação</Label><Input type="date" value={form.hire_date ?? ""} onChange={(e) => set("hire_date", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
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
