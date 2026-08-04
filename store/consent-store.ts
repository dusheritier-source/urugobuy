import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ConsentChoice = "unset" | "necessary" | "all";
type Store = { choice: ConsentChoice; setChoice: (choice: Exclude<ConsentChoice, "unset">) => void };
export const useConsentStore = create<Store>()(persist((set) => ({ choice: "unset", setChoice: (choice) => set({ choice }) }), { name: "urugo-cookie-consent" }));
