import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useRows, type Client } from "@/lib/db";

interface ClientSelectorProps {
  value?: string | null;
  onSelect: (client: Client | null) => void;
  placeholder?: string;
}

export function ClientSelector({ value, onSelect, placeholder }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: clients = [] } = useRows<Client>("clients", "name", true);

  const selected = useMemo(() => clients.find((c) => c.id === value), [clients, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected
              ? `${selected.name}${selected.vehicle_plate ? ` — ${selected.vehicle_plate}` : ""}`
              : (placeholder ?? "Selecionar cliente...")}
          </span>
          <span className="flex items-center gap-1">
            {selected && (
              <X
                className="h-4 w-4 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(null);
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nome, placa ou telefone..." />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              {clients.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.vehicle_plate ?? ""} ${c.phone ?? ""} ${c.document ?? ""}`}
                  onSelect={() => {
                    onSelect(c);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.vehicle_plate, c.phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
