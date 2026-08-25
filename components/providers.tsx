"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LocaleProvider } from "@/components/locale/locale-context";
import { CartNoticeToasts } from "@/components/cart/cart-notice-toasts";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LocaleProvider><AuthProvider><CartNoticeToasts />{children}</AuthProvider></LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

