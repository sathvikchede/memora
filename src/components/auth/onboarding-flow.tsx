'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { getUserProfile, SpaceData } from '@/services/auth';
import { NameCollection } from './name-collection';
import { SpaceIdEntry } from './space-id-entry';
import { SpaceProfileCollection } from './space-profile-collection';

type OnboardingStep = 'loading' | 'name' | 'spaceId' | 'profile';

interface OnboardingFlowProps {
  isNewUser: boolean;
  onComplete: (spaceId: string) => void;
}

export function OnboardingFlow({ isNewUser, onComplete }: OnboardingFlowProps) {
  const { user, firestore } = useFirebase();

  const [step, setStep] = useState<OnboardingStep>('loading');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedSpaceData, setSelectedSpaceData] = useState<SpaceData | null>(null);

  useEffect(() => {
    checkUserStatus();
  }, [user]);

  async function checkUserStatus() {
    if (!user) {
      setStep('loading');
      return;
    }

    // If new user, start with name collection
    if (isNewUser) {
      setStep('name');
      return;
    }

    // Existing user - check if they have spaces
    const userData = await getUserProfile(firestore, user.uid);

    if (!userData) {
      // User document doesn't exist (shouldn't happen, but handle it)
      setStep('name');
      return;
    }

    if (!userData.spaces || userData.spaces.length === 0) {
      // No spaces, go to space ID entry
      setStep('spaceId');
      return;
    }

    // User has spaces, complete onboarding with first space
    onComplete(userData.spaces[0]);
  }

  function handleNameComplete() {
    setStep('spaceId');
  }

  function handleSpaceVerified(spaceId: string, spaceData: SpaceData) {
    setSelectedSpaceId(spaceId);
    setSelectedSpaceData(spaceData);
    setStep('profile');
  }

  function handleProfileComplete(spaceId: string) {
    onComplete(spaceId);
  }

  // Loading state
  if (step === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Name collection step
  if (step === 'name') {
    return <NameCollection onComplete={handleNameComplete} />;
  }

  // Space ID entry step
  if (step === 'spaceId') {
    return <SpaceIdEntry onSpaceVerified={handleSpaceVerified} />;
  }

  // Profile collection step
  if (step === 'profile' && selectedSpaceId && selectedSpaceData) {
    return (
      <SpaceProfileCollection
        spaceId={selectedSpaceId}
        spaceData={selectedSpaceData}
        onComplete={handleProfileComplete}
      />
    );
  }

  // Fallback loading
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
