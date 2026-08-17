import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { OSFormDialog } from "@/components/os/OSFormDialog";
import { OSViewDialog } from "@/components/os/OSViewDialog";
import { fmtBRL, fmtDate, OS_STATUS, PAYMENT_STATUS } from "@/lib/format";
import { useRows, useRemove, type ServiceOrder } from "@/lib/db";

export const Route = createFileRoute("/ordens")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço — MecânicaPRO" },
      { name: "description", content: "Gestão completa de ordens de serviço da oficina." },
    ],
  }),
  component: OrdensPage,
});

function OrdensPage() {
  const { data: orders = [], isLoading } = useRows<ServiceOrder>("service_orders");
  const remove = useRemove("service_orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOrder | null>(null);
  const [viewing, setViewing] = useState<ServiceOrder | null>(null);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "todos" && o.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return [o.order_number, o.client_name, o.vehicle_plate, o.vehicle_model, o.technician].some((v) =>
      (v ?? "").toLowerCase().includes(q),
    );
  });

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Ordens de Serviço"
        subtitle={`${orders.length} OS no total`}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Nova OS
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº, cliente, placa, técnico..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(OS_STATUS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Veículo</TableHead>
                <TableHead className="hidden lg:table-cell">Entrada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Nenhuma OS encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setViewing(o)}>
                    <TableCell className="font-medium">{o.order_number}</TableCell>
                    <TableCell className="max-w-40 truncate">{o.client_name}</TableCell>
                    <TableCell className="hidden max-w-40 truncate md:table-cell">
                      {[o.vehicle_plate, o.vehicle_model].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{fmtDate(o.entry_date)}</TableCell>
                    <TableCell>
                      <StatusBadge map={OS_STATUS} value={o.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmtBRL(Number(o.total_price))}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(o)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(o);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm(`Excluir ${o.order_number}?`)) remove.mutate(o.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <OSFormDialog open={formOpen} onOpenChange={setFormOpen} order={editing} orders={orders} />
      <OSViewDialog order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
