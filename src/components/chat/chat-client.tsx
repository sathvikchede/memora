
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ChatThread } from './chat-thread';
import { ChevronLeft } from 'lucide-react';
import { Separator } from '../ui/separator';
import { formatRelativeDate } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { useSpace } from '@/context/space-context';
import {
  getSpaceMembers,
  getConversations,
  FirestoreConversation,
} from '@/services/firestore';
import { doc, getDoc } from 'firebase/firestore';

// Space member type
interface SpaceMember {
  odId: string;
  displayName: string;
  year?: string;
  branch?: string;
}

export function ChatClient() {
  const { user, firestore } = useFirebase();
  const { currentSpaceId } = useSpace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [conversations, setConversations] = useState<Array<FirestoreConversation & { conversationId: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeChatUserId = searchParams.get('userId');

  // Load space members and conversations
  useEffect(() => {
    async function loadData() {
      if (!currentSpaceId || !user) return;

      setIsLoading(true);
      try {
        // Load space members
        const membersData = await getSpaceMembers(firestore, currentSpaceId);

        // Get user profiles for each member
        const memberProfiles: SpaceMember[] = [];
        for (const member of membersData) {
          if (member.odId !== user.uid) {
            // Get user profile from users collection
            const userDocRef = doc(firestore, 'users', member.odId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              memberProfiles.push({
                odId: member.odId,
                displayName: userData.firstName && userData.lastName
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.email || 'Unknown User',
                year: member.profile?.year,
                branch: member.profile?.branch,
              });
            } else {
              memberProfiles.push({
                odId: member.odId,
                displayName: 'Unknown User',
                year: member.profile?.year,
                branch: member.profile?.branch,
              });
            }
          }
        }
        setMembers(memberProfiles);

        // Load conversations for sorting
        const convos = await getConversations(firestore, currentSpaceId, user.uid);
        setConversations(convos);
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentSpaceId, user, firestore]);

  // Sort members by last message
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aConvo = conversations.find((c) =>
        c.participants.includes(a.odId) && c.participants.includes(user?.uid || '')
      );
      const bConvo = conversations.find((c) =>
        c.participants.includes(b.odId) && c.participants.includes(user?.uid || '')
      );

      const aTime = aConvo?.lastMessage?.timestamp?.toDate?.()?.getTime() || 0;
      const bTime = bConvo?.lastMessage?.timestamp?.toDate?.()?.getTime() || 0;

      return bTime - aTime;
    });
  }, [members, conversations, user]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (activeChatUserId) {
    const activeChatUser = members.find((m) => m.odId === activeChatUserId);
    if (!activeChatUser) {
      return <div className="text-center py-8">User not found in this space</div>;
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
                {activeChatUser.displayName}
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
        {sortedMembers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No other members in this space yet.
          </p>
        ) : (
          sortedMembers.map((member) => {
            const conversation = conversations.find((c) =>
              c.participants.includes(member.odId) && c.participants.includes(user?.uid || '')
            );
            const lastMessage = conversation?.lastMessage;

            return (
              <Button
                key={member.odId}
                variant="secondary"
                className="h-auto w-full justify-start rounded-full p-2"
                onClick={() => router.push(`/chat?userId=${member.odId}`)}
              >
                <div className="flex w-full items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{member.displayName}</p>
                    {(member.year || member.branch) && (
                      <p className="text-sm text-muted-foreground">
                        {[member.year, member.branch].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {lastMessage && lastMessage.timestamp && (
                      <p>{formatRelativeDate(lastMessage.timestamp.toDate().toISOString())}</p>
                    )}
                  </div>
                </div>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}
