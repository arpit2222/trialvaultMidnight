"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import { wagmiConfig } from "@/lib/wagmi/config";
import { MidnightProvider } from "@/lib/midnight/context";

type ThemeMode = "dark" | "light";

const ThemeContext = createContext<{ mode: ThemeMode; toggle: () => void } | null>(null);

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used within RootProviders");
  return ctx;
}

/**
 * RootProviders wires wallet + query clients without exposing any private health data.
 */
export function RootProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggle: () => setMode((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [mode]
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MidnightProvider>
          <ThemeContext.Provider value={value}>
            <RainbowKitProvider
              theme={
                mode === "dark"
                  ? darkTheme({ accentColor: "#1A6FBF" })
                  : lightTheme({ accentColor: "#1A6FBF" })
              }
            >
              {children}
              <Toaster richColors position="top-right" />
            </RainbowKitProvider>
          </ThemeContext.Provider>
        </MidnightProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
