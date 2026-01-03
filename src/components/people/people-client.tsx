
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInformation, Author, SpaceUserDetail } from '@/context/information-context';
import { Search } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';

interface UserCardProps {
  user: Author;
  spaceDetails: SpaceUserDetail;
}

function UserCard({ user, spaceDetails }: UserCardProps) {
  const router = useRouter();
  const fullName = user.name;

  const handleChatClick = () => {
    router.push(`/chat?userId=${user.id}`);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar} alt={fullName} />
          <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle>{fullName}</CardTitle>
          <CardDescription>
            {spaceDetails.year} - {spaceDetails.department}
          </CardDescription>
        </div>
        <Button onClick={handleChatClick}>Chat</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {spaceDetails.clubs && spaceDetails.clubs.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Clubs</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {spaceDetails.clubs.map((club) => (
                <li key={club.id}>
                  {club.name} - {club.position}
                </li>
              ))}
            </ul>
          </div>
        )}
        {spaceDetails.workExperience && spaceDetails.workExperience.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Experience</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {spaceDetails.workExperience.map((exp) => (
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
  const { users, currentUser, activeSpaceId } = useInformation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((user) => {
    if (user.id === currentUser.id) return false;
    const spaceDetails = (user.spaceDetails && user.spaceDetails[activeSpaceId]) || { department: '', year: '', clubs: [], workExperience: [] };
    const searchString = [
      user.name,
      spaceDetails.year,
      spaceDetails.department,
      ...(spaceDetails.clubs?.map((c) => `${c.name} ${c.position}`) || []),
      ...(spaceDetails.workExperience?.map(
        (w) => `${w.position} ${w.organization} ${w.employmentType}`
      ) || []),
    ]
      .join(' ')
      .toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

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
          {filteredUsers.map((user) => (
            <UserCard 
                key={user.id} 
                user={user} 
                spaceDetails={(user.spaceDetails && user.spaceDetails[activeSpaceId]) || {}}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
