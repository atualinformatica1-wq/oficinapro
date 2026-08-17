import { useState } from "react";
import { Printer, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { PrintableOS } from "@/components/PrintableOS";
import {
  fmtBRL,
  fmtDate,
  fmtDateTime,
  labelOf,
  OS_CATEGORY,
  OS_STATUS,
  APPROVAL_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} from "@/lib/format";
import type { ServiceOrder, SelectedItem } from "@/lib/db";

interface OSViewDialogProps {
  order: ServiceOrder | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function OSViewDialog({ order, onClose }: OSViewDialogProps) {
  const [zoom, setZoom] = useState<string | null>(null);
  if (!order) return null;
  const items = (order.selected_items as unknown as SelectedItem[]) ?? [];
  const photos = (order.photos as unknown as string[]) ?? [];

  return (
    <>
      <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {order.order_number}
              <StatusBadge map={OS_STATUS} value={order.status} />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Row label="Cliente" value={order.client_name} />
              <Row label="Telefone" value={order.client_phone} />
              <Row label="Email" value={order.client_email} />
              <Row label="Veículo" value={`${order.vehicle_model ?? "—"} ${order.vehicle_year ? `(${order.vehicle_year})` : ""}`} />
              <Row label="Placa" value={order.vehicle_plate} />
              <Row
                label="KM"
                value={order.vehicle_mileage != null ? Number(order.vehicle_mileage).toLocaleString("pt-BR") : null}
              />
              <Row label="Entrada" value={fmtDateTime(order.entry_date)} />
              <Row label="Previsão" value={order.estimated_delivery ? fmtDate(order.estimated_delivery) : null} />
              <Row label="Técnico" value={order.technician} />
              <Row label="Categoria" value={labelOf(OS_CATEGORY, order.category)} />
              <Row
                label="Horas"
                value={`${order.estimated_hours ?? "—"} est. / ${order.actual_hours ?? "—"} real`}
              />
              <Row label="Conclusão" value={order.completion_date ? fmtDateTime(order.completion_date) : null} />
            </div>

            {order.service_description && (
              <div>
                <p className="text-xs text-muted-foreground">Descrição do serviço</p>
                <p className="text-sm whitespace-pre-wrap">{order.service_description}</p>
              </div>
            )}
            {order.diagnosis && (
              <div>
                <p className="text-xs text-muted-foreground">Diagnóstico técnico</p>
                <p className="text-sm whitespace-pre-wrap">{order.diagnosis}</p>
              </div>
            )}

            <div className="rounded-lg border p-3">
              <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">Aprovação do orçamento</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <StatusBadge map={APPROVAL_STATUS} value={order.approval_status} />
                {order.approval_date && <span className="text-muted-foreground">{fmtDateTime(order.approval_date)}</span>}
              </div>
              {order.approval_notes && <p className="mt-1 text-sm">{order.approval_notes}</p>}
            </div>

            {items.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Peças e produtos</p>
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between py-0.5 text-sm">
                    <span className="min-w-0 truncate">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="shrink-0 font-medium">{fmtBRL(it.quantity * it.unit_price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 text-sm sm:grid-cols-4">
              <Row label="Mão de obra" value={fmtBRL(Number(order.labor_price))} />
              <Row label="Peças" value={fmtBRL(Number(order.parts_price))} />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-bold text-primary">{fmtBRL(Number(order.total_price))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className={`text-sm font-bold ${Number(order.profit) >= 0 ? "text-success" : "text-destructive"}`}>
                  {fmtBRL(Number(order.profit))}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge map={PAYMENT_STATUS} value={order.payment_status} />
              {order.payment_method && <StatusBadge map={PAYMENT_METHOD} value={order.payment_method} />}
            </div>

            {order.feedback_rating != null && (
              <div className="rounded-lg border p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">Avaliação do cliente</p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= Number(order.feedback_rating) ? "fill-warning text-warning" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                {order.feedback_comment && <p className="mt-1 text-sm">{order.feedback_comment}</p>}
              </div>
            )}

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <button key={i} type="button" onClick={() => setZoom(p)}>
                    <img src={p} alt={`Foto ${i + 1}`} className="h-20 w-20 rounded-lg border object-cover" />
                  </button>
                ))}
              </div>
            )}

            {order.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Observações internas</p>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}

            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1 h-4 w-4" /> Imprimir OS (A4)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">Foto ampliada</DialogTitle>
          {zoom && <img src={zoom} alt="Foto ampliada" className="max-h-[80vh] w-full rounded object-contain" />}
        </DialogContent>
      </Dialog>

      <PrintableOS os={order} />
    </>
  );
}
