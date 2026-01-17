
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/space/user-menu";

interface HeaderProps {
  activeTab: string;
}

export function Header({ activeTab }: HeaderProps) {
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
          <UserMenu />
        </div>
      </header>
      <Separator />
    </>
  );
}
