export const fmtBRL = (v?: number | null) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtNum = (v?: number | null) => Number(v ?? 0).toLocaleString("pt-BR");

export const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const date = d.length === 10 ? new Date(d + "T12:00:00") : new Date(d);
  return date.toLocaleDateString("pt-BR");
};

export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export type LabelInfo = { label: string; className: string };
export type LabelMap = Record<string, LabelInfo>;

const neutral = "bg-muted text-muted-foreground";
const blue = "bg-primary/10 text-primary";
const green = "bg-success/15 text-success";
const yellow = "bg-warning/15 text-warning";
const red = "bg-destructive/10 text-destructive";
const purple = "bg-info/15 text-info";

export const OS_STATUS: LabelMap = {
  aberta: { label: "Aberta", className: blue },
  em_andamento: { label: "Em Andamento", className: yellow },
  aguardando_peca: { label: "Aguardando Peça", className: purple },
  aguardando_aprovacao: { label: "Aguardando Aprovação", className: yellow },
  concluida: { label: "Concluída", className: green },
  cancelada: { label: "Cancelada", className: red },
};

export const OS_CATEGORY: LabelMap = {
  preventiva: { label: "Preventiva", className: green },
  diagnostico: { label: "Diagnóstico", className: purple },
  reparo_mecanico: { label: "Reparo Mecânico", className: blue },
  especializado: { label: "Especializado", className: yellow },
  venda_pecas: { label: "Venda de Peças", className: neutral },
};

export const APPROVAL_STATUS: LabelMap = {
  pendente: { label: "Pendente", className: yellow },
  aprovado: { label: "Aprovado", className: green },
  rejeitado: { label: "Rejeitado", className: red },
};

export const PAYMENT_STATUS: LabelMap = {
  pendente: { label: "Pendente", className: yellow },
  parcial: { label: "Parcial", className: purple },
  pago: { label: "Pago", className: green },
  inadimplente: { label: "Inadimplente", className: red },
};

export const PAYMENT_METHOD: LabelMap = {
  dinheiro: { label: "Dinheiro", className: neutral },
  pix: { label: "PIX", className: green },
  debito: { label: "Débito", className: blue },
  credito: { label: "Crédito", className: blue },
  boleto: { label: "Boleto", className: neutral },
  transferencia: { label: "Transferência", className: neutral },
};

export const INVENTORY_CATEGORY: LabelMap = {
  filtros: { label: "Filtros", className: blue },
  oleo: { label: "Óleo", className: yellow },
  freios: { label: "Freios", className: red },
  suspensao: { label: "Suspensão", className: purple },
  motor: { label: "Motor", className: blue },
  eletrica: { label: "Elétrica", className: yellow },
  arrefecimento: { label: "Arrefecimento", className: blue },
  pneus: { label: "Pneus", className: neutral },
  baterias: { label: "Baterias", className: green },
  acessorios: { label: "Acessórios", className: neutral },
  outros: { label: "Outros", className: neutral },
};

export const TURNOVER_CLASS: LabelMap = {
  giro_rapido: { label: "Giro Rápido", className: green },
  giro_medio: { label: "Giro Médio", className: yellow },
  estoque_parado: { label: "Estoque Parado", className: red },
};

export const ORIGIN: LabelMap = {
  OEM: { label: "OEM (Original)", className: blue },
  paralela: { label: "Paralela", className: neutral },
  recondicionada: { label: "Recondicionada", className: yellow },
};

export const EXPENSE_CATEGORY: LabelMap = {
  equipe_salarios: { label: "Equipe — Salários", className: blue },
  equipe_encargos: { label: "Equipe — Encargos", className: blue },
  equipe_comissoes: { label: "Equipe — Comissões", className: blue },
  equipe_beneficios: { label: "Equipe — Benefícios", className: blue },
  equipe_treinamento: { label: "Equipe — Treinamento", className: blue },
  pecas_compra: { label: "Compra de Peças", className: purple },
  estrutura_aluguel: { label: "Estrutura — Aluguel", className: yellow },
  estrutura_energia: { label: "Estrutura — Energia", className: yellow },
  estrutura_agua: { label: "Estrutura — Água", className: yellow },
  estrutura_seguranca: { label: "Estrutura — Segurança", className: yellow },
  operacional_seguros: { label: "Operacional — Seguros", className: neutral },
  operacional_marketing: { label: "Operacional — Marketing", className: neutral },
  operacional_contabilidade: { label: "Operacional — Contabilidade", className: neutral },
  operacional_sistemas: { label: "Operacional — Sistemas", className: neutral },
  operacional_internet: { label: "Operacional — Internet", className: neutral },
  equipamentos_manutencao: { label: "Equipamentos — Manutenção", className: green },
  equipamentos_compra: { label: "Equipamentos — Compra", className: green },
  outros: { label: "Outros", className: neutral },
};

export const EXPENSE_STATUS: LabelMap = {
  pendente: { label: "Pendente", className: yellow },
  pago: { label: "Pago", className: green },
  atrasado: { label: "Atrasado", className: red },
};

export const COST_TYPE: LabelMap = {
  fixo: { label: "Fixo", className: blue },
  variavel: { label: "Variável", className: purple },
};

export const CASHFLOW_TYPE: LabelMap = {
  entrada: { label: "Entrada", className: green },
  saida: { label: "Saída", className: red },
};

export const SPECIALTY: LabelMap = {
  mecanica_geral: { label: "Mecânica Geral", className: blue },
  eletrica: { label: "Elétrica", className: yellow },
  injecao_eletronica: { label: "Injeção Eletrônica", className: purple },
  ar_condicionado: { label: "Ar-Condicionado", className: blue },
  funilaria: { label: "Funilaria", className: neutral },
  suspensao_freios: { label: "Suspensão e Freios", className: red },
  cambio: { label: "Câmbio", className: green },
  motor: { label: "Motor", className: blue },
};

export const TECH_STATUS: LabelMap = {
  ativo: { label: "Ativo", className: green },
  ferias: { label: "Férias", className: yellow },
  afastado: { label: "Afastado", className: purple },
  desligado: { label: "Desligado", className: red },
};

export const GOAL_TYPE: LabelMap = {
  receita_mensal: { label: "Receita Mensal", className: blue },
  lucro_mensal: { label: "Lucro Mensal", className: green },
  ticket_medio: { label: "Ticket Médio", className: purple },
  carros_atendidos: { label: "Carros Atendidos", className: yellow },
  margem_liquida: { label: "Margem Líquida", className: green },
  reducao_custos: { label: "Redução de Custos", className: red },
  outro: { label: "Outro", className: neutral },
};

export const GOAL_PERIOD: LabelMap = {
  mensal: { label: "Mensal", className: neutral },
  trimestral: { label: "Trimestral", className: neutral },
  anual: { label: "Anual", className: neutral },
};

export const GOAL_STATUS: LabelMap = {
  em_andamento: { label: "Em Andamento", className: yellow },
  atingida: { label: "Atingida", className: green },
  nao_atingida: { label: "Não Atingida", className: red },
};

export const labelOf = (map: LabelMap, key?: string | null) =>
  (key && map[key]?.label) || key || "—";
