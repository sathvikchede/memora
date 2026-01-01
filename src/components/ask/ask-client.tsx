"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { History, PlusCircle, ChevronLeft } from "lucide-react";
import { ChatInterface } from "./chat-interface";
import { useInformation } from "@/context/information-context";


type View = "new-chat" | "history" | "chat-detail" | "sources" | "post";
type HistoryItem = { id: string; title: string; date: string };

const fakeHistory: HistoryItem[] = [
  { id: "1", title: "Impact of AI on modern education", date: "2024-07-28" },
  { id: "2", title: "Best practices for React development", date: "2024-07-27" },
  { id: "3", title: "Quantum computing explained", date: "2024-07-25" },
];


export function AskClient() {
  const [view, setView] = useState<View>("new-chat");
  const [activeChat, setActiveChat] = useState<HistoryItem | null>(null);
  const { entries } = useInformation();

  const renderNav = () => {
    switch (view) {
      case "history":
        return (
          <>
            <Button variant="ghost" className="w-1/2 justify-start md:w-auto" onClick={() => setView("new-chat")}>
                <ChevronLeft className="md:mr-2" />
                <span className="hidden md:inline">back</span>
            </Button>
            <span className="flex-1 text-center font-medium">history</span>
            <div className="w-1/2 md:w-auto"></div>
          </>
        );
      case "chat-detail":
        return (
            <>
                <Button variant="ghost" className="w-1/2 justify-start md:w-auto" onClick={() => { setView("history"); setActiveChat(null); }}>
                    <ChevronLeft className="md:mr-2" />
                    <span className="hidden md:inline">history</span>
                </Button>
                <span className="flex-1 truncate px-2 text-center font-medium">{activeChat?.title}</span>
                <div className="w-1/2 md:w-auto"></div>
            </>
        );
      case "sources":
        return (
            <>
                <Button variant="ghost" className="w-1/2 justify-start md:w-auto" onClick={() => setView("chat-detail")}>
                    <ChevronLeft className="md:mr-2" />
                    <span className="hidden md:inline">back</span>
                </Button>
                <span className="flex-1 text-center font-medium">sources</span>
                <div className="w-1/2 md:w-auto"></div>
            </>
        );
      case "post":
        return (
            <>
                <Button variant="ghost" className="w-1/2 justify-start md:w-auto" onClick={() => setView("chat-detail")}>
                    <ChevronLeft className="md:mr-2" />
                    <span className="hidden md:inline">back</span>
                </Button>
                <span className="flex-1 text-center font-medium">Post Question</span>
                <div className="w-1/2 md:w-auto"></div>
            </>
        )
      default:
        return (
          <>
            <Button variant="ghost" className="w-1/2" onClick={() => setView("new-chat")}>
              <PlusCircle className="md:mr-2" /> <span className="hidden md:inline">new chat</span>
            </Button>
            <Button variant="ghost" className="w-1/2" onClick={() => setView("history")}>
              <History className="md:mr-2" /> <span className="hidden md:inline">history</span>
            </Button>
          </>
        );
    }
  };

  const renderContent = () => {
    switch (view) {
        case "history":
            return (
                <div className="divide-y divide-border">
                    {fakeHistory.map(item => (
                        <div key={item.id} onClick={() => { setView("chat-detail"); setActiveChat(item);}} className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-sm text-muted-foreground">{item.date}</span>
                        </div>
                    ))}
                </div>
            );
        case "chat-detail":
            return <ChatInterface key={activeChat?.id} onShowSources={() => setView('sources')} onPost={() => setView('post')} />;
        case "sources":
            return (
                <div className="divide-y divide-border p-4">
                    {entries.map((source, index) => (
                        <div key={index} className="py-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{source.type}</span>
                                <span>{source.date}</span>
                            </div>
                            <p className="my-2">{source.text}</p>
                            <div className="text-right">
                                <Button variant="link" className="p-0 h-auto text-muted-foreground">
                                    - {source.contributor}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        case "post":
            return <ChatInterface isPostView={true} />;
        default:
            return <ChatInterface key="new-chat" onShowSources={() => setView('sources')} onPost={() => setView('post')} />;
    }
  };

  return (
    <div className="flex h-full flex-col px-4 sm:px-6 lg:px-8">
       <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col">
        <div className="flex h-14 items-center justify-center gap-2">
            {renderNav()}
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto py-4">
            {renderContent()}
        </div>
       </div>
    </div>
  );
}