'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useInformation } from '@/context/information-context';


export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isReady: isInfoReady } = useInformation();

  useEffect(() => {
    // Redirect directly to the main app for testing
    router.push('/ask');
  }, [router]);


  if (isUserLoading || !isInfoReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading Test Environment...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading Test Environment...</p>
    </div>
  );
}
