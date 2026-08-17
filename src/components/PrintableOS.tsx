import type { ServiceOrder, SelectedItem } from "@/lib/db";
import { useWorkshop } from "@/lib/workshop";
import {
  fmtBRL,
  fmtDate,
  fmtDateTime,
  labelOf,
  OS_CATEGORY,
  OS_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  APPROVAL_STATUS,
} from "@/lib/format";

export function PrintableOS({ os }: { os: ServiceOrder }) {
  const items = (os.selected_items as unknown as SelectedItem[]) ?? [];
  const w = useWorkshop();
  return (
    <div className="print-area hidden print:block">
      <div className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold">{w.name || "MecânicaPRO"}</h1>
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
        <div className="text-right">
          <p className="text-xl font-bold">{os.order_number}</p>
          <p className="text-sm">Entrada: {fmtDateTime(os.entry_date)}</p>
          {os.estimated_delivery && <p className="text-sm">Previsão: {fmtDate(os.estimated_delivery)}</p>}
        </div>
      </div>



      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <h2 className="mb-1 font-bold uppercase">Cliente</h2>
          <p>{os.client_name}</p>
          {os.client_phone && <p>Tel: {os.client_phone}</p>}
          {os.client_email && <p>Email: {os.client_email}</p>}
        </div>
        <div>
          <h2 className="mb-1 font-bold uppercase">Veículo</h2>
          <p>
            {os.vehicle_model} {os.vehicle_year ? `(${os.vehicle_year})` : ""}
          </p>
          {os.vehicle_plate && <p>Placa: {os.vehicle_plate}</p>}
          {os.vehicle_mileage != null && <p>KM: {Number(os.vehicle_mileage).toLocaleString("pt-BR")}</p>}
        </div>
      </div>

      <div className="mt-4 text-sm">
        <p>
          <strong>Categoria:</strong> {labelOf(OS_CATEGORY, os.category)} · <strong>Status:</strong>{" "}
          {labelOf(OS_STATUS, os.status)} · <strong>Técnico:</strong> {os.technician || "—"}
        </p>
        <p>
          <strong>Aprovação:</strong> {labelOf(APPROVAL_STATUS, os.approval_status)}
          {os.approval_notes ? ` — ${os.approval_notes}` : ""}
        </p>
      </div>

      {os.service_description && (
        <div className="mt-4 text-sm">
          <h2 className="font-bold uppercase">Descrição do Serviço</h2>
          <p className="whitespace-pre-wrap">{os.service_description}</p>
        </div>
      )}
      {os.diagnosis && (
        <div className="mt-3 text-sm">
          <h2 className="font-bold uppercase">Diagnóstico Técnico</h2>
          <p className="whitespace-pre-wrap">{os.diagnosis}</p>
        </div>
      )}

      {items.length > 0 && (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1">Item</th>
              <th className="py-1 text-right">Qtd</th>
              <th className="py-1 text-right">Preço Unit.</th>
              <th className="py-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-gray-300">
                <td className="py-1">{it.name}</td>
                <td className="py-1 text-right">{it.quantity}</td>
                <td className="py-1 text-right">{fmtBRL(it.unit_price)}</td>
                <td className="py-1 text-right">{fmtBRL(it.quantity * it.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 ml-auto w-64 text-sm">
        <div className="flex justify-between">
          <span>Mão de obra:</span>
          <span>{fmtBRL(Number(os.labor_price))}</span>
        </div>
        <div className="flex justify-between">
          <span>Peças:</span>
          <span>{fmtBRL(Number(os.parts_price))}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-black pt-1 text-base font-bold">
          <span>TOTAL:</span>
          <span>{fmtBRL(Number(os.total_price))}</span>
        </div>
        <p className="mt-1">
          Pagamento: {labelOf(PAYMENT_STATUS, os.payment_status)}
          {os.payment_method ? ` — ${labelOf(PAYMENT_METHOD, os.payment_method)}` : ""}
        </p>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm">
        <div className="border-t border-black pt-1">Assinatura do Cliente</div>
        <div className="border-t border-black pt-1">Responsável Técnico</div>
      </div>
    </div>
  );
}
