"use client";
import Link from "next/link";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  HelpCircle,
  Plus,
  AlertCircle,
  MessageSquareText,
  Users,
  Atom,
  User,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

const MIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-14 w-14 shrink-0"
    >
      <path
        d="M8 15V9H6V15H8Z"
        fill="currentColor"
      />
      <path
        d="M8 11C8 10.4477 8.44772 10 9 10C9.55228 10 10 10.4477 10 11V15H8V11Z"
        fill="currentColor"
      />
      <path
        d="M10 11C10 10.4477 10.4477 10 11 10C11.5523 10 12 10.4477 12 11V15H10V11Z"
        fill="currentColor"
      />
      <circle cx="13.5" cy="15" r="1" fill="currentColor" />
    </svg>
  );

const menuItems = [
  { href: "/ask", icon: HelpCircle, label: "Ask.", tooltip: "Ask" },
  { href: "/add", icon: Plus, label: "Add.", tooltip: "Add" },
  { href: "/help", icon: AlertCircle, label: "Help.", tooltip: "Help" },
  { href: "/chat", icon: MessageSquareText, label: "Chat.", tooltip: "Chat" },
  { href: "/people", icon: Users, label: "People.", tooltip: "People" },
];

const bottomMenuItems = [
  { href: "/space", icon: Atom, label: "Space.", tooltip: "Space" },
  { href: "/profile", icon: User, label: "Profile.", tooltip: "Profile" },
];

interface MainSidebarProps {
    activeTab: string;
}

export function MainSidebar({ activeTab }: MainSidebarProps) {
  const { state } = useSidebar();

  return (
    <>
      <SidebarHeader className="p-4">
        {state === "expanded" ? (
          <h1 className="text-2xl font-bold">memora.</h1>
        ) : (
          <MIcon />
        )}
      </SidebarHeader>
      <SidebarContent className="p-2 pt-16">
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
      </SidebarFooter>
    </>
  );
}
