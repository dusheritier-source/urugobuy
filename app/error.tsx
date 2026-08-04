"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { if (process.env.NODE_ENV !== "production") console.error(error); }, [error]); return <main className="mx-auto max-w-lg px-4 py-20 text-center"><AlertTriangle className="mx-auto text-amber-600" size={48} /><h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1><p className="mt-2 text-stone-600">The error was contained and no checkout action was retried automatically.</p><Button onClick={reset} className="mt-6">Try again</Button>{error.digest && <p className="mt-4 text-xs text-stone-400">Reference: {error.digest}</p>}</main>; }
