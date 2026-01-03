
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
import { ChevronDown, User, Atom } from "lucide-react";

interface HeaderProps {
  activeTab: string;
}

export function Header({ activeTab }: HeaderProps) {
  const { users, currentUser, setCurrentUser, activeSpaceId, setActiveSpaceId, isReady, spaces } = useInformation();
  
  if (!isReady) {
    return <div className="h-14"><Separator /></div>
  }

  const activeSpace = spaces.find(s => s.id === activeSpaceId);

  return (
    <>
      <header className="relative flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <Atom className="mr-2 h-4 w-4" />
                {activeSpace?.name || 'Select Space'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {spaces.map((space) => (
                <DropdownMenuItem
                  key={space.id}
                  onClick={() => setActiveSpaceId(space.id)}
                  disabled={activeSpaceId === space.id}
                >
                  {space.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="hidden max-w-xs text-sm text-muted-foreground md:block">
            GRIET College Space is for presentation purposes only. Please do not use.
          </p>
        </div>

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
