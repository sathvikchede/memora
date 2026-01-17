"use client";
import { useState } from "react";
import Link from "next/link";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  HelpCircle,
  Plus,
  AlertCircle,
  MessageSquareText,
  Users,
  Atom,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { SpaceSwitcher, UserMenu, JoinSpaceDialog } from "@/components/space";

const menuItems = [
  { href: "/ask", icon: HelpCircle, label: "Ask.", tooltip: "Ask" },
  { href: "/add", icon: Plus, label: "Add.", tooltip: "Add" },
  { href: "/help", icon: AlertCircle, label: "Help.", tooltip: "Help" },
  { href: "/chat", icon: MessageSquareText, label: "Chat.", tooltip: "Chat" },
  { href: "/people", icon: Users, label: "People.", tooltip: "People" },
];

const bottomMenuItems = [
  { href: "/space", icon: Atom, label: "Space.", tooltip: "Space" },
];

interface MainSidebarProps {
    activeTab: string;
}

export function MainSidebar({ activeTab }: MainSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  return (
    <>
      <SidebarHeader className="p-2">
        {/* Memora Logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-2'} py-2`}>
          {isCollapsed ? (
            <span className="text-xl font-black text-white">m.</span>
          ) : (
            <span className="text-2xl font-black text-white">memora.</span>
          )}
        </div>
        {/* Space Switcher */}
        <SpaceSwitcher
          collapsed={isCollapsed}
          onJoinSpace={() => setJoinDialogOpen(true)}
        />
      </SidebarHeader>
      <SidebarContent className="p-2 pt-6">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={activeTab === item.href}
                tooltip={{ children: item.tooltip, side: "right" }}
                className="font-semibold justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="stroke-[2.5px]" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={activeTab === item.href}
                tooltip={{ children: item.tooltip, side: "right" }}
                className="font-semibold justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="stroke-[2.5px]" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator className="my-2" />
        <UserMenu collapsed={isCollapsed} />
      </SidebarFooter>
      <JoinSpaceDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
      />
    </>
  );
}
