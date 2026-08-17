import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { fmtBRL, PAYMENT_METHOD } from "@/lib/format";

interface CashClosingDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  total: number;
  defaultMethod?: string | null;
  onConfirm: (data: {
    payment_method: string;
    amount_received: number;
    change: number;
    notes?: string;
  }) => void;
  isPending?: boolean;
}

export function CashClosingDialog({
  open,
  onOpenChange,
  total,
  defaultMethod,
  onConfirm,
  isPending,
}: CashClosingDialogProps) {
  const [method, setMethod] = useState<string>(defaultMethod ?? "dinheiro");
  const [received, setReceived] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setMethod(defaultMethod ?? "dinheiro");
      setReceived(total);
      setNotes("");
    }
  }, [open, defaultMethod, total]);

  const change = Math.max(0, (received ?? 0) - total);

  const handle = () => {
    if (!method) return toast.error("Selecione a forma de pagamento");
    if ((received ?? 0) < total) return toast.error("Valor recebido menor que o total");
    onConfirm({
      payment_method: method,
      amount_received: received ?? total,
      change,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fechamento de Caixa da OS</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Total a receber</p>
            <p className="text-2xl font-bold text-primary">{fmtBRL(total)}</p>
          </div>

          <div>
            <Label>Forma de pagamento *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Valor recebido</Label>
            <Input
              type="number"
              step="0.01"
              value={received ?? ""}
              onChange={(e) => setReceived(e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Troco</span>
            <span className={`text-lg font-bold ${change > 0 ? "text-success" : ""}`}>{fmtBRL(change)}</span>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handle} disabled={isPending}>
            {isPending ? "Fechando..." : "Confirmar Fechamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
