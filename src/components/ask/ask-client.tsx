
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { History, PlusCircle, ChevronLeft, Edit } from "lucide-react";
import { ChatInterface } from "./chat-interface";
import { useInformation, ChatHistoryItem } from "@/context/information-context";
import { useRouter, useSearchParams } from "next/navigation";

type View = "new-chat" | "history" | "chat-detail" | "sources";

export function AskClient() {
  const [view, setView] = useState<View>("new-chat");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { chatHistory, getChatHistoryItem } = useInformation();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const viewParam = searchParams.get('view') as View;
    const idParam = searchParams.get('id');

    if (viewParam) {
      setView(viewParam);
    }
    if (idParam) {
      setActiveChatId(idParam);
    }
  }, [searchParams]);

  const navigate = (newView: View, params?: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    newParams.set('view', newView);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) newParams.set(key, value);
      });
    } else {
        newParams.delete('id');
    }
    router.push(`/ask?${newParams.toString()}`);
  };


  const handlePost = (question: string) => {
    router.push(`/help?view=post-question&question=${encodeURIComponent(question)}`);
  };

  const activeChat = activeChatId ? getChatHistoryItem(activeChatId) : null;

  const renderNav = () => {
    let title = "";
    let showBackButton = false;
    let backAction = () => {};

    switch (view) {
        case "history":
            title = "History";
            showBackButton = true;
            backAction = () => navigate("new-chat");
            break;
        case "chat-detail":
            title = activeChat?.title || "Chat";
            showBackButton = true;
            backAction = () => navigate("history");
            break;
        case "sources":
            title = "Sources";
            showBackButton = true;
            backAction = () => navigate("chat-detail", { id: activeChatId! });
            break;
    }
    
    if (!showBackButton) {
        return (
            <>
              <Button variant="ghost" className="w-1/2" onClick={() => navigate("new-chat")}>
                <PlusCircle className="md:mr-2" /> <span className="hidden md:inline">New Chat</span>
              </Button>
              <Button variant="ghost" className="w-1/2" onClick={() => navigate("history")}>
                <History className="md:mr-2" /> <span className="hidden md:inline">History</span>
              </Button>
            </>
        );
    }

    return (
      <div className="relative flex w-full items-center justify-center">
          <div className="absolute left-0">
            <Button variant="ghost" className="w-auto" onClick={backAction}>
                <ChevronLeft className="md:mr-2" />
                <span className="hidden md:inline">Back</span>
            </Button>
          </div>
          <div className="w-full text-center">
            <span className="truncate px-16 text-center font-bold text-lg">{title}</span>
          </div>
        </div>
    );
  };

  const renderContent = () => {
    switch (view) {
        case "history":
            return (
                <div className="divide-y divide-border">
                    {chatHistory.map(item => (
                        <div key={item.id} onClick={() => navigate("chat-detail", { id: item.id })} className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                    ))}
                    {chatHistory.length === 0 && <p className="p-4 text-center text-muted-foreground">No chat history yet.</p>}
                </div>
            );
        case "chat-detail":
            return <ChatInterface 
                        key={activeChatId}
                        chatId={activeChatId}
                        onShowSources={() => navigate('sources', { id: activeChatId! })} 
                        onPost={handlePost} 
                    />;
        case "sources":
            const sourcesForChat = activeChat ? chatHistory.find(c => c.id === activeChat.id)?.sources || [] : [];
            return (
                <div className="divide-y divide-border p-4">
                    {sourcesForChat.map((source, index) => (
                        <div key={index} className="py-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{source.type.charAt(0).toUpperCase() + source.type.slice(1)}</span>
                                <span>{source.date}</span>
                            </div>
                            <p className="my-2">{source.rawInformation}</p>
                            <div className="text-right">
                                <Button variant="link" className="p-0 h-auto text-muted-foreground">
                                    - {source.contributor}
                                </Button>
                            </div>
                        </div>
                    ))}
                    {sourcesForChat.length === 0 && <p className="p-4 text-center text-muted-foreground">No sources for this answer.</p>}
                </div>
            );
        default:
            return <ChatInterface 
                      key="new-chat" 
                      onNewChat={(id) => navigate("chat-detail", { id })}
                      onShowSources={() => {}} // This won't be called in new chat
                      onPost={handlePost} 
                    />;
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
