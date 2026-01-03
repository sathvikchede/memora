
"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInformation } from "@/context/information-context";
import { ChevronDown, User } from "lucide-react";

interface HeaderProps {
  activeTab: string;
}

export function Header({ activeTab }: HeaderProps) {
  const { users, currentUser, setCurrentUser } = useInformation();

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <User className="mr-2 h-4 w-4" />
                {currentUser.name}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {users.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => setCurrentUser(user)}
                  disabled={currentUser.id === user.id}
                >
                  {user.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="pointer-events-none hidden rounded-full md:flex"
          >
            {currentUser.creditBalance} Credits
          </Button>
        </div>
      </header>
      <Separator />
    </>
  );
}
