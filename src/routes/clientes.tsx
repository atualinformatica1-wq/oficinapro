import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Phone, Mail, Car, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { useRows, useSave, useRemove, type Client, type ExtraVehicle } from "@/lib/db";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — MecânicaPRO" },
      { name: "description", content: "Cadastro e gestão de clientes e veículos da oficina." },
    ],
  }),
  component: ClientesPage,
});

type ClientForm = Partial<Client> & { second_vehicle?: ExtraVehicle };

const empty: ClientForm = { name: "" };

function ClientesPage() {
  const { data: clients = [], isLoading } = useRows<Client>("clients", "name", true);
  const save = useSave("clients");
  const remove = useRemove("clients");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientForm>(empty);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const setSecond = (k: keyof ExtraVehicle, v: unknown) =>
    setForm((f) => ({ ...f, second_vehicle: { ...(f.second_vehicle ?? {}), [k]: v } }));

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return [c.name, c.phone, c.document, c.vehicle_plate].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  const openNew = () => {
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    const vehicles = (c.vehicles as unknown as ExtraVehicle[]) ?? [];
    setForm({ ...c, second_vehicle: vehicles[0] });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    const { second_vehicle, ...rest } = form;
    const vehicles = second_vehicle && Object.values(second_vehicle).some((v) => v) ? [second_vehicle] : [];
    save.mutate(
      { ...rest, vehicles, birth_date: rest.birth_date || null },
      {
        onSuccess: () => {
          toast.success("Cliente salvo");
          setOpen(false);
        },
        onError: (e) => toast.error(`Erro ao salvar: ${e.message}`),
      },
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} cliente(s) cadastrado(s)`}
        action={
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Novo Cliente
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone, CPF ou placa..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="card-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    {c.document && <p className="text-xs text-muted-foreground">{c.document}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        if (confirm(`Excluir cliente ${c.name}?`)) remove.mutate(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {c.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </p>
                  )}
                  {c.email && (
                    <p className="flex min-w-0 items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.email}</span>
                    </p>
                  )}
                  {(c.vehicle_plate || c.vehicle_model) && (
                    <p className="flex items-center gap-2">
                      <Car className="h-3.5 w-3.5" />
                      <span className="truncate">
                        {[c.vehicle_plate, c.vehicle_brand, c.vehicle_model, c.vehicle_year].filter(Boolean).join(" · ")}
                        {c.vehicle_mileage != null ? ` · ${Number(c.vehicle_mileage).toLocaleString("pt-BR")} km` : ""}
                      </span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Dados pessoais</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Nome *</Label>
                  <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div>
                  <Label>CPF/CNPJ</Label>
                  <Input value={form.document ?? ""} onChange={(e) => set("document", e.target.value)} />
                </div>
                <div>
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={form.birth_date ?? ""} onChange={(e) => set("birth_date", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Veículo principal</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Marca</Label>
                  <Input value={form.vehicle_brand ?? ""} onChange={(e) => set("vehicle_brand", e.target.value)} />
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
                  <Label>Placa</Label>
                  <Input value={form.vehicle_plate ?? ""} onChange={(e) => set("vehicle_plate", e.target.value.toUpperCase())} />
                </div>
                <div>
                  <Label>Quilometragem</Label>
                  <Input
                    type="number"
                    value={form.vehicle_mileage ?? ""}
                    onChange={(e) => set("vehicle_mileage", e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Segundo veículo (opcional)</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Marca</Label>
                  <Input value={form.second_vehicle?.brand ?? ""} onChange={(e) => setSecond("brand", e.target.value)} />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Input value={form.second_vehicle?.model ?? ""} onChange={(e) => setSecond("model", e.target.value)} />
                </div>
                <div>
                  <Label>Ano</Label>
                  <Input value={form.second_vehicle?.year ?? ""} onChange={(e) => setSecond("year", e.target.value)} />
                </div>
                <div>
                  <Label>Placa</Label>
                  <Input
                    value={form.second_vehicle?.plate ?? ""}
                    onChange={(e) => setSecond("plate", e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input value={form.second_vehicle?.color ?? ""} onChange={(e) => setSecond("color", e.target.value)} />
                </div>
                <div>
                  <Label>KM</Label>
                  <Input
                    type="number"
                    value={form.second_vehicle?.mileage ?? ""}
                    onChange={(e) => setSecond("mileage", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Notas internas</Label>
              <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
