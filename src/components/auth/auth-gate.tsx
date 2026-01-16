'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { getUserProfile } from '@/services/auth';
import { LandingPage } from './landing-page';
import { OnboardingFlow } from './onboarding-flow';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, isUserLoading, firestore } = useFirebase();

  const [authState, setAuthState] = useState<{
    isChecking: boolean;
    isNewUser: boolean;
    currentSpaceId: string | null;
  }>({
    isChecking: true,
    isNewUser: false,
    currentSpaceId: null,
  });

  useEffect(() => {
    async function checkUserState() {
      if (isUserLoading) {
        return;
      }

      if (!user) {
        setAuthState({
          isChecking: false,
          isNewUser: false,
          currentSpaceId: null,
        });
        return;
      }

      // User is logged in, check if they have a profile and spaces
      try {
        const userProfile = await getUserProfile(firestore, user.uid);

        if (!userProfile) {
          // New user - no profile exists
          setAuthState({
            isChecking: false,
            isNewUser: true,
            currentSpaceId: null,
          });
          return;
        }

        if (!userProfile.spaces || userProfile.spaces.length === 0) {
          // Existing user but no spaces
          setAuthState({
            isChecking: false,
            isNewUser: false,
            currentSpaceId: null,
          });
          return;
        }

        // User has spaces - get the first one or use lastActiveSpace
        const activeSpace = userProfile.lastActiveSpace || userProfile.spaces[0];
        setAuthState({
          isChecking: false,
          isNewUser: false,
          currentSpaceId: activeSpace,
        });
      } catch (error) {
        console.error('Error checking user state:', error);
        // On error, treat as needing onboarding
        setAuthState({
          isChecking: false,
          isNewUser: true,
          currentSpaceId: null,
        });
      }
    }

    checkUserState();
  }, [user, isUserLoading, firestore]);

  // Handle onboarding completion
  const handleOnboardingComplete = (spaceId: string) => {
    setAuthState({
      isChecking: false,
      isNewUser: false,
      currentSpaceId: spaceId,
    });
  };

  // Handle sign-in completion (from LandingPage)
  const handleSignInComplete = (isNew: boolean) => {
    setAuthState({
      isChecking: true, // Re-check user state
      isNewUser: isNew,
      currentSpaceId: null,
    });
  };

  // Loading state while Firebase is initializing
  if (isUserLoading || authState.isChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!user) {
    return <LandingPage onSignInComplete={handleSignInComplete} />;
  }

  // Authenticated but no space - show onboarding flow
  if (!authState.currentSpaceId) {
    return (
      <OnboardingFlow
        isNewUser={authState.isNewUser}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Authenticated with space - render the app
  return <>{children}</>;
}
