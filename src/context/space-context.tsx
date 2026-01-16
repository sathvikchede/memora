'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useFirebase } from '@/firebase';
import {
  getUserProfile,
  getSpace,
  getSpaceMembership,
  setLastActiveSpace,
  SpaceData,
  SpaceMember,
  UserProfile
} from '@/services/auth';

interface SpaceContextType {
  // Current space
  currentSpaceId: string | null;
  currentSpace: SpaceData | null;
  currentMembership: SpaceMember | null;

  // User's spaces
  userSpaces: string[];
  userProfile: UserProfile | null;

  // Actions
  switchSpace: (spaceId: string) => Promise<void>;
  refreshSpaceData: () => Promise<void>;

  // Loading state
  isLoading: boolean;
  error: string | null;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

interface SpaceProviderProps {
  children: ReactNode;
  initialSpaceId: string;
}

export function SpaceProvider({ children, initialSpaceId }: SpaceProviderProps) {
  const { user, firestore } = useFirebase();

  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(initialSpaceId);
  const [currentSpace, setCurrentSpace] = useState<SpaceData | null>(null);
  const [currentMembership, setCurrentMembership] = useState<SpaceMember | null>(null);
  const [userSpaces, setUserSpaces] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load space data when spaceId changes
  const loadSpaceData = useCallback(async (spaceId: string) => {
    if (!user || !spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load space data and membership in parallel
      const [space, membership] = await Promise.all([
        getSpace(firestore, spaceId),
        getSpaceMembership(firestore, spaceId, user.uid)
      ]);

      if (!space) {
        setError('Space not found');
        return;
      }

      if (!membership) {
        setError('You are not a member of this space');
        return;
      }

      setCurrentSpace(space);
      setCurrentMembership(membership);
    } catch (err) {
      console.error('Error loading space data:', err);
      setError('Failed to load space data');
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore]);

  // Load user profile and their spaces
  const loadUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(firestore, user.uid);
      if (profile) {
        setUserProfile(profile);
        setUserSpaces(profile.spaces || []);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }, [user, firestore]);

  // Initial load
  useEffect(() => {
    if (user && initialSpaceId) {
      loadSpaceData(initialSpaceId);
      loadUserProfile();
    }
  }, [user, initialSpaceId, loadSpaceData, loadUserProfile]);

  // Switch to a different space
  const switchSpace = useCallback(async (spaceId: string) => {
    if (!user || spaceId === currentSpaceId) return;

    setCurrentSpaceId(spaceId);
    await loadSpaceData(spaceId);

    // Update last active space in Firestore
    try {
      await setLastActiveSpace(firestore, user.uid, spaceId);
    } catch (err) {
      console.error('Error updating last active space:', err);
    }
  }, [user, currentSpaceId, firestore, loadSpaceData]);

  // Refresh current space data
  const refreshSpaceData = useCallback(async () => {
    if (currentSpaceId) {
      await loadSpaceData(currentSpaceId);
    }
    await loadUserProfile();
  }, [currentSpaceId, loadSpaceData, loadUserProfile]);

  return (
    <SpaceContext.Provider
      value={{
        currentSpaceId,
        currentSpace,
        currentMembership,
        userSpaces,
        userProfile,
        switchSpace,
        refreshSpaceData,
        isLoading,
        error
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
}
