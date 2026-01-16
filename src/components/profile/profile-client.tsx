'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { useSpace } from '@/context/space-context';
import { updateSpaceMembership, SpaceMemberProfile } from '@/services/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Save, X, Building2, Briefcase, Users, CreditCard, PlusCircle, Trash2 } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  position: string;
}

interface WorkExperience {
  id: string;
  organization: string;
  employmentType: 'intern' | 'full-time';
  position: string;
  startDate: string;
  endDate: string;
}

export function ProfileClient() {
  const { user, firestore } = useFirebase();
  const { currentSpaceId, currentSpace, currentMembership, userProfile, refreshSpaceData } = useSpace();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editYear, setEditYear] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editClubs, setEditClubs] = useState<Club[]>([]);
  const [editWorkExperience, setEditWorkExperience] = useState<WorkExperience[]>([]);

  const startEditing = () => {
    if (!currentMembership) return;
    setEditYear(currentMembership.profile.year);
    setEditBranch(currentMembership.profile.branch);
    setEditClubs([...currentMembership.profile.clubs]);
    setEditWorkExperience([...currentMembership.profile.workExperience]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveProfile = async () => {
    if (!user || !currentSpaceId || !currentMembership) return;

    setIsSaving(true);
    try {
      // Filter out empty clubs and work experiences
      const validClubs = editClubs.filter(c => c.name.trim() !== '');
      const validWorkExperience = editWorkExperience.filter(w => w.organization.trim() !== '');

      const updatedProfile: SpaceMemberProfile = {
        year: editYear,
        branch: editBranch,
        clubs: validClubs,
        workExperience: validWorkExperience,
        creditBalance: currentMembership.profile.creditBalance,
      };

      await updateSpaceMembership(firestore, currentSpaceId, user.uid, updatedProfile);
      await refreshSpaceData();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Club handlers
  const addClub = () => {
    setEditClubs([...editClubs, { id: `club-${Date.now()}`, name: '', position: '' }]);
  };

  const removeClub = (id: string) => {
    setEditClubs(editClubs.filter(club => club.id !== id));
  };

  const handleClubChange = (id: string, field: 'name' | 'position', value: string) => {
    setEditClubs(editClubs.map(club => club.id === id ? { ...club, [field]: value } : club));
  };

  // Work Experience handlers
  const addWorkExperience = () => {
    setEditWorkExperience([
      ...editWorkExperience,
      {
        id: `work-${Date.now()}`,
        organization: '',
        employmentType: 'intern',
        position: '',
        startDate: '',
        endDate: ''
      }
    ]);
  };

  const removeWorkExperience = (id: string) => {
    setEditWorkExperience(editWorkExperience.filter(exp => exp.id !== id));
  };

  const handleWorkExperienceChange = (
    id: string,
    field: keyof Omit<WorkExperience, 'id'>,
    value: string
  ) => {
    setEditWorkExperience(
      editWorkExperience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return user?.displayName || 'User';
  };

  if (!currentMembership || !currentSpace) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const profile = currentMembership.profile;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center space-y-4 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-3xl font-bold">{getDisplayName()}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Current Space Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Current Space</CardTitle>
            </div>
            <Badge variant="secondary" className="capitalize">{currentSpace.type}</Badge>
          </div>
          <CardDescription>{currentSpace.name}</CardDescription>
        </CardHeader>
      </Card>

      {/* Space Profile */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Space Profile</CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveProfile} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Year and Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              {isEditing ? (
                <Select value={editYear} onValueChange={setEditYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSpace.settings.yearOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{profile.year}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Branch/Department</Label>
              {isEditing ? (
                <Select value={editBranch} onValueChange={setEditBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSpace.settings.branchOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{profile.branch}</p>
              )}
            </div>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="font-medium">Credit Balance:</span>
            <span className="text-lg font-bold text-primary">{profile.creditBalance}</span>
          </div>
        </CardContent>
      </Card>

      {/* Clubs */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Clubs & Organizations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              {editClubs.map((club) => (
                <div key={club.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Club Name"
                    value={club.name}
                    onChange={(e) => handleClubChange(club.id, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Position"
                    value={club.position}
                    onChange={(e) => handleClubChange(club.id, 'position', e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeClub(club.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addClub}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Club
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.clubs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No clubs added</p>
              ) : (
                profile.clubs.map((club) => (
                  <div key={club.id} className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <span className="font-medium">{club.name}</span>
                    <Badge variant="outline">{club.position}</Badge>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Work Experience</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              {editWorkExperience.map((exp) => (
                <div key={exp.id} className="space-y-4 rounded-md border p-4">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWorkExperience(exp.id)}
                      className="h-6 w-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Organization Name"
                    value={exp.organization}
                    onChange={(e) => handleWorkExperienceChange(exp.id, 'organization', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Select
                      value={exp.employmentType}
                      onValueChange={(value) => handleWorkExperienceChange(exp.id, 'employmentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Employment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intern">Intern</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Position"
                      value={exp.position}
                      onChange={(e) => handleWorkExperienceChange(exp.id, 'position', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Start Date (DDMMYYYY)"
                      value={exp.startDate}
                      onChange={(e) => handleWorkExperienceChange(exp.id, 'startDate', e.target.value)}
                    />
                    <Input
                      placeholder="End Date (DDMMYYYY)"
                      value={exp.endDate}
                      onChange={(e) => handleWorkExperienceChange(exp.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addWorkExperience}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.workExperience.length === 0 ? (
                <p className="text-muted-foreground text-sm">No work experience added</p>
              ) : (
                profile.workExperience.map((exp) => (
                  <div key={exp.id} className="p-4 bg-muted rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{exp.organization}</h4>
                        <p className="text-sm text-muted-foreground">{exp.position}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{exp.employmentType}</Badge>
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
