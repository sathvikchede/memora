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
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 shrink-0"
  >
    <path
      d="M6 18V6H9.468L12 10.692L14.532 6H18V18H15V9.936L12.432 14.4H11.568L9 9.936V18H6Z"
      fill="currentColor"
    />
  </svg>
);

const menuItems = [
  { href: "/ask", icon: HelpCircle, label: "Ask", tooltip: "Ask" },
  { href: "/add", icon: Plus, label: "Add", tooltip: "Add" },
  { href: "/help", icon: AlertCircle, label: "Help", tooltip: "Help" },
  { href: "/chat", icon: MessageSquareText, label: "Chat", tooltip: "Chat" },
  { href: "/people", icon: Users, label: "People", tooltip: "People" },
];

const bottomMenuItems = [
  { href: "/space", icon: Atom, label: "Space", tooltip: "Space" },
  { href: "/profile", icon: User, label: "Profile", tooltip: "Profile" },
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
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={activeTab === item.href}
                tooltip={{ children: item.tooltip, side: "right" }}
                className="font-semibold justify-center"
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
                className="font-semibold justify-center"
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
