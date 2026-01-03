
'use client';

import { useState, useEffect } from 'react';
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
import { useInformation, Club, WorkExperience } from '@/context/information-context';
import { useToast } from '@/hooks/use-toast';

export function SpaceClient() {
  const { currentUser, updateUser } = useInformation();
  const { toast } = useToast();

  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);

  useEffect(() => {
    if (currentUser) {
      setYear(currentUser.year || '');
      setDepartment(currentUser.department || '');
      setClubs(currentUser.clubs || []);
      setWorkExperience(currentUser.workExperience || []);
    }
  }, [currentUser]);

  const addClub = () => {
    setClubs([...clubs, { id: `club-${Date.now()}`, name: '', position: '' }]);
  };

  const removeClub = (id: string) => {
    setClubs(clubs.filter(club => club.id !== id));
  };

  const handleClubChange = (id: string, field: 'name' | 'position', value: string) => {
    setClubs(clubs.map(club => club.id === id ? { ...club, [field]: value } : club));
  };
  
  const addWorkExperience = () => {
    setWorkExperience([...workExperience, { id: `work-${Date.now()}`, organization: '', employmentType: 'intern', position: '', startDate: '', endDate: '' }]);
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperience(workExperience.filter(exp => exp.id !== id));
  };

  const handleWorkExperienceChange = (id: string, field: keyof Omit<WorkExperience, 'id'>, value: string) => {
    setWorkExperience(workExperience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const handleSaveChanges = () => {
    const updatedUser = {
      ...currentUser,
      year,
      department,
      clubs,
      workExperience
    };
    updateUser(updatedUser);
    toast({
        title: "Success",
        description: "Your space details have been updated."
    })
  }

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" placeholder="e.g., 2nd Year" value={year} onChange={e => setYear(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" placeholder="e.g., Computer Science" value={department} onChange={e => setDepartment(e.target.value)} />
        </div>

        <div className="space-y-4">
            <Label>Clubs</Label>
            {clubs.map((club) => (
                <div key={club.id} className="flex items-center gap-2">
                    <Input placeholder="Club Name" value={club.name} onChange={e => handleClubChange(club.id, 'name', e.target.value)} />
                    <Input placeholder="Position" value={club.position} onChange={e => handleClubChange(club.id, 'position', e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removeClub(club.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addClub}><PlusCircle className="mr-2 h-4 w-4" /> Add Club</Button>
        </div>

        <div className="space-y-4">
            <Label>Work Experience</Label>
            {workExperience.map((exp) => (
                <div key={exp.id} className="space-y-4 rounded-md border p-4">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeWorkExperience(exp.id)} className="h-6 w-6"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <Input placeholder="Organization Name" value={exp.organization} onChange={e => handleWorkExperienceChange(exp.id, 'organization', e.target.value)} />
                    <div className="flex gap-2">
                        <Select onValueChange={value => handleWorkExperienceChange(exp.id, 'employmentType', value)} value={exp.employmentType}>
                            <SelectTrigger><SelectValue placeholder="Employment Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="intern">Intern</SelectItem>
                                <SelectItem value="full-time">Full-time</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="Position" value={exp.position} onChange={e => handleWorkExperienceChange(exp.id, 'position', e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <Input placeholder="Start Date (DDMMYYYY)" value={exp.startDate} onChange={e => handleWorkExperienceChange(exp.id, 'startDate', e.target.value)} />
                        <Input placeholder="End Date (DDMMYYYY)" value={exp.endDate} onChange={e => handleWorkExperienceChange(exp.id, 'endDate', e.target.value)} />
                    </div>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addWorkExperience}><PlusCircle className="mr-2 h-4 w-4" /> Add Experience</Button>
        </div>

        <Button className="w-full" onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
}
