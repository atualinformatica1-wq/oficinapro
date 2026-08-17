import { useCallback, useEffect, useState } from "react";
import { INVENTORY_CATEGORY, type LabelMap } from "@/lib/format";

const KEY = "inventory_categories";
const EVENT = "categories:changed";

export interface CustomCategory {
  key: string;
  label: string;
}

export function slugifyCategory(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getCustomCategories(): CustomCategory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as CustomCategory[]) : [];
  } catch {
    return [];
  }
}

function persist(list: CustomCategory[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}

export function buildCategoryMap(custom: CustomCategory[]): LabelMap {
  const map: LabelMap = { ...INVENTORY_CATEGORY };
  for (const c of custom) {
    map[c.key] = { label: c.label, className: "bg-primary/15 text-primary border-primary/30" };
  }
  return map;
}

export function useCategories() {
  const [custom, setCustom] = useState<CustomCategory[]>([]);

  useEffect(() => {
    const sync = () => setCustom(getCustomCategories());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addCategory = useCallback((label: string): { ok: boolean; error?: string } => {
    const clean = label.trim().slice(0, 30);
    if (!clean) return { ok: false, error: "Informe o nome da categoria" };
    const key = slugifyCategory(clean);
    if (!key) return { ok: false, error: "Nome inválido" };
    const existing = getCustomCategories();
    if (key in INVENTORY_CATEGORY || existing.some((c) => c.key === key)) {
      return { ok: false, error: "Categoria já existe" };
    }
    persist([...existing, { key, label: clean }]);
    return { ok: true };
  }, []);

  const removeCategory = useCallback((key: string) => {
    persist(getCustomCategories().filter((c) => c.key !== key));
  }, []);

  return { custom, categories: buildCategoryMap(custom), addCategory, removeCategory };
}
