'use client';

import { useState } from 'react';
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
import { PlusCircle, Trash2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { joinSpace, SpaceData, SpaceMemberProfile } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';

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

interface SpaceProfileCollectionProps {
  spaceId: string;
  spaceData: SpaceData;
  onComplete: (spaceId: string) => void;
}

export function SpaceProfileCollection({
  spaceId,
  spaceData,
  onComplete
}: SpaceProfileCollectionProps) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ year?: string; branch?: string }>({});

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

  const validate = () => {
    const newErrors: { year?: string; branch?: string } = {};

    if (!year) {
      newErrors.year = 'Please select your year';
    }
    if (!branch) {
      newErrors.branch = 'Please select your branch';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) {
      toast({
        title: 'Error',
        description: 'No user found. Please sign in again.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Filter out empty clubs and work experiences
      const validClubs = clubs.filter(c => c.name.trim() !== '');
      const validWorkExperience = workExperience.filter(w => w.organization.trim() !== '');

      const profile: SpaceMemberProfile = {
        year,
        branch,
        clubs: validClubs,
        workExperience: validWorkExperience,
        creditBalance: 100 // Starting credits
      };

      await joinSpace(firestore, user.uid, spaceId, profile);

      toast({
        title: 'Welcome!',
        description: `You've joined ${spaceData.name}`
      });

      onComplete(spaceId);
    } catch (error) {
      console.error('Error joining space:', error);
      toast({
        title: 'Error',
        description: 'Failed to join space. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-8 shadow-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            for {spaceData.name}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Year Selection */}
          <div className="space-y-2">
            <Label htmlFor="year">Year <span className="text-destructive">*</span></Label>
            <Select value={year} onValueChange={(value) => {
              setYear(value);
              if (errors.year) setErrors({ ...errors, year: undefined });
            }}>
              <SelectTrigger className={errors.year ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select your year" />
              </SelectTrigger>
              <SelectContent>
                {spaceData.settings.yearOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.year && (
              <p className="text-sm text-destructive">{errors.year}</p>
            )}
          </div>

          {/* Branch Selection */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch/Department <span className="text-destructive">*</span></Label>
            <Select value={branch} onValueChange={(value) => {
              setBranch(value);
              if (errors.branch) setErrors({ ...errors, branch: undefined });
            }}>
              <SelectTrigger className={errors.branch ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select your branch" />
              </SelectTrigger>
              <SelectContent>
                {spaceData.settings.branchOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branch && (
              <p className="text-sm text-destructive">{errors.branch}</p>
            )}
          </div>

          {/* Clubs Section */}
          <div className="space-y-4">
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
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addClub}
              type="button"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Club
            </Button>
          </div>

          {/* Work Experience Section */}
          <div className="space-y-4">
            <Label>Work Experience (Optional)</Label>
            {workExperience.map((exp) => (
              <div key={exp.id} className="space-y-4 rounded-md border p-4">
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWorkExperience(exp.id)}
                    className="h-6 w-6"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Organization Name"
                  value={exp.organization}
                  onChange={(e) =>
                    handleWorkExperienceChange(exp.id, 'organization', e.target.value)
                  }
                />
                <div className="flex gap-2">
                  <Select
                    value={exp.employmentType}
                    onValueChange={(value) =>
                      handleWorkExperienceChange(exp.id, 'employmentType', value)
                    }
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
                    onChange={(e) =>
                      handleWorkExperienceChange(exp.id, 'position', e.target.value)
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Start Date (DDMMYYYY)"
                    value={exp.startDate}
                    onChange={(e) =>
                      handleWorkExperienceChange(exp.id, 'startDate', e.target.value)
                    }
                  />
                  <Input
                    placeholder="End Date (DDMMYYYY)"
                    value={exp.endDate}
                    onChange={(e) =>
                      handleWorkExperienceChange(exp.id, 'endDate', e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addWorkExperience}
              type="button"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Space'}
          </Button>
        </div>
      </div>
    </div>
  );
}
