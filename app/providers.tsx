"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { useUIStore } from "@/lib/stores/ui-store";

function UIStoreRehydrate() {
  useEffect(() => {
    useUIStore.persist.rehydrate();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <UIStoreRehydrate />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
