'use client';

import { useUser, useDoc, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Create a memoized document reference
  const userDocRef =
    firestore && user ? doc(firestore, 'users', user.uid) : null;

  // Use the useDoc hook to get user data
  const {
    data: userData,
    isLoading: isUserDataLoading,
    error: userDataError,
  } = useDoc(userDocRef);

  useEffect(() => {
    // Don't do anything until Firebase auth and user data are done loading
    if (isUserLoading || isUserDataLoading) {
      return;
    }

    // If there's no user, send them to the login page
    if (!user) {
      router.push('/login');
      return;
    }
    
    // If we have a user but no user document in Firestore,
    // or if onboarding isn't complete, send them to onboarding
    if (user && (!userData || !userData.onboardingCompleted)) {
      router.push('/onboarding');
      return;
    }

    // If the user is logged in and has completed onboarding, send to the main app
    if (user && userData && userData.onboardingCompleted) {
      router.push('/ask');
    }
  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  // Render a loading state while we determine where to redirect the user
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
