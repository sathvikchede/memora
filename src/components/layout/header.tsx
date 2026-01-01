"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface HeaderProps {
  activeTab: string;
}

export function Header({ activeTab }: HeaderProps) {
  return (
    <>
      <header className="relative flex h-14 items-center gap-4 px-4 sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <div className="flex flex-1 items-center justify-center">
          {activeTab && (
            <span className="text-xl font-semibold text-white">
              {activeTab}
            </span>
          )}
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Button
            variant="outline"
            className="pointer-events-none rounded-full"
          >
            1500 Credits
          </Button>
        </div>
      </header>
      <Separator />
    </>
  );
}
