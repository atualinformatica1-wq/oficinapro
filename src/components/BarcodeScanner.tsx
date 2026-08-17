import { useEffect, useRef, useState } from "react";
import { ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  onDetected: (code: string) => void;
  triggerLabel?: string;
  iconOnly?: boolean;
}

/**
 * Universal barcode reader input.
 * Works with any USB/Bluetooth HID barcode scanner (they emit keystrokes + Enter),
 * and also supports manual typing. No camera required.
 */
export function BarcodeScanner({ onDetected, triggerLabel = "Escanear", iconOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyTime = useRef<number>(0);
  const buffer = useRef<string>("");

  useEffect(() => {
    if (open) {
      setValue("");
      buffer.current = "";
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const submit = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onDetected(trimmed);
    setOpen(false);
  };

  // Detect fast keystroke sequences typical of HID barcode scanners,
  // even when the input isn't focused.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const now = Date.now();
      const fast = now - lastKeyTime.current < 50;
      lastKeyTime.current = now;
      if (e.key === "Enter" && buffer.current.length >= 3) {
        e.preventDefault();
        submit(buffer.current);
        buffer.current = "";
        return;
      }
      if (e.key.length === 1) {
        if (!fast && buffer.current.length > 0) buffer.current = "";
        buffer.current += e.key;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Button type="button" variant="outline" size={iconOnly ? "icon" : "default"} onClick={() => setOpen(true)}>
        <ScanLine className="h-4 w-4" />
        {!iconOnly && <span className="ml-1">{triggerLabel}</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leitor de código de barras</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Aponte o leitor USB/Bluetooth para o código, ou digite manualmente e pressione Enter.
            </p>
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit(value);
                }
              }}
              placeholder="Escaneie ou digite o código..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={() => submit(value)} disabled={!value.trim()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
