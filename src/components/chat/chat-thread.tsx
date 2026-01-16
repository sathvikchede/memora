'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Upload,
  Mic,
  Image as ImageIcon,
  FileText,
  BrainCircuit,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFirebase } from '@/firebase';
import { useSpace } from '@/context/space-context';
import { useSpaceData } from '@/context/space-data-context';
import {
  getOrCreateConversation,
  getChatMessages,
  saveChatMessage,
  FirestoreChatMessage,
} from '@/services/firestore';
import { processNewEntryFirestore } from '@/services/entry-processor-firestore';

interface SpaceMember {
  odId: string;
  displayName: string;
  year?: string;
  branch?: string;
}

interface ChatThreadProps {
  recipient: SpaceMember;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
}

export function ChatThread({ recipient }: ChatThreadProps) {
  const { user, firestore } = useFirebase();
  const { currentSpaceId, userProfile } = useSpace();
  const { refreshSummaries } = useSpaceData();
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Array<FirestoreChatMessage & { messageId: string }>>([]);
  const [isRemembering, setIsRemembering] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const formId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current user name
  const getCurrentUserName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return user?.displayName || 'Me';
  };

  // Load conversation and messages
  useEffect(() => {
    async function loadConversation() {
      if (!currentSpaceId || !user) return;

      try {
        // Get or create conversation
        const convo = await getOrCreateConversation(
          firestore,
          currentSpaceId,
          user.uid,
          recipient.odId,
          getCurrentUserName(),
          recipient.displayName
        );
        setConversationId(convo.conversationId);

        // Load messages
        const msgs = await getChatMessages(firestore, currentSpaceId, convo.conversationId);
        setMessages(msgs);
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    }

    loadConversation();
  }, [currentSpaceId, user, recipient, firestore, userProfile]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || !conversationId || !currentSpaceId || !user || isSending) return;

    setIsSending(true);
    const messageContent = input.trim();
    const shouldRemember = isRemembering && !!messageContent;

    try {
      // Save message to Firestore
      const savedMessage = await saveChatMessage(firestore, currentSpaceId, conversationId, {
        conversationId,
        senderId: user.uid,
        content: messageContent,
        remembered: shouldRemember,
        attachments: uploadedFiles.map((f) => ({
          type: f.type,
          url: f.url,
          name: f.name,
        })),
      });

      // Add to local state
      setMessages((prev) => [...prev, savedMessage]);

      // Process for topic-level source tracking if remembering
      if (shouldRemember) {
        processNewEntryFirestore(firestore, currentSpaceId, messageContent, 'chat', {
          conversationId,
        }).then((result) => {
          if (result.success) {
            refreshSummaries();
            console.log('Chat message processed for topic tracking:', result);
          }
        }).catch((error) => {
          console.error('Error processing chat message for topic tracking:', error);
        });
      }

      setInput('');
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
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
        setUploadedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = isMobile ? 84 : 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input, isMobile]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <ScrollArea className="h-full pr-4" ref={scrollRef}>
          <div className="space-y-6 py-4">
            {messages.map((message) => (
              <div
                key={message.messageId}
                className={cn(
                  'relative flex items-start gap-3',
                  message.senderId === user?.uid
                    ? 'justify-end'
                    : 'justify-start'
                )}
              >
                {message.remembered && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-white"></div>
                )}
                {message.senderId === recipient.odId && (
                  <Avatar className="h-8 w-8 ml-4">
                    <AvatarFallback>{recipient.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg',
                    message.senderId === user?.uid
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                    message.remembered && 'ml-4'
                  )}
                >
                  <p className="p-3 text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Start a conversation with {recipient.displayName}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>


      <div className="flex-shrink-0 bg-background py-4">
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
                <Button variant="ghost" className="flex-1" aria-label="Upload" disabled={isSending}>
                  <Upload />
                  <span className="hidden md:ml-2 md:inline">Upload</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <label className="flex items-center">
                    <ImageIcon className="mr-2 h-4 w-4" /> Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <label className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" /> File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={isRemembering ? 'secondary' : 'ghost'}
              className="flex-1"
              aria-label="Remember this"
              onClick={() => setIsRemembering(!isRemembering)}
              disabled={isSending}
            >
              <BrainCircuit />
              <span className="hidden md:ml-2 md:inline">Remember this</span>
            </Button>

            <Button
              variant="ghost"
              className="flex-1"
              aria-label="Voice Input"
              disabled={isSending}
            >
              <Mic />
              <span className="hidden md:ml-2 md:inline">Voice</span>
            </Button>
          </div>
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Chat with them..."
              className="min-h-[48px] resize-none rounded-full py-3.5 pr-12"
              rows={1}
              disabled={isSending}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 rounded-full"
              disabled={(!input.trim() && uploadedFiles.length === 0) || isSending}
            >
              {isSending ? (
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
