import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Star, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtDate, OS_CATEGORY, OS_STATUS, labelOf } from "@/lib/format";
import { useRows, type Client, type ServiceOrder, type Sale, type ExtraVehicle, type SelectedItem } from "@/lib/db";

export const Route = createFileRoute("/historico-clientes")({
  head: () => ({
    meta: [
      { title: "Histórico de Clientes — MecânicaPRO" },
      { name: "description", content: "Histórico de atendimentos, gastos e avaliações por cliente." },
    ],
  }),
  component: HistoricoPage,
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

function HistoricoPage() {
  const { data: clients = [] } = useRows<Client>("clients", "name", true);
  const { data: orders = [] } = useRows<ServiceOrder>("service_orders");
  const { data: sales = [] } = useRows<Sale>("sales");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; ratings: number[]; last?: string }>();
    for (const o of orders) {
      if (!o.client_id) continue;
      const s = map.get(o.client_id) ?? { count: 0, total: 0, ratings: [] };
      s.count += 1;
      s.total += Number(o.total_price);
      if (o.feedback_rating != null) s.ratings.push(Number(o.feedback_rating));
      const d = o.entry_date ?? "";
      if (!s.last || d > s.last) s.last = d;
      map.set(o.client_id, s);
    }
    for (const v of sales) {
      if (!v.client_id) continue;
      const s = map.get(v.client_id) ?? { count: 0, total: 0, ratings: [] };
      s.count += 1;
      s.total += Number(v.total);
      const d = (v.created_at ?? "").slice(0, 10);
      if (!s.last || d > s.last) s.last = d;
      map.set(v.client_id, s);
    }
    return map;
  }, [orders, sales]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return [c.name, c.phone, c.document, c.vehicle_plate].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  const clientOrders = selected
    ? orders.filter((o) => o.client_id === selected.id).sort((a, b) => (b.entry_date ?? "").localeCompare(a.entry_date ?? ""))
    : [];
  const clientSales = selected
    ? sales.filter((s) => s.client_id === selected.id).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    : [];
  const cs = selected ? stats.get(selected.id) : undefined;
  const vehicles = selected ? ((selected.vehicles as unknown as ExtraVehicle[]) ?? []) : [];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader title="Histórico de Clientes" subtitle="Atendimentos, gastos e avaliações por cliente" />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone, CPF ou placa..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const s = stats.get(c.id);
          const avg = s && s.ratings.length ? s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length : null;
          return (
            <Card key={c.id} className="card-shadow">
              <CardContent className="p-4">
                <p className="truncate font-semibold">{c.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Atendimentos</p>
                    <p className="font-semibold">{s?.count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total gasto</p>
                    <p className="font-semibold">{fmtBRL(s?.total ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avaliação média</p>
                    {avg != null ? <Stars rating={avg} /> : <p className="text-muted-foreground">—</p>}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Última visita</p>
                    <p className="font-semibold">{s?.last ? fmtDate(s.last) : "—"}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setSelected(c)}>
                  <History className="mr-1 h-4 w-4" /> Histórico
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</p>}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico — {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p>
                  {[selected.phone, selected.email, selected.document].filter(Boolean).join(" · ") || "Sem contatos"}
                </p>
                {(selected.vehicle_plate || selected.vehicle_model) && (
                  <p className="mt-1 text-muted-foreground">
                    Veículo:{" "}
                    {[selected.vehicle_brand, selected.vehicle_model, selected.vehicle_year, selected.vehicle_plate]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {vehicles.length > 0 && (
                  <p className="mt-1 text-muted-foreground">
                    Veículos adicionais:{" "}
                    {vehicles.map((v) => [v.brand, v.model, v.plate].filter(Boolean).join(" ")).join("; ")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total OS</p>
                  <p className="text-lg font-bold">{cs?.count ?? 0}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Gasto</p>
                  <p className="text-lg font-bold">{fmtBRL(cs?.total ?? 0)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  <p className="text-lg font-bold">{fmtBRL(cs && cs.count ? cs.total / cs.count : 0)}</p>
                </div>
              </div>

              <div className="space-y-2">
                {clientOrders.length === 0 && clientSales.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhum atendimento para este cliente.</p>
                )}
                {clientOrders.map((o) => (
                  <div key={`os-${o.id}`} className="rounded-lg border p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {o.order_number} · {fmtDate(o.entry_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">{labelOf(OS_CATEGORY, o.category)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge map={OS_STATUS} value={o.status} />
                        <span className="text-sm font-semibold">{fmtBRL(Number(o.total_price))}</span>
                      </div>
                    </div>
                    {o.service_description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{o.service_description}</p>
                    )}
                    {o.feedback_rating != null && (
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <Stars rating={Number(o.feedback_rating)} />
                        {o.feedback_comment && <span className="truncate text-muted-foreground">{o.feedback_comment}</span>}
                      </div>
                    )}
                  </div>
                ))}
                {clientSales.map((s) => {
                  const items = (s.items as unknown as SelectedItem[]) ?? [];
                  return (
                    <div key={`pdv-${s.id}`} className="rounded-lg border p-3">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            Venda PDV · {fmtDate((s.created_at ?? "").slice(0, 10))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {items.length} {items.length === 1 ? "item" : "itens"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">PDV</span>
                          <span className="text-sm font-semibold">{fmtBRL(Number(s.total))}</span>
                        </div>
                      </div>
                      {items.length > 0 && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
