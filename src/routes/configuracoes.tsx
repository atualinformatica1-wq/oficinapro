import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { getWorkshop, saveWorkshop, defaultWorkshop, type WorkshopInfo } from "@/lib/workshop";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — MecânicaPRO" },
      { name: "description", content: "Dados da oficina exibidos em recibos e impressões." },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [info, setInfo] = useState<WorkshopInfo>(defaultWorkshop);

  useEffect(() => {
    setInfo(getWorkshop());
  }, []);

  const set = <K extends keyof WorkshopInfo>(k: K, v: WorkshopInfo[K]) =>
    setInfo((i) => ({ ...i, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    saveWorkshop(info);
    toast.success("Dados da oficina salvos");
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader title="Configurações da Oficina" subtitle="Estes dados aparecem nos recibos impressos" />
      <Card className="card-shadow">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Nome fantasia</Label>
                <Input value={info.name} onChange={(e) => set("name", e.target.value)} placeholder="MecânicaPRO" />
              </div>
              <div className="space-y-1">
                <Label>Razão social</Label>
                <Input value={info.legal_name} onChange={(e) => set("legal_name", e.target.value)} placeholder="Ex.: Oficina Silva LTDA" />
              </div>
              <div className="space-y-1">
                <Label>CNPJ</Label>
                <Input value={info.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={info.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>E-mail</Label>
                <Input value={info.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@oficina.com" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Endereço completo</Label>
                <Input
                  value={info.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF, CEP"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
