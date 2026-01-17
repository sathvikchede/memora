
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useSpace } from "@/context/space-context";
import { Coins } from "lucide-react";

interface HeaderProps {
  activeTab: string;
}

export function Header({ activeTab }: HeaderProps) {
  const { currentMembership } = useSpace();
  const creditBalance = currentMembership?.profile?.creditBalance ?? 0;

  return (
    <>
      <header className="relative flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <div className="flex-1" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {activeTab && (
            <span className="text-xl font-semibold text-white">
              {activeTab}
            </span>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <Coins className="h-4 w-4" />
            <span>{creditBalance} credits</span>
          </div>
        </div>
      </header>
      <Separator />
    </>
  );
}
