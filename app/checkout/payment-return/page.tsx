import { Suspense } from "react";
import { PaymentReturn } from "./payment-return";

export default function PaymentReturnPage() {
  return <Suspense fallback={<main className="mx-auto max-w-lg px-4 py-20 text-center">Confirming payment…</main>}><PaymentReturn /></Suspense>;
}
