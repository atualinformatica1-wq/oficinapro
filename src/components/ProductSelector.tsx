import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { fmtBRL } from "@/lib/format";
import { useRows, type InventoryItem, type SelectedItem } from "@/lib/db";

interface ProductSelectorProps {
  items: SelectedItem[];
  onChange: (items: SelectedItem[]) => void;
}

export function ProductSelector({ items, onChange }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: products = [] } = useRows<InventoryItem>("inventory_items", "name", true);

  const addProduct = (p: InventoryItem) => {
    if (items.some((i) => i.item_id === p.id)) return;
    onChange([
      ...items,
      {
        item_id: p.id,
        name: p.name,
        quantity: 1,
        unit_cost: Number(p.purchase_price),
        unit_price: Number(p.sale_price),
      },
    ]);
    setOpen(false);
  };

  const update = (idx: number, patch: Partial<SelectedItem>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalCost = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" /> Adicionar produto do estoque
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar produto..." />
            <CommandList>
              <CommandEmpty>Nenhum produto.</CommandEmpty>
              <CommandGroup>
                {products.map((p) => (
                  <CommandItem key={p.id} value={`${p.name} ${p.sku ?? ""}`} onSelect={() => addProduct(p)}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Estoque: {Number(p.quantity)} · {fmtBRL(Number(p.sale_price))}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {items.length > 0 && (
        <div className="space-y-2 rounded-lg border p-3">
          {items.map((it, idx) => (
            <div key={it.item_id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_70px_100px_100px_auto]">
              <p className="min-w-0 truncate text-sm font-medium">{it.name}</p>
              <Input
                type="number"
                min={1}
                className="h-8 w-16 sm:w-full"
                value={it.quantity}
                onChange={(e) => update(idx, { quantity: Number(e.target.value) || 1 })}
              />
              <Input
                type="number"
                step="0.01"
                className="hidden h-8 sm:block"
                title="Custo unitário"
                value={it.unit_cost}
                onChange={(e) => update(idx, { unit_cost: Number(e.target.value) || 0 })}
              />
              <Input
                type="number"
                step="0.01"
                className="hidden h-8 sm:block"
                title="Preço unitário"
                value={it.unit_price}
                onChange={(e) => update(idx, { unit_price: Number(e.target.value) || 0 })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 text-sm">
            <span className="text-muted-foreground">Custo peças: {fmtBRL(totalCost)}</span>
            <span className="font-semibold">Total peças: {fmtBRL(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
