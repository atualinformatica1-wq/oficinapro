import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Client = Tables<"clients">;
export type ServiceOrder = Tables<"service_orders">;
export type InventoryItem = Tables<"inventory_items">;
export type Expense = Tables<"expenses">;
export type CashFlowEntry = Tables<"cash_flow">;
export type Technician = Tables<"technicians">;
export type Sale = Tables<"sales">;
export type FinancialGoal = Tables<"financial_goals">;
export type Supplier = Tables<"suppliers">;

export interface SelectedItem {
  item_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
}

export interface ExtraVehicle {
  plate?: string;
  brand?: string;
  model?: string;
  year?: string;
  mileage?: number;
  color?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (t: string) => (supabase as any).from(t);

export function useRows<T>(table: string, order = "created_at", ascending = false) {
  return useQuery<T[]>({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await from(table).select("*").order(order, { ascending });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useSave(table: string) {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (row: Record<string, any>) => {
      const { id, created_at: _c, updated_at: _u, ...rest } = row;
      if (id) {
        const { error } = await from(table).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await from(table).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useRemove(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

/** Abate estoque dos itens vendidos/usados na OS */
export async function deductStock(items: SelectedItem[]) {
  for (const it of items) {
    if (!it.item_id) continue;
    const { data } = await from("inventory_items")
      .select("quantity")
      .eq("id", it.item_id)
      .maybeSingle();
    if (data) {
      await from("inventory_items")
        .update({ quantity: Math.max(0, Number(data.quantity) - Number(it.quantity)) })
        .eq("id", it.item_id);
    }
  }
}

export function nextOrderNumber(orders: ServiceOrder[]): string {
  const year = new Date().getFullYear();
  const nums = orders
    .map((o) => {
      const m = /^OS-(\d{4})-(\d+)$/.exec(o.order_number ?? "");
      return m && Number(m[1]) === year ? Number(m[2]) : 0;
    })
    .filter(Boolean);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `OS-${year}-${String(next).padStart(4, "0")}`;
}

/** Comprime imagem para data URL (máx. 1024px, JPEG 0.7) */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1024;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas não suportado"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = url;
  });
}
