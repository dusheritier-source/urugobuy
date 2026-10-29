import { UnsubscribeForm } from "@/components/auth/unsubscribe-form";

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-12">
    <div className="rounded-3xl border border-stone-200 bg-white p-7 dark:border-white/10 dark:bg-slate-900">
      <h1 className="text-2xl font-semibold">Email preferences</h1>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">Confirm if you no longer want to receive newsletter and promotional emails from Urugo Buy.</p>
      <UnsubscribeForm token={token ?? ""} />
    </div>
  </main>;
}
