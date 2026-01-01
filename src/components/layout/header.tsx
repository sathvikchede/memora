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
      <header className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <div className="hidden items-baseline gap-4 md:flex">
          <h1 className="text-2xl font-bold">memora.</h1>
          {activeTab && <span className="text-sm text-muted-foreground">{activeTab}</span>}
        </div>
        <div className="ml-auto">
          <Button variant="outline" className="pointer-events-none rounded-full">
            1500 Credits
          </Button>
        </div>
      </header>
      <Separator />
    </>
  );
}
