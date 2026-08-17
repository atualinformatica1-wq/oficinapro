import { useEffect, useState } from "react";

export interface WorkshopInfo {
  name: string;
  legal_name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
}

const KEY = "workshop_info";

export const defaultWorkshop: WorkshopInfo = {
  name: "MecânicaPRO",
  legal_name: "",
  cnpj: "",
  address: "",
  phone: "",
  email: "",
};

export function getWorkshop(): WorkshopInfo {
  if (typeof window === "undefined") return defaultWorkshop;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultWorkshop;
    return { ...defaultWorkshop, ...JSON.parse(raw) };
  } catch {
    return defaultWorkshop;
  }
}

export function saveWorkshop(info: WorkshopInfo) {
  localStorage.setItem(KEY, JSON.stringify(info));
  window.dispatchEvent(new Event("workshop:changed"));
}

export function useWorkshop() {
  const [info, setInfo] = useState<WorkshopInfo>(defaultWorkshop);
  useEffect(() => {
    setInfo(getWorkshop());
    const h = () => setInfo(getWorkshop());
    window.addEventListener("workshop:changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("workshop:changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return info;
}
