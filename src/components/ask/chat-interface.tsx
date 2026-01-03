
"use client";

import { useState, useRef, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Upload,
  Mic,
  Image as ImageIcon,
  FileText,
  Camera,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInformation, Message, Entry } from "@/context/information-context";
import { answerUserQuery, AnswerUserQueryInput } from "@/ai/flows/answer-user-queries-with-sources";
import { processMultimediaInput, ProcessMultimediaInputInput } from "@/ai/flows/process-multimedia-input";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  chatId?: string | null;
  onNewChat?: (chatId: string) => void;
  onShowSources?: () => void;
  onPost?: (question: string) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string; // data URL
}

const initialMessages: Message[] = [
    { id: 'ai-1', text: "Hello! How can I help you today?", sender: 'ai' },
];

export function ChatInterface({ chatId, onNewChat, onShowSources, onPost }: ChatInterfaceProps) {
  const { getSpaceData, addEntry, getChatHistoryItem, addMessageToHistory, addHistoryItem, currentUser, updateCreditBalance, activeSpaceId } = useInformation();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const formId = useId();
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const { entries } = getSpaceData();

  useEffect(() => {
    if (chatId) {
      const historyItem = getChatHistoryItem(chatId);
      if (historyItem) {
        setMessages(historyItem.messages);
      }
    } else {
      setMessages(initialMessages);
    }
  }, [chatId, getChatHistoryItem]);


  const handleSend = async () => {
    if (input.trim() || uploadedFiles.length > 0) {
        if (currentUser.creditBalance < 1) {
            toast({
                variant: "destructive",
                title: "Insufficient Credits",
                description: "You don't have enough credits to ask a question.",
            });
            return;
        }

        setMessages(prev => prev.map(m => ({ ...m, showActions: false })));
        const userMessageText = input.trim();
        const userMessage: Message = { id: `user-${Date.now()}`, text: userMessageText, sender: 'user' };
        
        let currentChatId = chatId;
        // If it's a new chat, create a history item first
        if (!currentChatId) {
            const newHistoryItem = addHistoryItem(userMessageText, [userMessage]);
            currentChatId = newHistoryItem.id;
            if (onNewChat) {
                onNewChat(currentChatId);
            }
        } else {
             addMessageToHistory(currentChatId, userMessage);
        }

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsThinking(true);
        
        let aiResponseText = '';
        let sourcesForAnswer: any[] = [];
        let creditDeducted = false;

        if (uploadedFiles.length > 0) {
            const file = uploadedFiles[0];
            const multimediaInput: ProcessMultimediaInputInput = {
                mediaDataUri: file.url,
                additionalText: userMessageText
            };
            try {
                const result = await processMultimediaInput(multimediaInput);
                const newEntry: Omit<Entry, 'id' | 'userId'> = {
                    text: result.summary,
                    contributor: currentUser.name,
                    date: new Date().toISOString().split("T")[0],
                    type: 'add' as const,
                };
                addEntry(newEntry);
                aiResponseText = `I've processed the content of "${file.name}". Here's a summary: ${result.summary}\n\nHow can I help you with this information?`;
                sourcesForAnswer = [newEntry];
            } catch(error) {
                console.error("Error processing multimedia:", error);
                aiResponseText = `Sorry, I couldn't process the file ${file.name}.`;
            }
            setUploadedFiles([]);
        } else if (entries.length === 0) {
            aiResponseText = `I don't have enough information yet. You can add information in the "Add" tab or by answering questions in the "Help" tab.`;
        } else {
            const queryInput: AnswerUserQueryInput = {
                query: userMessageText,
                summaries: entries.map(e => e.text),
                sources: entries.map(e => ({
                    contributor: e.contributor,
                    rawInformation: e.text,
                    date: e.date,
                    type: e.type,
                })),
                activeSpaceId: activeSpaceId,
            };

            try {
                const result = await answerUserQuery(queryInput);
                aiResponseText = result.answer;
                sourcesForAnswer = result.sources;

                if (!aiResponseText) {
                    aiResponseText = `I don't have enough information to answer that question. You can add more information or post this question to the community.`;
                } else {
                    // Deduct credit only if a valid answer is found
                    updateCreditBalance(currentUser.id, -1);
                    creditDeducted = true;
                }

            } catch (error) {
                console.error("Error calling AI flow:", error);
                aiResponseText = "Sorry, I encountered an error while processing your request.";
            }
        }
        
        if (creditDeducted) {
            toast({
                title: "Credit Deducted",
                description: "1 credit has been deducted for this query.",
            });
        }

        const aiResponse: Message = { 
            id: `ai-${Date.now()}`, 
            text: aiResponseText, 
            sender: 'ai', 
            showActions: true 
        };

        if (currentChatId) {
            addMessageToHistory(currentChatId, aiResponse, sourcesForAnswer);
        }
        setMessages(prev => [...prev, aiResponse]);
        setIsThinking(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: UploadedFile = {
          id: `file-${Date.now()}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: e.target?.result as string,
        };
        setUploadedFiles([newFile]); // Allow only one file for now
      };
      reader.readAsDataURL(file);
    }
    if(event.target) event.target.value = '';
  };
  
  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };


  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
      }
    };
    
    recognitionRef.current.start();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = isMobile ? 84 : 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input, isMobile]);
  
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const atBottom = messages.length > 2;
  const lastUserMessage = messages.filter(m => m.sender === 'user').pop();


  return (
    <div className={cn("flex h-full flex-col", { "justify-center": !atBottom })}>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === "ai" && (
                <Avatar className="h-8 w-8 flex-shrink-0 bg-white border-2 border-white rounded-full">
                  <AvatarFallback className="bg-transparent text-primary-foreground">
                  </AvatarFallback>
                </Avatar>
              )}
              {message.sender === 'user' ? (
                <div className="max-w-[75%] rounded-lg bg-primary text-primary-foreground p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              ) : (
                <div className="flex w-full flex-col">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                         <ReactMarkdown
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-2xl font-bold" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-xl font-semibold" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-lg font-semibold" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5" {...props} />,
                            }}
                        >
                            {message.text}
                        </ReactMarkdown>
                    </div>
                     {message.showActions && (
                        <div className="mt-4 flex items-center justify-start gap-2">
                            {message.text.includes("enough information") ? (
                                 <Button variant="secondary" size="sm" onClick={() => onPost && onPost(lastUserMessage?.text || '')}>Post Question</Button>
                            ) : (
                                <>
                                    <Button variant="secondary" size="sm" onClick={onShowSources}>Sources</Button>
                                    <Button variant="secondary" size="sm" onClick={() => onPost && onPost(lastUserMessage?.text || '')}>Post as Question</Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
              )}
            </div>
          ))}
           {isThinking && (
             <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-white border-2 border-white rounded-full">
                  <AvatarFallback className="bg-transparent text-primary-foreground">
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm">Thinking...</p>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className={cn("mt-4 flex-shrink-0", { "sticky bottom-0 bg-background py-4": atBottom })}>
        <div className="space-y-2">
            {uploadedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative shrink-0">
                  {file.type === 'image' ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-md border bg-muted">
                      <FileText className="h-8 w-8" />
                      <span className="mt-1 max-w-full truncate px-1 text-xs">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                    onClick={() => removeUploadedFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
            <div className="flex h-12 items-center justify-evenly gap-2 rounded-md border p-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex-1" aria-label="Upload" disabled={isThinking}>
                            <Upload />
                            <span className="hidden md:ml-2 md:inline">Upload</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {isMobile && <DropdownMenuItem asChild><label className="flex items-center"><Camera className="mr-2 h-4 w-4" /> Camera</label></DropdownMenuItem>}
                        <DropdownMenuItem asChild><label className="flex items-center"><ImageIcon className="mr-2 h-4 w-4" /> Image<input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} /></label></DropdownMenuItem>
                        <DropdownMenuItem asChild><label className="flex items-center"><FileText className="mr-2 h-4 w-4" /> File<input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} /></label></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant={isRecording ? "secondary" : "ghost"} className="flex-1" aria-label="Voice Input" onClick={handleVoiceInput} disabled={isThinking}>
                    <Mic />
                    <span className="hidden md:ml-2 md:inline">Voice</span>
                </Button>
            </div>
            <form
                id={formId}
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center"
            >
                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={"Ask memora anything..."}
                    className="min-h-[48px] resize-none pr-12 rounded-full flex items-center py-3.5"
                    rows={1}
                    disabled={isThinking}
                />
                <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                    disabled={(!input.trim() && uploadedFiles.length === 0) || isThinking}
                >
                    {isThinking ? (
                        <div className="h-4 w-4 border-2 border-background/80 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
