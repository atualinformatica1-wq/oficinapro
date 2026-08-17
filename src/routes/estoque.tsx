import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { PhotoUploader } from "@/components/PhotoUploader";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, TURNOVER_CLASS, ORIGIN } from "@/lib/format";
import { useCategories } from "@/lib/categories";
import { useRows, useSave, useRemove, type InventoryItem, type Supplier } from "@/lib/db";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — MecânicaPRO" },
      { name: "description", content: "Controle de estoque de peças com alertas de reposição." },
    ],
  }),
  component: EstoquePage,
});

function EstoquePage() {
  const { data: items = [] } = useRows<InventoryItem>("inventory_items", "name", true);
  const { data: suppliers = [] } = useRows<Supplier>("suppliers", "name", true);
  const activeSuppliers = suppliers.filter((s) => s.status !== "inativo");
  const save = useSave("inventory_items");
  const remove = useRemove("inventory_items");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<InventoryItem>>({});
  const { custom, categories, addCategory, removeCategory } = useCategories();
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState("");

  const handleAddCategory = () => {
    const res = addCategory(newCat);
    if (!res.ok) return toast.error(res.error);
    toast.success("Categoria criada");
    setNewCat("");
  };

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Limita campos numéricos de quantidade a 6 dígitos com mensagem de erro
  const setQty = (k: "quantity" | "min_stock" | "max_stock", raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits.length > 6) {
      toast.error("Limite de 6 dígitos atingido", { description: "O valor máximo permitido é 999999." });
    }
    set(k, digits === "" ? undefined : Number(digits.slice(0, 6)));
  };

  type Compat = { brand?: string; model?: string; year?: string; engine?: string };
  const compat: Compat[] = Array.isArray(form.compatibility) ? (form.compatibility as Compat[]) : [];
  const writeCompat = (list: Compat[]) => set("compatibility", list);
  const addCompat = () => writeCompat([...compat, { brand: "", model: "", year: "", engine: "" }]);
  const removeCompat = (idx: number) => writeCompat(compat.filter((_, i) => i !== idx));
  const setCompat = (idx: number, k: keyof Compat, v: string) =>
    writeCompat(compat.map((c, i) => (i === idx ? { ...c, [k]: v } : c)));

  // Limita preços a 6 dígitos na parte inteira, com mensagem de erro
  const setPrice = (k: "purchase_price" | "sale_price", raw: string) => {
    let clean = raw.replace(/[^\d.,]/g, "").replace(",", ".");
    const [intPart = "", ...decParts] = clean.split(".");
    if (intPart.length > 6) {
      toast.error("Limite de 6 dígitos atingido", { description: "O valor máximo permitido é 999999." });
    }
    const dec = decParts.join("").slice(0, 2);
    clean = intPart.slice(0, 6) + (decParts.length ? "." + dec : "");
    const value = clean === "" || clean === "." ? undefined : Number(clean);
    setForm((f) => {
      const next = { ...f, [k]: value };
      const pp = Number(next.purchase_price ?? 0);
      const sp = Number(next.sale_price ?? 0);
      next.markup_percent = pp > 0 ? Number((((sp - pp) / pp) * 100).toFixed(1)) : undefined;
      return next;
    });
  };


  const low = items.filter((i) => Number(i.quantity) <= Number(i.min_stock));
  const filtered = items.filter(
    (i) =>
      (cat === "todos" || i.category === cat) &&
      [i.name, i.sku, i.original_code, i.brand, i.model, i.year, i.supplier].some((v) => (v ?? "").toLowerCase().includes(search.toLowerCase())),
  );

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("Informe o nome do item");
    save.mutate(form, {
      onSuccess: () => {
        toast.success("Item salvo");
        setOpen(false);
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Estoque"
        subtitle={`${items.length} itens cadastrados`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCatOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Categorias
            </Button>
            <Button onClick={() => { setForm({ category: "outros", turnover_class: "giro_medio", origin: "paralela" }); setOpen(true); }}>
              <Plus className="mr-1 h-4 w-4" /> Novo Item
            </Button>
          </div>
        }
      />

      {low.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {low.length} item(ns) com estoque crítico: {low.slice(0, 5).map((i) => i.name).join(", ")}
            {low.length > 5 ? "..." : ""}
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, SKU, fornecedor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {Object.entries(categories).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="hidden md:table-cell">Códigos</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Compra</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Markup</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Nenhum item.</TableCell></TableRow>
              ) : (
                filtered.map((i) => {
                  const isLow = Number(i.quantity) <= Number(i.min_stock);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="max-w-48 truncate font-medium">
                        {i.name}
                        {(i.brand || i.model || i.year) && (
                          <div className="truncate text-xs font-normal text-muted-foreground">
                            {[i.brand, i.model, i.year].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {i.sku && <div>Loja: {i.sku}</div>}
                        {i.original_code && <div className="text-muted-foreground">Orig: {i.original_code}</div>}
                        {!i.sku && !i.original_code && "—"}
                      </TableCell>
                      <TableCell><StatusBadge map={categories} value={i.category} /></TableCell>
                      <TableCell className={`text-right font-semibold ${isLow ? "text-destructive" : ""}`}>
                        {Number(i.quantity)}
                        {isLow && <AlertTriangle className="ml-1 inline h-3.5 w-3.5" />}
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">{fmtBRL(Number(i.purchase_price))}</TableCell>
                      <TableCell className="text-right">{fmtBRL(Number(i.sale_price))}</TableCell>
                      <TableCell className="hidden text-right lg:table-cell">{Number(i.markup_percent)}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setForm(i); setOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Excluir ${i.name}?`)) remove.mutate(i.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Editar Item" : "Novo Item"}</DialogTitle></DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2 [&_input]:h-7 [&_input]:text-xs [&_button[role=combobox]]:h-7 [&_button[role=combobox]]:text-xs [&_label]:text-xs">
            <div className="sm:col-span-2"><Label>Nome *</Label><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <Label>Código Loja</Label>
                <div className="flex gap-1">
                  <Input maxLength={30} value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} />
                  <BarcodeScanner iconOnly onDetected={(code) => { set("sku", code); toast.success(`Código: ${code}`); }} />
                </div>
              </div>
              <div><Label>Código Original</Label><Input maxLength={30} value={form.original_code ?? ""} onChange={(e) => set("original_code", e.target.value)} /></div>
            </div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-3">
              <div><Label>Marca</Label><Input maxLength={30} value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value)} /></div>
              <div><Label>Modelo</Label><Input maxLength={30} value={form.model ?? ""} onChange={(e) => set("model", e.target.value)} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Categoria</Label>
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => setCatOpen(true)}>
                  Gerenciar
                </button>
              </div>
              <Select value={form.category ?? "outros"} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(categories).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Classe de giro</Label>
              <Select value={form.turnover_class ?? "giro_medio"} onValueChange={(v) => set("turnover_class", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TURNOVER_CLASS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={form.origin ?? "paralela"} onValueChange={(v) => set("origin", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ORIGIN).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 grid grid-cols-3 gap-3">
              <div><Label>Quantidade</Label><Input type="text" inputMode="numeric" className="w-full" value={form.quantity ?? ""} onChange={(e) => setQty("quantity", e.target.value)} /></div>
              <div><Label>Estoque mínimo</Label><Input type="text" inputMode="numeric" className="w-full" value={form.min_stock ?? ""} onChange={(e) => setQty("min_stock", e.target.value)} /></div>
              <div><Label>Estoque máximo</Label><Input type="text" inputMode="numeric" className="w-full" value={form.max_stock ?? ""} onChange={(e) => setQty("max_stock", e.target.value)} /></div>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <div><Label>Preço de compra</Label><Input type="text" inputMode="decimal" className="w-36" value={form.purchase_price ?? ""} onChange={(e) => setPrice("purchase_price", e.target.value)} /></div>
              <div><Label>Preço de venda</Label><Input type="text" inputMode="decimal" className="w-36" value={form.sale_price ?? ""} onChange={(e) => setPrice("sale_price", e.target.value)} /></div>
            </div>
            <div><Label>Ponto de reposição</Label><Input type="number" value={form.reorder_point ?? ""} onChange={(e) => set("reorder_point", e.target.value === "" ? undefined : Number(e.target.value))} /></div>
            <div><Label>Markup %</Label><Input type="number" value={form.markup_percent ?? ""} readOnly className="bg-muted" /></div>
            <div>
              <Label>Fornecedor</Label>
              <Select value={form.supplier ?? "__none__"} onValueChange={(v) => set("supplier", v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem fornecedor</SelectItem>
                  {activeSuppliers.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                  {form.supplier && !activeSuppliers.some((s) => s.name === form.supplier) && (
                    <SelectItem value={form.supplier}>{form.supplier}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {activeSuppliers.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Nenhum fornecedor cadastrado em /fornecedores.</p>
              )}
            </div>
            <div><Label>Localização</Label><Input maxLength={30} value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Notas</Label><Input maxLength={30} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
            <div className="sm:col-span-2 rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs font-semibold">Compatibilidade (veículos)</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addCompat}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
              {compat.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum veículo compatível cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {compat.map((c, idx) => (
                    <div key={idx} className="flex items-end gap-1">
                      <div className="grid flex-1 grid-cols-2 gap-1 sm:grid-cols-4">
                        <div><Label>Marca</Label><Input maxLength={30} value={c.brand ?? ""} onChange={(e) => setCompat(idx, "brand", e.target.value)} /></div>
                        <div><Label>Modelo</Label><Input maxLength={30} value={c.model ?? ""} onChange={(e) => setCompat(idx, "model", e.target.value)} /></div>
                        <div><Label>Ano</Label><Input maxLength={30} value={c.year ?? ""} onChange={(e) => setCompat(idx, "year", e.target.value)} /></div>
                        <div><Label>Motor</Label><Input maxLength={30} value={c.engine ?? ""} onChange={(e) => setCompat(idx, "engine", e.target.value)} /></div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeCompat(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <Label>Fotos do item</Label>
              <PhotoUploader
                photos={Array.isArray(form.photos) ? (form.photos as string[]) : []}
                onChange={(photos) => set("photos", photos)}
                max={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={save.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Categorias do estoque</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                maxLength={30}
                placeholder="Nova categoria"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
              />
              <Button onClick={handleAddCategory}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {Object.entries(categories).map(([k, v]) => {
                const isCustom = custom.some((c) => c.key === k);
                const used = items.some((i) => i.category === k);
                return (
                  <div key={k} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm">
                    <span>{v.label}</span>
                    {isCustom ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          if (used) return toast.error("Categoria em uso por itens do estoque");
                          removeCategory(k);
                          toast.success("Categoria removida");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">padrão</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
