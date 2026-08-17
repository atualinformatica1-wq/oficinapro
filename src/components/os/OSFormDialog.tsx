import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientSelector } from "@/components/ClientSelector";
import { ProductSelector } from "@/components/ProductSelector";
import { PhotoUploader } from "@/components/PhotoUploader";
import { CashClosingDialog } from "@/components/os/CashClosingDialog";
import { PrintableOS } from "@/components/PrintableOS";
import { Printer } from "lucide-react";
import {
  OS_CATEGORY,
  OS_STATUS,
  APPROVAL_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  fmtBRL,
} from "@/lib/format";
import {
  useRows,
  useSave,
  deductStock,
  nextOrderNumber,
  type ServiceOrder,
  type Technician,
  type SelectedItem,
} from "@/lib/db";

interface OSFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  order: ServiceOrder | null;
  orders: ServiceOrder[];
}

type OSForm = Partial<ServiceOrder>;

const enumEntries = (m: Record<string, { label: string }>) => Object.entries(m);

export function OSFormDialog({ open, onOpenChange, order, orders }: OSFormDialogProps) {
  const save = useSave("service_orders");
  const qc = useQueryClient();
  const { data: technicians = [] } = useRows<Technician>("technicians", "name", true);
  const [form, setForm] = useState<OSForm>({});
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [closingOpen, setClosingOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    if (!open) return;
    if (order) {
      setForm(order);
      setItems((order.selected_items as unknown as SelectedItem[]) ?? []);
      setPhotos((order.photos as unknown as string[]) ?? []);
    } else {
      setForm({
        order_number: nextOrderNumber(orders),
        entry_date: new Date().toISOString().slice(0, 16),
        category: "reparo_mecanico",
        status: "aberta",
        approval_status: "pendente",
        payment_status: "pendente",
      });
      setItems([]);
      setPhotos([]);
    }
  }, [open, order, orders]);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => (v === "" ? undefined : Number(v));

  const partsCost = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
  const partsPrice = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const laborCost = Number(form.labor_cost ?? 0);
  const laborPrice = Number(form.labor_price ?? 0);
  const totalPrice = laborPrice + partsPrice;
  const totalCost = laborCost + partsCost;

  const handleSave = () => {
    if (!form.client_name?.trim()) {
      toast.error("Selecione ou informe o cliente");
      return;
    }
    const wasCompleted = order?.status === "concluida";
    const isCompleted = form.status === "concluida";

    const payload: Record<string, unknown> = {
      ...form,
      selected_items: items,
      photos,
      parts_cost: partsCost,
      parts_price: partsPrice,
      total_price: totalPrice,
      total_cost: totalCost,
      profit: totalPrice - totalCost,
      estimated_delivery: form.estimated_delivery || null,
      entry_date: form.entry_date ? new Date(form.entry_date).toISOString() : new Date().toISOString(),
      completion_date: isCompleted
        ? (form.completion_date ?? new Date().toISOString())
        : form.completion_date || null,
      approval_date:
        form.approval_status !== "pendente" && !form.approval_date ? new Date().toISOString() : form.approval_date || null,
      feedback_date:
        form.feedback_rating != null && !form.feedback_date ? new Date().toISOString() : form.feedback_date || null,
      technician_id: form.technician_id || null,
      client_id: form.client_id || null,
    };

    save.mutate(payload, {
      onSuccess: async () => {
        if (isCompleted && !wasCompleted && items.length > 0) {
          await deductStock(items);
          qc.invalidateQueries({ queryKey: ["inventory_items"] });
          toast.success("OS concluída — estoque abatido automaticamente");
        } else {
          toast.success("OS salva");
        }
        onOpenChange(false);
      },
      onError: (e) => toast.error(`Erro ao salvar: ${e.message}`),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? `Editar ${order.order_number}` : `Nova OS — ${form.order_number ?? ""}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Cliente</h3>
            <ClientSelector
              value={form.client_id}
              onSelect={(c) =>
                setForm((f) => ({
                  ...f,
                  client_id: c?.id ?? null,
                  client_name: c?.name ?? f.client_name ?? "",
                  client_phone: c?.phone ?? f.client_phone,
                  client_email: c?.email ?? f.client_email,
                  vehicle_plate: c?.vehicle_plate ?? f.vehicle_plate,
                  vehicle_model: c ? [c.vehicle_brand, c.vehicle_model].filter(Boolean).join(" ") : f.vehicle_model,
                  vehicle_year: c?.vehicle_year ?? f.vehicle_year,
                  vehicle_mileage: c?.vehicle_mileage ?? f.vehicle_mileage,
                }))
              }
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Nome *</Label>
                <Input value={form.client_name ?? ""} onChange={(e) => set("client_name", e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.client_phone ?? ""} onChange={(e) => set("client_phone", e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.client_email ?? ""} onChange={(e) => set("client_email", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Veículo</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Placa</Label>
                <Input value={form.vehicle_plate ?? ""} onChange={(e) => set("vehicle_plate", e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input value={form.vehicle_model ?? ""} onChange={(e) => set("vehicle_model", e.target.value)} />
              </div>
              <div>
                <Label>Ano</Label>
                <Input value={form.vehicle_year ?? ""} onChange={(e) => set("vehicle_year", e.target.value)} />
              </div>
              <div>
                <Label>KM de entrada</Label>
                <Input
                  type="number"
                  value={form.vehicle_mileage ?? ""}
                  onChange={(e) => set("vehicle_mileage", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <Label>Data/hora de entrada</Label>
                <Input
                  type="datetime-local"
                  value={form.entry_date ? String(form.entry_date).slice(0, 16) : ""}
                  onChange={(e) => set("entry_date", e.target.value)}
                />
              </div>
              <div>
                <Label>Previsão de entrega</Label>
                <Input
                  type="date"
                  value={form.estimated_delivery ?? ""}
                  onChange={(e) => set("estimated_delivery", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Serviço</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Técnico</Label>
                <Select
                  value={form.technician_id ?? ""}
                  onValueChange={(v) => {
                    const t = technicians.find((x) => x.id === v);
                    setForm((f) => ({ ...f, technician_id: v, technician: t?.name ?? f.technician }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category ?? "reparo_mecanico"} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enumEntries(OS_CATEGORY).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição do serviço</Label>
                <Textarea rows={2} value={form.service_description ?? ""} onChange={(e) => set("service_description", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Diagnóstico técnico</Label>
                <Textarea rows={2} value={form.diagnosis ?? ""} onChange={(e) => set("diagnosis", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Aprovação do orçamento</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Status da aprovação</Label>
                <Select value={form.approval_status ?? "pendente"} onValueChange={(v) => set("approval_status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enumEntries(APPROVAL_STATUS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações da aprovação</Label>
                <Input value={form.approval_notes ?? ""} onChange={(e) => set("approval_notes", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Produtos do estoque</h3>
            <ProductSelector items={items} onChange={setItems} />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Custos e preços</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <Label>Custo mão de obra</Label>
                <Input type="number" step="0.01" value={form.labor_cost ?? ""} onChange={(e) => set("labor_cost", num(e.target.value))} />
              </div>
              <div>
                <Label>Preço mão de obra</Label>
                <Input type="number" step="0.01" value={form.labor_price ?? ""} onChange={(e) => set("labor_price", num(e.target.value))} />
              </div>
              <div>
                <Label>Horas estimadas</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.estimated_hours ?? ""}
                  onChange={(e) => set("estimated_hours", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <Label>Horas realizadas</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.actual_hours ?? ""}
                  onChange={(e) => set("actual_hours", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 text-sm sm:grid-cols-5">
              <div>
                <p className="text-xs text-muted-foreground">Mão de obra</p>
                <p className="font-semibold">{fmtBRL(laborPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peças (venda)</p>
                <p className="font-semibold">{fmtBRL(partsPrice)}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Custo total</p>
                <p className="font-semibold">{fmtBRL(totalCost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total OS</p>
                <p className="font-semibold text-primary">{fmtBRL(totalPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className={`font-semibold ${totalPrice - totalCost >= 0 ? "text-success" : "text-destructive"}`}>
                  {fmtBRL(totalPrice - totalCost)}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Status e pagamento</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Status da OS</Label>
                <Select value={form.status ?? "aberta"} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enumEntries(OS_STATUS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status de pagamento</Label>
                <Select value={form.payment_status ?? "pendente"} onValueChange={(v) => set("payment_status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enumEntries(PAYMENT_STATUS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Forma de pagamento</Label>
                <Select value={form.payment_method ?? ""} onValueChange={(v) => set("payment_method", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {enumEntries(PAYMENT_METHOD).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {form.status === "concluida" && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Avaliação do cliente</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => set("feedback_rating", i)}>
                    <Star
                      className={`h-6 w-6 ${
                        (form.feedback_rating ?? 0) >= i ? "fill-warning text-warning" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
                {form.feedback_rating != null && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => set("feedback_rating", null)}>
                    Limpar
                  </Button>
                )}
              </div>
              <div className="mt-2">
                <Label>Comentário do cliente</Label>
                <Textarea rows={2} value={form.feedback_comment ?? ""} onChange={(e) => set("feedback_comment", e.target.value)} />
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Fotos (até 3)</h3>
            <PhotoUploader photos={photos} onChange={setPhotos} />
          </section>

          <section>
            <Label>Observações internas (só para a equipe)</Label>
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </section>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {form.payment_status !== "pago" && totalPrice > 0 && (
            <Button variant="secondary" onClick={() => setClosingOpen(true)}>
              Fechar Caixa
            </Button>
          )}
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar OS"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <CashClosingDialog
        open={closingOpen}
        onOpenChange={setClosingOpen}
        total={totalPrice}
        defaultMethod={form.payment_method}
        isPending={save.isPending}
        onConfirm={(data) => {
          const wasCompleted = order?.status === "concluida";
          const nowIso = new Date().toISOString();
          const closingNote = `Fechamento: recebido ${data.amount_received.toFixed(2)}, troco ${data.change.toFixed(2)}${data.notes ? ` — ${data.notes}` : ""}`;
          const mergedNotes = [form.notes, closingNote].filter(Boolean).join("\n");
          const payload: Record<string, unknown> = {
            ...form,
            selected_items: items,
            photos,
            parts_cost: partsCost,
            parts_price: partsPrice,
            total_price: totalPrice,
            total_cost: totalCost,
            profit: totalPrice - totalCost,
            payment_method: data.payment_method,
            payment_status: "pago",
            status: "concluida",
            completion_date: form.completion_date ?? nowIso,
            entry_date: form.entry_date ? new Date(form.entry_date).toISOString() : nowIso,
            estimated_delivery: form.estimated_delivery || null,
            approval_status: form.approval_status === "pendente" ? "aprovado" : form.approval_status,
            approval_date: form.approval_date || nowIso,
            feedback_date: form.feedback_rating != null && !form.feedback_date ? nowIso : form.feedback_date || null,
            technician_id: form.technician_id || null,
            client_id: form.client_id || null,
            notes: mergedNotes,
          };
          save.mutate(payload, {
            onSuccess: async () => {
              if (!wasCompleted && items.length > 0) {
                await deductStock(items);
                qc.invalidateQueries({ queryKey: ["inventory_items"] });
              }
              toast.success("Caixa fechado — OS quitada");
              setClosingOpen(false);
              setReceiptOrder({ ...(order ?? {}), ...payload } as ServiceOrder);
            },
            onError: (e) => toast.error(`Erro ao fechar caixa: ${e.message}`),
          });
        }}
      />

      <Dialog open={!!receiptOrder} onOpenChange={(o) => { if (!o) { setReceiptOrder(null); onOpenChange(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Caixa fechado com sucesso</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Deseja imprimir o recibo desta OS agora?</p>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => { setReceiptOrder(null); onOpenChange(false); }}>
              Agora não
            </Button>
            <Button onClick={() => { window.print(); setReceiptOrder(null); onOpenChange(false); }}>
              <Printer className="mr-1 h-4 w-4" /> Imprimir recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {receiptOrder && <PrintableOS os={receiptOrder} />}
    </Dialog>
  );
}
