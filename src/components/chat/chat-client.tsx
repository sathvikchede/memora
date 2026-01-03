
'use client';

import { useInformation, Author } from '@/context/information-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ChatThread } from './chat-thread';
import { ChevronLeft } from 'lucide-react';
import { Separator } from '../ui/separator';
import { formatRelativeDate } from '@/lib/utils';

export function ChatClient() {
  const { users, currentUser, getChatMessages } = useInformation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeChatUserId = searchParams.get('userId');

  const otherUsers = users
    .filter((u) => u.id !== currentUser.id)
    .sort((a, b) => {
      const aConversationId = [currentUser.id, a.id].sort().join('-');
      const bConversationId = [currentUser.id, b.id].sort().join('-');

      const aMessages = getChatMessages(aConversationId);
      const bMessages = getChatMessages(bConversationId);

      const aLastMessage = aMessages.length > 0 ? aMessages[aMessages.length - 1] : null;
      const bLastMessage = bMessages.length > 0 ? bMessages[bMessages.length - 1] : null;

      if (!aLastMessage && !bLastMessage) return 0;
      if (!aLastMessage) return 1; // a goes to the bottom
      if (!bLastMessage) return -1; // b goes to the bottom

      return new Date(bLastMessage.timestamp).getTime() - new Date(aLastMessage.timestamp).getTime();
    });


  if (activeChatUserId) {
    const activeChatUser = users.find((u) => u.id === activeChatUserId);
    if (!activeChatUser) {
      // Handle case where user is not found
      return <div>User not found</div>;
    }
    return (
      <div className="flex h-full flex-col px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col">
          <div className="relative flex h-14 w-full items-center justify-center">
            <div className="absolute left-0">
              <Button
                variant="ghost"
                className="w-auto"
                onClick={() => router.push('/chat')}
              >
                <ChevronLeft className="md:mr-2" />
                <span className="hidden md:inline">Back</span>
              </Button>
            </div>
            <div className="w-full text-center">
              <span className="truncate px-16 text-center font-bold text-lg">
                {activeChatUser.name}
              </span>
            </div>
          </div>
          <Separator />
          <ChatThread recipient={activeChatUser} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl py-4 px-4 sm:px-6 lg:px-8">
      <div className="space-y-2">
        {otherUsers.map((user) => {
          const conversationId = [currentUser.id, user.id].sort().join('-');
          const messages = getChatMessages(conversationId);
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          const { year, department } = user;
          
          return (
            <Button
              key={user.id}
              variant="secondary"
              className="h-auto w-full justify-start rounded-full p-2"
              onClick={() => router.push(`/chat?userId=${user.id}`)}
            >
              <div className="flex w-full items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {year} - {department}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {lastMessage && <p>{formatRelativeDate(lastMessage.timestamp)}</p>}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
