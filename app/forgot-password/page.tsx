"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/auth-provider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { resetPassword } = useAuth();
  return <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12"><div className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-slate-900"><Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8B4513]"><ArrowLeft size={16} /> Back to sign in</Link><h1 className="mt-6 text-2xl font-semibold">Reset your password</h1><p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Enter the email associated with your account and we’ll send a secure reset link.</p><form className="mt-6 space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await resetPassword(email.trim()); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send reset email"); } finally { setBusy(false); } }}><label className="block text-sm font-semibold">Email address<div className="relative mt-2"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={17} /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-full border border-stone-200 pl-11 pr-4 outline-none focus:border-[#8B4513]" /></div></label><button disabled={busy} className="w-full rounded-full bg-[#8B4513] py-3 font-semibold text-white disabled:opacity-60">{busy ? "Sending…" : "Send reset link"}</button></form></div></main>;
}
