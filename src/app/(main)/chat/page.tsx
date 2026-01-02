import { ChatClient } from '@/components/chat/chat-client';
import { Suspense } from 'react';

export default function ChatPage() {
  return (
    <div className="h-full w-full">
      <Suspense fallback={<div>Loading...</div>}>
        <ChatClient />
      </Suspense>
    </div>
  );
}
