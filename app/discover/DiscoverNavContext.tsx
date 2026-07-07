"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type DiscoverNavContextValue = {
  isPending: boolean;
  navigate: (url: string) => void;
};

const DiscoverNavContext = createContext<DiscoverNavContextValue | null>(null);

export function DiscoverNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(url: string) {
    startTransition(() => {
      router.push(url, { scroll: false });
    });
  }

  return (
    <DiscoverNavContext.Provider value={{ isPending, navigate }}>
      {children}
    </DiscoverNavContext.Provider>
  );
}

export function useDiscoverNav() {
  const ctx = useContext(DiscoverNavContext);
  if (!ctx) throw new Error("useDiscoverNav must be used within a DiscoverNavProvider");
  return ctx;
}
