
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useInformation, Club, WorkExperience, SpaceUserDetail } from '@/context/information-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


export function SpaceClient() {
  const { currentUser, updateUser, activeSpaceId, setActiveSpaceId } = useInformation();
  const { toast } = useToast();
  
  const [currentSpaceDetails, setCurrentSpaceDetails] = useState<SpaceUserDetail>(currentUser.spaceDetails[activeSpaceId] || {});

  useEffect(() => {
    setCurrentSpaceDetails(currentUser.spaceDetails[activeSpaceId] || {});
  }, [currentUser, activeSpaceId]);

  const handleDetailChange = (field: keyof SpaceUserDetail, value: any) => {
    setCurrentSpaceDetails(prev => ({...prev, [field]: value}));
  };

  const addClub = () => {
    const newClubs = [...(currentSpaceDetails.clubs || []), { id: `club-${Date.now()}`, name: '', position: '' }];
    handleDetailChange('clubs', newClubs);
  };

  const removeClub = (id: string) => {
    const newClubs = currentSpaceDetails.clubs?.filter(club => club.id !== id);
    handleDetailChange('clubs', newClubs);
  };

  const handleClubChange = (id: string, field: 'name' | 'position', value: string) => {
    const newClubs = currentSpaceDetails.clubs?.map(club => club.id === id ? { ...club, [field]: value } : club);
    handleDetailChange('clubs', newClubs);
  };
  
  const addWorkExperience = () => {
    const newWorkExperiences = [...(currentSpaceDetails.workExperience || []), { id: `work-${Date.now()}`, organization: '', employmentType: 'intern', position: '', startDate: '', endDate: '' }];
    handleDetailChange('workExperience', newWorkExperiences);
  };

  const removeWorkExperience = (id: string) => {
    const newWorkExperiences = currentSpaceDetails.workExperience?.filter(exp => exp.id !== id);
    handleDetailChange('workExperience', newWorkExperiences);
  };

  const handleWorkExperienceChange = (id: string, field: keyof Omit<WorkExperience, 'id'>, value: string) => {
    const newWorkExperiences = currentSpaceDetails.workExperience?.map(exp => exp.id === id ? { ...exp, [field]: value } : exp);
    handleDetailChange('workExperience', newWorkExperiences);
  };

  const handleSaveChanges = () => {
    const updatedUser = {
      ...currentUser,
      spaceDetails: {
        ...currentUser.spaceDetails,
        [activeSpaceId]: currentSpaceDetails
      }
    };
    updateUser(updatedUser);
    toast({
        title: "Success",
        description: "Your space details have been updated."
    })
  }

  const spaces = [
    { id: 'sample-college', name: 'Sample College' },
    { id: 'griet-college', name: 'GRIET College' }
  ];

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Tabs defaultValue="my-spaces">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-spaces">My Spaces</TabsTrigger>
          <TabsTrigger value="created-spaces">Created Spaces</TabsTrigger>
        </TabsList>
        <TabsContent value="my-spaces">
          <Accordion 
            type="single" 
            collapsible 
            className="w-full" 
            value={activeSpaceId}
            onValueChange={(value) => value && setActiveSpaceId(value)}
          >
            {spaces.map(space => (
                <AccordionItem key={space.id} value={space.id} className="border-none mb-2">
                    <AccordionTrigger 
                        className={cn(
                        "w-full rounded-full p-4 font-semibold no-underline hover:no-underline",
                        activeSpaceId === space.id
                            ? "bg-white text-black" 
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                    >
                        {space.name}
                    </AccordionTrigger>
                    <AccordionContent>
                        <Card className="border-0">
                            <CardHeader>
                                <CardTitle>{space.name} Details</CardTitle>
                                <CardDescription>Fill in your details for this space.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="year">Year</Label>
                                    <Input id="year" placeholder="e.g., 2nd Year" value={currentSpaceDetails.year || ''} onChange={e => handleDetailChange('year', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input id="department" placeholder="e.g., Computer Science" value={currentSpaceDetails.department || ''} onChange={e => handleDetailChange('department', e.target.value)} />
                                </div>

                                <div className="space-y-4">
                                    <Label>Clubs</Label>
                                    {currentSpaceDetails.clubs?.map((club) => (
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
                                    {currentSpaceDetails.workExperience?.map((exp) => (
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
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
        <TabsContent value="created-spaces">
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">You haven't created any spaces yet.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
