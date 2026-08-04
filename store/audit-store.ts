import { create } from "zustand";
import { persist } from "zustand/middleware";
export type AuditEvent = { id: string; action: string; target: string; detail: string; createdAt: string };
type Store = { events: AuditEvent[]; record: (event: Omit<AuditEvent, "id" | "createdAt">) => void };
export const useAuditStore = create<Store>()(persist((set) => ({ events: [], record: (event) => set((state) => ({ events: [{ ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...state.events].slice(0, 200) })) }), { name: "urugo-audit" }));
