
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { useSpace } from '@/context/space-context';
import { getSpaceMembers } from '@/services/firestore';
import { Search } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

// Space member with profile data
interface SpaceMemberProfile {
  odId: string;
  displayName: string;
  email?: string;
  year?: string;
  branch?: string;
  clubs?: Array<{ id: string; name: string; position: string }>;
  workExperience?: Array<{
    id: string;
    organization: string;
    employmentType: string;
    position: string;
    startDate: string;
    endDate: string;
  }>;
}

function UserCard({ user }: { user: SpaceMemberProfile }) {
  const router = useRouter();

  const handleChatClick = () => {
    router.push(`/chat?userId=${user.odId}`);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle>{user.displayName}</CardTitle>
          {(user.year || user.branch) && (
            <CardDescription>
              {[user.year, user.branch].filter(Boolean).join(' - ')}
            </CardDescription>
          )}
        </div>
        <Button onClick={handleChatClick}>Chat</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.clubs && user.clubs.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Clubs</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {user.clubs.map((club) => (
                <li key={club.id}>
                  {club.name} - {club.position}
                </li>
              ))}
            </ul>
          </div>
        )}
        {user.workExperience && user.workExperience.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Experience</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {user.workExperience.map((exp) => (
                <li key={exp.id}>
                  {exp.position} at {exp.organization} ({exp.employmentType})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PeopleClient() {
  const { user, firestore } = useFirebase();
  const { currentSpaceId } = useSpace();
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<SpaceMemberProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load space members
  useEffect(() => {
    async function loadMembers() {
      if (!currentSpaceId || !user) return;

      setIsLoading(true);
      try {
        const membersData = await getSpaceMembers(firestore, currentSpaceId);

        const memberProfiles: SpaceMemberProfile[] = [];
        for (const member of membersData) {
          // Don't show current user
          if (member.odId === user.uid) continue;

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
              email: userData.email,
              year: member.profile?.year,
              branch: member.profile?.branch,
              clubs: member.profile?.clubs,
              workExperience: member.profile?.workExperience,
            });
          } else {
            memberProfiles.push({
              odId: member.odId,
              displayName: 'Unknown User',
              year: member.profile?.year,
              branch: member.profile?.branch,
              clubs: member.profile?.clubs,
              workExperience: member.profile?.workExperience,
            });
          }
        }
        setMembers(memberProfiles);
      } catch (error) {
        console.error('Error loading members:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMembers();
  }, [currentSpaceId, user, firestore]);

  const filteredUsers = members.filter((member) => {
    const searchString = [
      member.displayName,
      member.year,
      member.branch,
      ...(member.clubs?.map((c) => `${c.name} ${c.position}`) || []),
      ...(member.workExperience?.map(
        (w) => `${w.position} ${w.organization} ${w.employmentType}`
      ) || []),
    ]
      .join(' ')
      .toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col px-4 sm:px-6 lg:px-8">
      <div className="py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, department, club, etc..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? 'No members match your search.' : 'No other members in this space yet.'}
            </p>
          ) : (
            filteredUsers.map((member) => (
              <UserCard key={member.odId} user={member} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
