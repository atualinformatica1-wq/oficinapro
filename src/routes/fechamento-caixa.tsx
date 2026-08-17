import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Printer, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtDate, PAYMENT_METHOD, CASHFLOW_TYPE } from "@/lib/format";
import { useRows, useSave, useRemove, type ServiceOrder, type Sale, type CashFlowEntry } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CashClosing = any;

export const Route = createFileRoute("/fechamento-caixa")({
  head: () => ({
    meta: [
      { title: "Fechamento de Caixa — MecânicaPRO" },
      { name: "description", content: "Fechamento diário do caixa com totais por forma de pagamento." },
    ],
  }),
  component: FechamentoPage,
});

const METHODS = ["dinheiro", "pix", "debito", "credito", "boleto", "transferencia"] as const;
const OPENING_KEY = (d: string) => `mecanicapro:saldo-inicial:${d}`;

function FechamentoPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [opening, setOpening] = useState<number | undefined>(undefined);
  const [savedOpening, setSavedOpening] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [closedBy, setClosedBy] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: orders = [] } = useRows<ServiceOrder>("service_orders");
  const { data: sales = [] } = useRows<Sale>("sales");
  const { data: cash = [] } = useRows<CashFlowEntry>("cash_flow", "transaction_date", false);
  const { data: closings = [] } = useRows<CashClosing>("cash_closings", "closing_date", false);
  const save = useSave("cash_closings");
  const remove = useRemove("cash_closings");

  const isClosed = useMemo(
    () => closings.some((c: CashClosing) => c.closing_date === date),
    [closings, date],
  );

  const dayOS = useMemo(
    () =>
      isClosed
        ? []
        : orders.filter(
            (o) => o.status === "concluida" && (o.completion_date ?? o.entry_date ?? "").slice(0, 10) === date,
          ),
    [orders, date, isClosed],
  );
  const daySales = useMemo(
    () => (isClosed ? [] : sales.filter((s) => (s.created_at ?? "").slice(0, 10) === date)),
    [sales, date, isClosed],
  );
  const dayCash = useMemo(
    () => (isClosed ? [] : cash.filter((c) => c.transaction_date === date)),
    [cash, date, isClosed],
  );


  const byMethod: Record<string, number> = {
    dinheiro: 0, pix: 0, debito: 0, credito: 0, boleto: 0, transferencia: 0, outros: 0,
  };
  for (const o of dayOS) {
    const m = (o.payment_method ?? "outros") as string;
    byMethod[m in byMethod ? m : "outros"] += Number(o.total_price);
  }
  for (const s of daySales) {
    const m = (s.payment_method ?? "outros") as string;
    byMethod[m in byMethod ? m : "outros"] += Number(s.total);
  }
  for (const c of dayCash) {
    if (c.type !== "entrada") continue;
    const m = (c.payment_method ?? "outros") as string;
    byMethod[m in byMethod ? m : "outros"] += Number(c.amount);
  }

  const osTotal = dayOS.reduce((s, o) => s + Number(o.total_price), 0);
  const salesTotal = daySales.reduce((s, x) => s + Number(x.total), 0);
  const manualIn = dayCash.filter((c) => c.type === "entrada").reduce((s, c) => s + Number(c.amount), 0);
  const manualOut = dayCash.filter((c) => c.type === "saida").reduce((s, c) => s + Number(c.amount), 0);
  const totalIn = osTotal + salesTotal + manualIn;
  const totalOut = manualOut;
  const finalBalance = (opening ?? 0) + totalIn - totalOut;

  // Saldo inicial gravado por dia (persistido no navegador)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(OPENING_KEY(date));
    const val = raw === null ? undefined : Number(raw);
    setSavedOpening(val);
    setOpening(val);
  }, [date]);

  const handleSaveOpening = () => {
    if (opening === undefined) {
      window.localStorage.removeItem(OPENING_KEY(date));
      setSavedOpening(undefined);
      toast.success("Saldo inicial removido");
      return;
    }
    window.localStorage.setItem(OPENING_KEY(date), String(opening));
    setSavedOpening(opening);
    toast.success(`Saldo inicial de ${fmtDate(date)} gravado`);
  };


  const handleClose = () => {
    save.mutate(
      {
        closing_date: date,
        opening_balance: opening ?? 0,
        total_inflow: totalIn,
        total_outflow: totalOut,
        cash_amount: byMethod.dinheiro,
        pix_amount: byMethod.pix,
        debit_amount: byMethod.debito,
        credit_amount: byMethod.credito,
        boleto_amount: byMethod.boleto,
        transfer_amount: byMethod.transferencia,
        other_amount: byMethod.outros,
        os_count: dayOS.length,
        sales_count: daySales.length,
        notes: notes.trim() || null,
        closed_by: closedBy.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Caixa fechado com sucesso");
          setConfirmOpen(false);
          window.localStorage.removeItem(OPENING_KEY(date));
          setSavedOpening(undefined);
          setOpening(undefined);
          setNotes("");
          setClosedBy("");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title="Fechamento de Caixa"
        subtitle="Consolidação diária de OS, PDV e lançamentos"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1 h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={isClosed}>
              <Lock className="mr-1 h-4 w-4" /> {isClosed ? "Caixa fechado" : "Fechar Caixa"}
            </Button>
          </div>
        }
      />

      {isClosed && (
        <div className="mb-4 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
          Caixa de {fmtDate(date)} já foi fechado. Os valores do dia foram zerados.
        </div>
      )}


      <Card className="card-shadow mb-4">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Saldo inicial</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={opening ?? ""}
                onChange={(e) => setOpening(e.target.value === "" ? undefined : Number(e.target.value))}
              />
              <Button variant="outline" onClick={handleSaveOpening} title="Gravar saldo inicial deste dia">
                <Save className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {savedOpening !== undefined
                ? `Gravado: ${fmtBRL(savedOpening)}`
                : "Nenhum saldo gravado para esta data"}
            </p>
          </div>

          <div>
            <Label>Responsável</Label>
            <Input placeholder="Nome de quem fechou" value={closedBy} onChange={(e) => setClosedBy(e.target.value)} />
          </div>
          <div>
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Entradas</p><p className="text-xl font-bold text-success">{fmtBRL(totalIn)}</p></CardContent></Card>
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Saídas</p><p className="text-xl font-bold text-destructive">{fmtBRL(totalOut)}</p></CardContent></Card>
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Saldo inicial</p><p className="text-xl font-bold">{fmtBRL(opening ?? 0)}</p></CardContent></Card>
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Saldo final</p><p className={`text-xl font-bold ${finalBalance >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(finalBalance)}</p></CardContent></Card>
      </div>

      <Card className="card-shadow mb-4">
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Totais por forma de pagamento</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {METHODS.map((m) => (
              <div key={m} className="flex items-center justify-between rounded-lg border p-3">
                <StatusBadge map={PAYMENT_METHOD} value={m} />
                <span className="font-semibold">{fmtBRL(byMethod[m])}</span>
              </div>
            ))}
            {byMethod.outros > 0 && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Outros / não informado</span>
                <span className="font-semibold">{fmtBRL(byMethod.outros)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="card-shadow lg:col-span-2">
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Movimentos do dia</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayOS.map((o) => (
                    <TableRow key={`os-${o.id}`}>
                      <TableCell><span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">OS</span></TableCell>
                      <TableCell className="max-w-52 truncate">{o.order_number} — {o.client_name}</TableCell>
                      <TableCell>{o.payment_method ? PAYMENT_METHOD[o.payment_method]?.label ?? o.payment_method : "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-success">+{fmtBRL(Number(o.total_price))}</TableCell>
                    </TableRow>
                  ))}
                  {daySales.map((s) => (
                    <TableRow key={`pdv-${s.id}`}>
                      <TableCell><span className="rounded bg-info/15 px-2 py-0.5 text-xs text-info">PDV</span></TableCell>
                      <TableCell className="max-w-52 truncate">{s.client_name ?? "Consumidor"}</TableCell>
                      <TableCell>{s.payment_method ? PAYMENT_METHOD[s.payment_method]?.label ?? s.payment_method : "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-success">+{fmtBRL(Number(s.total))}</TableCell>
                    </TableRow>
                  ))}
                  {dayCash.map((c) => (
                    <TableRow key={`cash-${c.id}`}>
                      <TableCell><StatusBadge map={CASHFLOW_TYPE} value={c.type} /></TableCell>
                      <TableCell className="max-w-52 truncate">{c.description}</TableCell>
                      <TableCell>{c.payment_method ? PAYMENT_METHOD[c.payment_method]?.label ?? c.payment_method : "—"}</TableCell>
                      <TableCell className={`text-right font-semibold ${c.type === "entrada" ? "text-success" : "text-destructive"}`}>
                        {c.type === "entrada" ? "+" : "-"}{fmtBRL(Number(c.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {dayOS.length + daySales.length + dayCash.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Nenhum movimento neste dia.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Resumo</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">OS concluídas</span><span className="font-semibold">{dayOS.length} · {fmtBRL(osTotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vendas PDV</span><span className="font-semibold">{daySales.length} · {fmtBRL(salesTotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Entradas manuais</span><span className="font-semibold">{fmtBRL(manualIn)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Saídas manuais</span><span className="font-semibold text-destructive">{fmtBRL(manualOut)}</span></div>
              <div className="my-2 border-t" />
              <div className="flex justify-between text-base"><span className="font-semibold">Saldo final</span><span className={`font-bold ${finalBalance >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(finalBalance)}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Fechamentos anteriores</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Saldo final</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closings.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum fechamento registrado.</TableCell></TableRow>
                ) : (
                  closings.map((c: CashClosing) => {
                    const bal = Number(c.opening_balance) + Number(c.total_inflow) - Number(c.total_outflow);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>{fmtDate(c.closing_date)}</TableCell>
                        <TableCell>{c.closed_by ?? "—"}</TableCell>
                        <TableCell className="text-right text-success">{fmtBRL(Number(c.total_inflow))}</TableCell>
                        <TableCell className="text-right text-destructive">{fmtBRL(Number(c.total_outflow))}</TableCell>
                        <TableCell className={`text-right font-semibold ${bal >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(bal)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Excluir fechamento?")) remove.mutate(c.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirmar fechamento — {fmtDate(date)}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Entradas</span><span className="font-semibold text-success">{fmtBRL(totalIn)}</span></div>
            <div className="flex justify-between"><span>Saídas</span><span className="font-semibold text-destructive">{fmtBRL(totalOut)}</span></div>
            <div className="flex justify-between"><span>Saldo inicial</span><span className="font-semibold">{fmtBRL(opening ?? 0)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base"><span className="font-semibold">Saldo final</span><span className={`font-bold ${finalBalance >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(finalBalance)}</span></div>
            <div className="pt-2">
              <Label>Observações</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleClose} disabled={save.isPending}>{save.isPending ? "Salvando..." : "Confirmar Fechamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
