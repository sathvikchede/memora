'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, collection, addDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function OnboardingPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [callName, setCallName] = useState('');
  const [surname, setSurname] = useState('');

  const [spaceName, setSpaceName] = useState('');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [spaceType, setSpaceType] = useState('college');
  const [joinInviteCode, setJoinInviteCode] = useState('');

  if (!user) {
    // This can cause render loops if not handled carefully.
    // A loading spinner or skeleton is better.
    return <p>Loading user...</p>;
  }

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    const userRef = doc(firestore, 'users', user.uid);
    const userData = {
      callName,
      surname,
      googleId: user.uid,
      id: user.uid,
      profilePictureUrl: user.photoURL,
      email: user.email,
    };
    
    setDocumentNonBlocking(userRef, userData, { merge: true });
    setStep(2);
  };

  const finishOnboarding = (spaceId: string) => {
    if (!firestore || !user) return;
    const userRef = doc(firestore, 'users', user.uid);
    setDocumentNonBlocking(userRef, { onboardingCompleted: true }, { merge: true });
    // TODO: Set current space in user's context or local storage
    router.push('/');
  }

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    const newInviteCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const spaceData = {
      name: spaceName,
      description: spaceDescription,
      spaceTypeId: spaceType,
      creatorId: user.uid,
      creationDate: serverTimestamp(),
      inviteCode: newInviteCode,
      members: { [user.uid]: true } // Add creator as the first member
    };

    const spacesCollection = collection(firestore, 'spaces');
    const spaceDocRef = await addDoc(spacesCollection, spaceData).catch(err => console.error(err));
    
    if (spaceDocRef) {
      const membershipData = {
        userId: user.uid,
        spaceId: spaceDocRef.id,
        joinDate: serverTimestamp(),
      };
      const membershipsCollection = collection(firestore, 'space_memberships');
      await addDoc(membershipsCollection, membershipData).catch(err => console.error(err));
      finishOnboarding(spaceDocRef.id);
    }
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    const spacesRef = collection(firestore, "spaces");
    const q = query(spacesRef, where("inviteCode", "==", joinInviteCode.toUpperCase()));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("No space found with this invite code.");
      // TODO: Show error to user with a toast
      return;
    }
    
    const spaceDoc = querySnapshot.docs[0];
    const spaceId = spaceDoc.id;

    const batch = writeBatch(firestore);

    // Add user to space's members map
    const spaceRef = doc(firestore, 'spaces', spaceId);
    batch.update(spaceRef, { [`members.${user.uid}`]: true });

    // Create a new space_membership document
    const membershipRef = doc(collection(firestore, 'space_memberships'));
    const membershipData = {
      userId: user.uid,
      spaceId: spaceId,
      joinDate: serverTimestamp(),
    };
    batch.set(membershipRef, membershipData);
    
    await batch.commit();

    finishOnboarding(spaceId);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Welcome to Memora</CardTitle>
              <CardDescription>
                Let's get your profile set up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="callName">Call Name</Label>
                  <Input
                    id="callName"
                    value={callName}
                    onChange={(e) => setCallName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join a Space</TabsTrigger>
              <TabsTrigger value="create">Create a Space</TabsTrigger>
            </TabsList>
            <TabsContent value="join">
              <CardHeader>
                <CardTitle>Join a Space</CardTitle>
                <CardDescription>
                  Enter an invite code to join an existing space.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinSpace} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input
                      id="inviteCode"
                      placeholder="Enter 5-digit code"
                      value={joinInviteCode}
                      onChange={(e) => setJoinInviteCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Join
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            <TabsContent value="create">
              <CardHeader>
                <CardTitle>Create a Space</CardTitle>
                <CardDescription>
                  Create a new isolated room for your information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSpace} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type of Space</Label>
                    <Select value={spaceType} onValueChange={setSpaceType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="college">College</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spaceName">Space Name</Label>
                    <Input
                      id="spaceName"
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spaceDescription">Description</Label>
                    <Input
                      id="spaceDescription"
                      value={spaceDescription}
                      onChange={(e) => setSpaceDescription(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
}
