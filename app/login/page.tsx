"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, user, loading } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInWithEmail(formData.email.trim(), formData.password);
      router.push("/profile");
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function onGoogle() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push("/profile");
    } catch (err: any) {
      toast.error(err?.message || "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  }

  // If already logged in, just send them to profile.
  if (!loading && user) {
    router.replace("/profile");
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Welcome Back</h1>
        <p className="mt-2 text-sm text-stone-600">Sign in to your account to continue</p>

        <div className="mt-6">
          <button
            type="button"
            onClick={onGoogle}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 py-3 text-sm font-semibold text-stone-700 transition hover:border-[#8B4513] hover:text-[#8B4513] disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.03 2.53-2.16 3.31v2.77h3.49c2.04-1.88 3.24-4.64 3.24-7.89z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.77c-.98.66-2.23 1.06-3.79 1.06-2.91 0-5.37-1.96-6.25-4.63H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.75 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.72-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.64 0 3.11.56 4.27 1.67l3.2-3.2C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.57 2.84c.88-2.67 3.34-4.53 6.25-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-stone-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-full border border-stone-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#8B4513] focus:ring-2 focus:ring-[#8B4513]/20"
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between"><label className="block text-sm font-medium text-stone-700">Password</label><Link href="/forgot-password" className="text-xs font-semibold text-[#8B4513] hover:underline">Forgot password?</Link></div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-full border border-stone-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#8B4513] focus:ring-2 focus:ring-[#8B4513]/20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-[#8B4513] py-3 font-semibold text-white transition hover:bg-[#6d3410] disabled:opacity-50"
            >
              {isLoading ? "Please wait..." : "Sign In"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-stone-600">
            Don't have an account?{" "}
            <a href="/register" className="font-semibold text-[#8B4513] transition hover:text-[#6d3410]">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

