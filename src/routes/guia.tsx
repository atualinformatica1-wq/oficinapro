import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/guia")({
  head: () => ({
    meta: [
      { title: "Guia Financeiro — MecânicaPRO" },
      { name: "description", content: "Guia educativo de gestão financeira para oficinas mecânicas." },
    ],
  }),
  component: GuiaPage,
});

const sections = [
  {
    title: "1. Separe custos fixos e variáveis",
    body: "Custos fixos (aluguel, salários, sistemas) existem mesmo sem atender nenhum carro. Custos variáveis (peças, comissões) crescem com o movimento. Conhecer essa divisão é o primeiro passo para calcular seu ponto de equilíbrio: quanto você precisa faturar por mês só para pagar as contas.",
  },
  {
    title: "2. Markup não é lucro",
    body: "Aplicar 100% de markup em uma peça não significa 100% de lucro. Do preço de venda ainda saem impostos, taxas de cartão e despesas fixas. Use a calculadora de Precificação para enxergar a margem real sobre o preço de venda — é ela que paga as contas.",
  },
  {
    title: "3. Acompanhe o ticket médio",
    body: "Ticket médio = faturamento ÷ número de OS. Aumentá-lo costuma ser mais barato do que atrair clientes novos: ofereça revisões preventivas, troca de filtros e fluidos junto com o serviço principal, e registre tudo na OS.",
  },
  {
    title: "4. Controle o estoque como dinheiro parado",
    body: "Peça parada na prateleira é capital imobilizado. Classifique itens por giro (rápido, médio, parado), defina estoque mínimo e ponto de reposição, e evite comprar volume de itens de giro lento só por desconto.",
  },
  {
    title: "5. Fluxo de caixa manda mais que faturamento",
    body: "Uma oficina pode faturar bem e quebrar por falta de caixa. Registre todas as entradas e saídas, cuidado com prazos longos de recebimento (crédito parcelado, boleto) e mantenha uma reserva de pelo menos 1 a 2 meses de custos fixos.",
  },
  {
    title: "6. Defina metas e revise todo mês",
    body: "Metas de receita, lucro e carros atendidos dão direção à equipe. Use a página de Metas para acompanhar o progresso e a de Relatórios para ver o DRE simplificado: receita, custos, despesas e margem líquida. O que não é medido não melhora.",
  },
  {
    title: "7. Remunere técnicos com inteligência",
    body: "Combine salário fixo com comissão sobre serviços concluídos para alinhar produtividade e qualidade. Acompanhe horas estimadas vs realizadas por OS para identificar gargalos e treinar a equipe onde há retrabalho.",
  },
];

function GuiaPage() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader
        title="Guia Financeiro"
        subtitle="Boas práticas de gestão financeira para oficinas mecânicas"
      />
      <div className="space-y-3">
        {sections.map((s) => (
          <Card key={s.title} className="card-shadow">
            <CardContent className="p-5">
              <h2 className="font-semibold">{s.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
