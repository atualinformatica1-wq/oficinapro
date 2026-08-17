import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Trash2, Printer, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { ClientSelector } from "@/components/ClientSelector";
import { fmtBRL, PAYMENT_METHOD } from "@/lib/format";
import { useRows, useSave, deductStock, type InventoryItem, type SelectedItem } from "@/lib/db";
import { useWorkshop } from "@/lib/workshop";


export const Route = createFileRoute("/pdv")({
  head: () => ({
    meta: [
      { title: "PDV — MecânicaPRO" },
      { name: "description", content: "Ponto de venda de peças e acessórios com baixa automática de estoque." },
    ],
  }),
  component: PDVPage,
});

const PDV_METHODS = ["dinheiro", "pix", "debito", "credito"] as const;

interface LastSale {
  items: SelectedItem[];
  total: number;
  client: string;
  method: string;
  date: string;
}

function PDVPage() {
  const { data: products = [] } = useRows<InventoryItem>("inventory_items", "name", true);
  const w = useWorkshop();

  const save = useSave("sales");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<SelectedItem[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [method, setMethod] = useState("dinheiro");
  const [lastSale, setLastSale] = useState<LastSale | null>(null);

  const filtered = products.filter((p) =>
    [p.name, p.sku].some((v) => (v ?? "").toLowerCase().includes(search.toLowerCase())),
  );
  const total = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const addToCart = (p: InventoryItem) => {
    setCart((c) => {
      const existing = c.find((i) => i.item_id === p.id);
      if (existing) return c.map((i) => (i.item_id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...c, { item_id: p.id, name: p.name, quantity: 1, unit_cost: Number(p.purchase_price), unit_price: Number(p.sale_price) }];
    });
  };

  const finalize = () => {
    if (cart.length === 0) return toast.error("Carrinho vazio");
    save.mutate(
      {
        client_id: clientId,
        client_name: clientName || null,
        client_phone: clientPhone || null,
        items: cart.map(({ item_id, name, quantity, unit_price }) => ({ item_id, name, quantity, unit_price })),
        total,
        payment_method: method,
      },
      {
        onSuccess: async () => {
          await deductStock(cart);
          qc.invalidateQueries({ queryKey: ["inventory_items"] });
          setLastSale({ items: cart, total, client: clientName || "Consumidor", method, date: new Date().toLocaleString("pt-BR") });
          setCart([]);
          setClientId(null);
          setClientName("");
          setClientPhone("");
          toast.success("Venda finalizada — estoque abatido");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader title="PDV — Ponto de Venda" subtitle="Venda de peças e acessórios" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <div className="relative mb-3">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={Number(p.quantity) <= 0}
                className="rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary disabled:opacity-40"
              >
                <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Estoque: {Number(p.quantity)}</p>
                <p className="mt-1 font-bold text-primary">{fmtBRL(Number(p.sale_price))}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">Nenhum produto no estoque.</p>
            )}
          </div>
        </div>

        <Card className="card-shadow h-fit">
          <CardContent className="space-y-3 p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShoppingCart className="h-4 w-4" /> Carrinho
            </h2>
            {cart.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Carrinho vazio</p>
            ) : (
              cart.map((it, idx) => (
                <div key={it.item_id} className="grid grid-cols-[minmax(0,1fr)_60px_auto_auto] items-center gap-2 text-sm">
                  <span className="min-w-0 truncate">{it.name}</span>
                  <Input
                    type="number"
                    min={1}
                    className="h-8"
                    value={it.quantity}
                    onChange={(e) => setCart((c) => c.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) || 1 } : x)))}
                  />
                  <span className="font-medium">{fmtBRL(it.quantity * it.unit_price)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCart((c) => c.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}

            <div className="space-y-2 border-t pt-3">
              <Label>Cliente (opcional)</Label>
              <ClientSelector
                value={clientId}
                onSelect={(c) => {
                  setClientId(c?.id ?? null);
                  setClientName(c?.name ?? "");
                  setClientPhone(c?.phone ?? "");
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nome manual" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                <Input placeholder="Telefone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PDV_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD[m].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{fmtBRL(total)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={finalize} disabled={save.isPending || cart.length === 0}>
              Finalizar Venda
            </Button>
            {lastSale && (
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                <Printer className="mr-1 h-4 w-4" /> Imprimir último recibo
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {lastSale && (
        <div className="print-area hidden print:block">
          <div className="border-b-2 border-black pb-2">
            <h1 className="text-xl font-bold">{w.name || "MecânicaPRO"} — Recibo de Venda</h1>
            {w.legal_name && <p className="text-sm">{w.legal_name}</p>}
            {w.cnpj && <p className="text-sm">CNPJ: {w.cnpj}</p>}
            {w.address && <p className="text-sm">{w.address}</p>}
            {(w.phone || w.email) && (
              <p className="text-sm">
                {w.phone}
                {w.phone && w.email ? " · " : ""}
                {w.email}
              </p>
            )}
          </div>
          <p className="mt-2 text-sm">{lastSale.date}</p>
          <p className="text-sm">Cliente: {lastSale.client}</p>

          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1">Item</th><th className="py-1 text-right">Qtd</th><th className="py-1 text-right">Unit.</th><th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {lastSale.items.map((it, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-1">{it.name}</td>
                  <td className="py-1 text-right">{it.quantity}</td>
                  <td className="py-1 text-right">{fmtBRL(it.unit_price)}</td>
                  <td className="py-1 text-right">{fmtBRL(it.quantity * it.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-right text-lg font-bold">TOTAL: {fmtBRL(lastSale.total)}</p>
          <p className="text-right text-sm">Pagamento: {PAYMENT_METHOD[lastSale.method]?.label ?? lastSale.method}</p>
        </div>
      )}
    </div>
  );
}
