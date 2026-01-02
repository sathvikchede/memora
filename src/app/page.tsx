'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc, getFirestore } from 'firebase/firestore';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    const firestore = getFirestore();
    return doc(firestore, 'users', user.uid);
  }, [user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    const isLoading = isUserLoading || isUserDataLoading;
    if (!isLoading) {
      if (user) {
        if (userData && (userData as any).onboardingCompleted) {
          router.push('/ask');
        } else {
          router.push('/onboarding');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
