import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { fmtBRL } from "@/lib/format";

export const Route = createFileRoute("/precificacao")({
  head: () => ({
    meta: [
      { title: "Precificação — MecânicaPRO" },
      { name: "description", content: "Calculadora de preço de venda com markup e margem bidirecionais." },
    ],
  }),
  component: PrecificacaoPage,
});

function PrecificacaoPage() {
  const [cost, setCost] = useState(100);
  const [markup, setMarkup] = useState(50);

  const price = cost * (1 + markup / 100);
  const marginPct = price > 0 ? ((price - cost) / price) * 100 : 0;

  const setFromPrice = (p: number) => {
    if (cost > 0) setMarkup(((p - cost) / cost) * 100);
  };
  const setFromMargin = (m: number) => {
    if (m < 100) {
      const p = cost / (1 - m / 100);
      if (cost > 0) setMarkup(((p - cost) / cost) * 100);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader title="Precificação" subtitle="Calculadora bidirecional de markup, margem e preço de venda" />

      <Card className="card-shadow">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <Label>Custo (R$)</Label>
            <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Markup (%)</Label>
            <Input type="number" step="0.1" value={markup.toFixed(1)} onChange={(e) => setMarkup(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Margem (%)</Label>
            <Input type="number" step="0.1" value={marginPct.toFixed(1)} onChange={(e) => setFromMargin(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Preço de venda (R$)</Label>
            <Input type="number" step="0.01" value={price.toFixed(2)} onChange={(e) => setFromPrice(Number(e.target.value) || 0)} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Custo</p><p className="truncate text-lg font-bold">{fmtBRL(cost)}</p></CardContent></Card>
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Lucro unitário</p><p className="truncate text-lg font-bold text-success">{fmtBRL(price - cost)}</p></CardContent></Card>
        <Card className="card-shadow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Preço final</p><p className="truncate text-lg font-bold text-primary">{fmtBRL(price)}</p></CardContent></Card>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Altere qualquer campo e os demais são recalculados automaticamente. Markup é calculado sobre o custo; margem é
        calculada sobre o preço de venda.
      </p>
    </div>
  );
}
