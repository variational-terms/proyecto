"use client";

import { useState, type ReactNode } from "react";
import {
  WagmiProvider,
  createConfig,
  createStorage,
  cookieStorage,
  http,
  fallback,
} from "wagmi";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { APP_CHAIN, RPC_URL } from "@/lib/constants";

export const wagmiConfig = createConfig({
  chains: [APP_CHAIN],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: "Variational",
      appLogoUrl: "https://www.variational.io/favicon.ico",
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [APP_CHAIN.id]: fallback([
      http(RPC_URL, { batch: true, retryCount: 2 }),
      http(), // RPC público de respaldo si el principal falla
    ]),
  },
  ssr: true,
});

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}