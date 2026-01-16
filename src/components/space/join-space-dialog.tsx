'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { useSpace } from '@/context/space-context';
import { getSpace, joinSpace, SpaceData, SpaceMemberProfile } from '@/services/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, PlusCircle, Trash2 } from 'lucide-react';

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

interface JoinSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (spaceId: string) => void;
}

type Step = 'spaceId' | 'profile';

export function JoinSpaceDialog({ open, onOpenChange, onSuccess }: JoinSpaceDialogProps) {
  const { user, firestore } = useFirebase();
  const { userSpaces, refreshSpaceData, switchSpace } = useSpace();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('spaceId');
  const [spaceId, setSpaceId] = useState('');
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile fields
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);

  const resetForm = () => {
    setStep('spaceId');
    setSpaceId('');
    setSpaceData(null);
    setError('');
    setYear('');
    setBranch('');
    setClubs([]);
    setWorkExperience([]);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleVerifySpace = async () => {
    setError('');

    // Validate format (7 digits)
    if (!/^\d{7}$/.test(spaceId)) {
      setError('Space ID must be a 7-digit number');
      return;
    }

    // Check if already a member
    if (userSpaces.includes(spaceId)) {
      setError('You are already a member of this space');
      return;
    }

    setIsLoading(true);
    try {
      const space = await getSpace(firestore, spaceId);

      if (!space) {
        setError('Space not found. Please check the ID and try again.');
        return;
      }

      setSpaceData(space);
      setStep('profile');
    } catch (err) {
      console.error('Error verifying space:', err);
      setError('Failed to verify space. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSpace = async () => {
    if (!user || !spaceData) return;

    if (!year || !branch) {
      toast({
        title: 'Error',
        description: 'Please select your year and branch.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const validClubs = clubs.filter(c => c.name.trim() !== '');
      const validWorkExperience = workExperience.filter(w => w.organization.trim() !== '');

      const profile: SpaceMemberProfile = {
        year,
        branch,
        clubs: validClubs,
        workExperience: validWorkExperience,
        creditBalance: 100, // Starting credits
      };

      await joinSpace(firestore, user.uid, spaceId, profile);
      await refreshSpaceData();

      toast({
        title: 'Success!',
        description: `You've joined ${spaceData.name}`,
      });

      // Switch to the new space
      await switchSpace(spaceId);

      handleClose();
      onSuccess?.(spaceId);
    } catch (err) {
      console.error('Error joining space:', err);
      toast({
        title: 'Error',
        description: 'Failed to join space. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Club handlers
  const addClub = () => {
    setClubs([...clubs, { id: `club-${Date.now()}`, name: '', position: '' }]);
  };

  const removeClub = (id: string) => {
    setClubs(clubs.filter(club => club.id !== id));
  };

  const handleClubChange = (id: string, field: 'name' | 'position', value: string) => {
    setClubs(clubs.map(club => club.id === id ? { ...club, [field]: value } : club));
  };

  // Work Experience handlers
  const addWorkExperience = () => {
    setWorkExperience([
      ...workExperience,
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
    setWorkExperience(workExperience.filter(exp => exp.id !== id));
  };

  const handleWorkExperienceChange = (
    id: string,
    field: keyof Omit<WorkExperience, 'id'>,
    value: string
  ) => {
    setWorkExperience(
      workExperience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {step === 'spaceId' ? (
          <>
            <DialogHeader>
              <DialogTitle>Join a New Space</DialogTitle>
              <DialogDescription>
                Enter the 7-digit Space ID to join a new space
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="spaceId">Space ID</Label>
                <Input
                  id="spaceId"
                  placeholder="1234567"
                  value={spaceId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                    setSpaceId(value);
                    if (error) setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleVerifySpace();
                    }
                  }}
                  className={`text-center text-lg tracking-widest ${error ? 'border-destructive' : ''}`}
                  maxLength={7}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Ask your institution or community admin for the Space ID
              </p>
              <Button
                className="w-full"
                onClick={handleVerifySpace}
                disabled={isLoading || spaceId.length !== 7}
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setStep('spaceId')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>Complete Your Profile</DialogTitle>
                  <DialogDescription className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {spaceData?.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Year and Branch */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year <span className="text-destructive">*</span></Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaceData?.settings.yearOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Branch <span className="text-destructive">*</span></Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaceData?.settings.branchOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clubs */}
              <div className="space-y-2">
                <Label>Clubs (Optional)</Label>
                {clubs.map((club) => (
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

              {/* Work Experience */}
              <div className="space-y-2">
                <Label>Work Experience (Optional)</Label>
                {workExperience.map((exp) => (
                  <div key={exp.id} className="space-y-2 rounded-md border p-3">
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
                      placeholder="Organization"
                      value={exp.organization}
                      onChange={(e) => handleWorkExperienceChange(exp.id, 'organization', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Select
                        value={exp.employmentType}
                        onValueChange={(value) => handleWorkExperienceChange(exp.id, 'employmentType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addWorkExperience}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={handleJoinSpace}
                disabled={isLoading || !year || !branch}
              >
                {isLoading ? 'Joining...' : 'Join Space'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
