'use client';

/**
 * Authentication Service for Memora AI
 * Handles Google Sign-In, user profile management, and auth state
 */

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Types
export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Timestamp;
  spaces: string[];
  lastActiveSpace?: string;
}

export interface SpaceMemberProfile {
  year: string;
  branch: string;
  clubs: Array<{
    id: string;
    name: string;
    position: string;
  }>;
  workExperience: Array<{
    id: string;
    organization: string;
    employmentType: 'intern' | 'full-time';
    position: string;
    startDate: string;
    endDate: string;
  }>;
  creditBalance: number;
}

export interface SpaceMember {
  joinedAt: Timestamp;
  role: 'member' | 'admin';
  profile: SpaceMemberProfile;
}

export interface SpaceData {
  spaceId: string;
  name: string;
  type: string;
  createdAt: Timestamp;
  settings: {
    yearOptions: string[];
    branchOptions: string[];
  };
}

export interface SignInResult {
  user: User;
  isNewUser: boolean;
  userData: UserProfile | null;
}

/**
 * Sign in with Google and check if user exists in Firestore
 */
export async function signInWithGoogle(auth: Auth, firestore: Firestore): Promise<SignInResult> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));

    return {
      user,
      isNewUser: !userDoc.exists(),
      userData: userDoc.exists() ? userDoc.data() as UserProfile : null
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Create a new user profile in Firestore
 */
export async function createUserProfile(
  firestore: Firestore,
  userId: string,
  firstName: string,
  lastName: string,
  email: string
): Promise<void> {
  await setDoc(doc(firestore, 'users', userId), {
    email,
    firstName,
    lastName,
    createdAt: serverTimestamp(),
    spaces: []
  });
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(
  firestore: Firestore,
  userId: string
): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
}

/**
 * Check if a space exists
 */
export async function getSpace(
  firestore: Firestore,
  spaceId: string
): Promise<SpaceData | null> {
  const spaceDoc = await getDoc(doc(firestore, 'spaces', spaceId));
  if (spaceDoc.exists()) {
    return spaceDoc.data() as SpaceData;
  }
  return null;
}

/**
 * Join a space - create member document and update user's spaces array
 */
export async function joinSpace(
  firestore: Firestore,
  userId: string,
  spaceId: string,
  profile: SpaceMemberProfile
): Promise<void> {
  // Create member document
  await setDoc(doc(firestore, 'spaces', spaceId, 'members', userId), {
    joinedAt: serverTimestamp(),
    role: 'member',
    profile
  });

  // Get current user spaces
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  const currentSpaces = userDoc.exists() ? (userDoc.data().spaces || []) : [];

  // Add spaceId to user's spaces array and set as last active
  await updateDoc(doc(firestore, 'users', userId), {
    spaces: [...currentSpaces, spaceId],
    lastActiveSpace: spaceId
  });
}

/**
 * Get user's membership in a space
 */
export async function getSpaceMembership(
  firestore: Firestore,
  spaceId: string,
  userId: string
): Promise<SpaceMember | null> {
  const memberDoc = await getDoc(doc(firestore, 'spaces', spaceId, 'members', userId));
  if (memberDoc.exists()) {
    return memberDoc.data() as SpaceMember;
  }
  return null;
}

/**
 * Update user's membership profile in a space
 */
export async function updateSpaceMembership(
  firestore: Firestore,
  spaceId: string,
  userId: string,
  profile: SpaceMemberProfile
): Promise<void> {
  await updateDoc(doc(firestore, 'spaces', spaceId, 'members', userId), {
    profile
  });
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthChanges(
  auth: Auth,
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign out
 */
export async function logOut(auth: Auth): Promise<void> {
  await signOut(auth);
}

/**
 * Update user's last active space
 */
export async function setLastActiveSpace(
  firestore: Firestore,
  userId: string,
  spaceId: string
): Promise<void> {
  await updateDoc(doc(firestore, 'users', userId), {
    lastActiveSpace: spaceId
  });
}
