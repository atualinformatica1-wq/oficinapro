import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Search, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useRows, useSave, useRemove, type Supplier } from "@/lib/db";

const SUPPLIER_STATUS = {
  ativo: { label: "Ativo", className: "bg-success/15 text-success" },
  inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
};

const SUPPLIER_CATEGORY = {
  pecas: { label: "Peças" },
  lubrificantes: { label: "Lubrificantes" },
  pneus: { label: "Pneus" },
  eletrica: { label: "Elétrica" },
  ferramentas: { label: "Ferramentas" },
  servicos: { label: "Serviços" },
  outros: { label: "Outros" },
};

export const Route = createFileRoute("/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — MecânicaPRO" },
      { name: "description", content: "Cadastro de fornecedores da oficina com contatos, condições de pagamento e prazos de entrega." },
      { property: "og:title", content: "Fornecedores — MecânicaPRO" },
      { property: "og:description", content: "Gerencie os fornecedores da sua oficina: contatos, endereço, condições e prazos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FornecedoresPage,
});

function FornecedoresPage() {
  const { data: suppliers = [] } = useRows<Supplier>("suppliers", "name", true);
  const save = useSave("suppliers");
  const remove = useRemove("suppliers");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Supplier>>({});
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = suppliers.filter(
    (s) =>
      (cat === "todos" || s.category === cat) &&
      [s.name, s.trade_name, s.document, s.phone, s.email, s.city, s.contact_name].some((v) =>
        (v ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
  );

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("Informe a razão social / nome");
    save.mutate(form, {
      onSuccess: () => {
        toast.success("Fornecedor salvo");
        setOpen(false);
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Fornecedores"
        subtitle={`${suppliers.length} fornecedor(es) cadastrado(s)`}
        action={
          <Button onClick={() => { setForm({ category: "pecas", status: "ativo" }); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Novo Fornecedor
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CNPJ, contato, cidade..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {Object.entries(SUPPLIER_CATEGORY).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Card key={s.id} className="card-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{s.trade_name || s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {SUPPLIER_CATEGORY[s.category as keyof typeof SUPPLIER_CATEGORY]?.label ?? s.category}
                    {s.document ? ` · ${s.document}` : ""}
                  </p>
                </div>
                <StatusBadge map={SUPPLIER_STATUS} value={s.status} />
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {s.contact_name && <p className="truncate">Contato: {s.contact_name}</p>}
                {(s.phone || s.whatsapp) && (
                  <p className="flex items-center gap-1 truncate"><Phone className="h-3.5 w-3.5 shrink-0" />{[s.phone, s.whatsapp].filter(Boolean).join(" · ")}</p>
                )}
                {s.email && <p className="flex items-center gap-1 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{s.email}</p>}
                {(s.city || s.state) && (
                  <p className="flex items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" />{[s.city, s.state].filter(Boolean).join(" / ")}</p>
                )}
                {(s.payment_terms || s.delivery_days != null) && (
                  <p className="truncate">
                    {s.payment_terms ? `Pagto: ${s.payment_terms}` : ""}
                    {s.payment_terms && s.delivery_days != null ? " · " : ""}
                    {s.delivery_days != null ? `Entrega: ${Number(s.delivery_days)} dia(s)` : ""}
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setForm(s); setOpen(true); }}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Excluir ${s.name}?`)) remove.mutate(s.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">Nenhum fornecedor encontrado.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2 [&_input]:h-8 [&_input]:text-xs [&_button[role=combobox]]:h-8 [&_button[role=combobox]]:text-xs [&_label]:text-xs">
            <div className="sm:col-span-2"><Label>Razão social / Nome *</Label><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
            <div><Label>Nome fantasia</Label><Input maxLength={60} value={form.trade_name ?? ""} onChange={(e) => set("trade_name", e.target.value)} /></div>
            <div><Label>CNPJ / CPF</Label><Input maxLength={20} value={form.document ?? ""} onChange={(e) => set("document", e.target.value)} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category ?? "pecas"} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SUPPLIER_CATEGORY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "ativo"} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SUPPLIER_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Contato responsável</Label><Input maxLength={60} value={form.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input maxLength={20} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
            <div><Label>WhatsApp</Label><Input maxLength={20} value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} /></div>
            <div><Label>E-mail</Label><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Site</Label><Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Endereço</Label><Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></div>
            <div><Label>Cidade</Label><Input maxLength={40} value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>UF</Label><Input maxLength={2} value={form.state ?? ""} onChange={(e) => set("state", e.target.value.toUpperCase())} /></div>
              <div><Label>CEP</Label><Input maxLength={10} value={form.zip_code ?? ""} onChange={(e) => set("zip_code", e.target.value)} /></div>
            </div>
            <div><Label>Condições de pagamento</Label><Input maxLength={60} placeholder="Ex.: 30/60 dias" value={form.payment_terms ?? ""} onChange={(e) => set("payment_terms", e.target.value)} /></div>
            <div><Label>Prazo de entrega (dias)</Label><Input type="number" value={form.delivery_days ?? ""} onChange={(e) => set("delivery_days", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
            <div className="sm:col-span-2"><Label>Observações</Label><Input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
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
