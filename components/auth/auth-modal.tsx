"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, User } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/auth/auth-provider";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "register" | "forgot-password";

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    // Reset state on open. Keep this effect side-effect limited to state initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setMode("login");
    setFormData({ email: "", password: "", name: "", confirmPassword: "" });
  }, [isOpen]);

  const { signInWithEmail, createAccount, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "register") {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setIsLoading(false);
          return;
        }

        await createAccount(formData.email.trim(), formData.password);
        onClose();
        return;
      }

      if (mode === "login") {
        await signInWithEmail(formData.email.trim(), formData.password);
        onClose();
        return;
      }

      if (mode === "forgot-password") {
        toast.error("Password reset is not implemented yet.");
        setMode("login");
        return;
      }
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";
      toast.error(message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";
      toast.error(message || "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  };


  const getTitle = () => {
    if (mode === "login") return "Welcome Back";
    if (mode === "register") return "Create Account";
    return "Reset Password";
  };

  const getSubtitle = () => {
    if (mode === "login") return "Sign in to your account to continue";
    if (mode === "register") return "Join Urugo Buy for a premium shopping experience";
    return "Enter your email to reset your password";
  };

  const getButtonText = () => {
    if (isLoading) return "Please wait...";
    if (mode === "login") return "Sign In";
    if (mode === "register") return "Create Account";
    return "Reset Password";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-stone-900">{getTitle()}</h2>
          <p className="mt-2 text-sm text-stone-600">{getSubtitle()}</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 py-3 text-sm font-semibold text-stone-700 transition hover:border-[#8B4513] hover:text-[#8B4513] disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.03 2.53-2.16 3.31v2.77h3.49c2.04-1.88 3.24-4.64 3.24-7.89z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.77c-.98.66-2.23 1.06-3.79 1.06-2.91 0-5.37-1.96-6.25-4.63H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.75 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.72-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.64 0 3.11.56 4.27 1.67l3.2-3.2C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.57 2.84c.88-2.67 3.34-4.53 6.25-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-stone-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full rounded-full border border-stone-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#8B4513] focus:ring-2 focus:ring-[#8B4513]/20"
                  required
                />
              </div>
            </div>
          )}

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

          {mode !== "forgot-password" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Password</label>
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
          )}

          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-full border border-stone-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#8B4513] focus:ring-2 focus:ring-[#8B4513]/20"
                  required
                />
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-stone-300 text-[#8B4513] focus:ring-[#8B4513]" />
                <span className="text-stone-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setMode("forgot-password")}
                className="text-[#8B4513] transition hover:text-[#6d3410]"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#8B4513] py-3 font-semibold text-white transition hover:bg-[#6d3410] disabled:opacity-50"
          >
            {getButtonText()}
          </button>
        </form>

        <div className="text-center text-sm">
          {mode === "login" && (
            <p className="text-stone-600">
              Don&#39;t have an account?{" "}

              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-semibold text-[#8B4513] transition hover:text-[#6d3410]"
              >
                Sign up
              </button>
            </p>
          )}
          {mode === "register" && (
            <p className="text-stone-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-[#8B4513] transition hover:text-[#6d3410]"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === "forgot-password" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-semibold text-[#8B4513] transition hover:text-[#6d3410]"
            >
              Back to login
            </button>
          )}
        </div>

        <p className="text-center text-xs text-stone-500">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-[#8B4513] hover:underline">Terms of Service</a> and{" "}
          <a href="/privacy" className="text-[#8B4513] hover:underline">Privacy Policy</a>
        </p>
      </div>
    </Modal>
  );
}