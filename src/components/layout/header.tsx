
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
      <header className="relative flex h-14 items-center gap-4 px-4 sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <div className="flex flex-1 items-center justify-center">
          {activeTab && (
            <span className="text-xl font-semibold text-white">
              {activeTab}
            </span>
          )}
        </div>
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-4">
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
            1500 Credits
          </Button>
        </div>
      </header>
      <Separator />
    </>
  );
}

    