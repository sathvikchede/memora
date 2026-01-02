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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Club {
  id: number;
  name: string;
  position: string;
}

interface WorkExperience {
  id: number;
  organization: string;
  employmentType: 'intern' | 'full-time' | '';
  position: string;
  startDate: string;
  endDate: string;
}

export function SpaceClient() {
  const [clubs, setClubs] = useState<Club[]>([{ id: 1, name: '', position: '' }]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([
    { id: 1, organization: '', employmentType: '', position: '', startDate: '', endDate: '' },
  ]);

  const addClub = () => {
    setClubs([...clubs, { id: Date.now(), name: '', position: '' }]);
  };

  const removeClub = (id: number) => {
    setClubs(clubs.filter(club => club.id !== id));
  };

  const handleClubChange = (id: number, field: 'name' | 'position', value: string) => {
    setClubs(clubs.map(club => club.id === id ? { ...club, [field]: value } : club));
  };
  
  const addWorkExperience = () => {
    setWorkExperiences([...workExperiences, { id: Date.now(), organization: '', employmentType: '', position: '', startDate: '', endDate: '' }]);
  };

  const removeWorkExperience = (id: number) => {
    setWorkExperiences(workExperiences.filter(exp => exp.id !== id));
  };

  const handleWorkExperienceChange = (id: number, field: keyof Omit<WorkExperience, 'id'>, value: string) => {
    setWorkExperiences(workExperiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };


  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Tabs defaultValue="my-spaces">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-spaces">My Spaces</TabsTrigger>
          <TabsTrigger value="created-spaces">Created Spaces</TabsTrigger>
        </TabsList>
        <TabsContent value="my-spaces">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <span className="font-semibold">Sample College</span>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-0">
                    <CardHeader>
                        <CardTitle>College Details</CardTitle>
                        <CardDescription>Fill in your details for this space.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Input id="year" placeholder="e.g., 2nd Year" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" placeholder="e.g., Computer Science" />
                        </div>

                        <div className="space-y-4">
                            <Label>Clubs</Label>
                            {clubs.map((club, index) => (
                                <div key={club.id} className="flex items-center gap-2">
                                    <Input placeholder="Club Name" value={club.name} onChange={e => handleClubChange(club.id, 'name', e.target.value)} />
                                    <Input placeholder="Position" value={club.position} onChange={e => handleClubChange(club.id, 'position', e.target.value)} />
                                    {clubs.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeClub(club.id)}><Trash2 className="h-4 w-4" /></Button>}
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addClub}><PlusCircle className="mr-2 h-4 w-4" /> Add Club</Button>
                        </div>

                        <div className="space-y-4">
                            <Label>Work Experience</Label>
                            {workExperiences.map((exp, index) => (
                                <div key={exp.id} className="space-y-4 rounded-md border p-4">
                                     <div className="flex justify-end">
                                        {workExperiences.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeWorkExperience(exp.id)} className="h-6 w-6"><Trash2 className="h-4 w-4" /></Button>}
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
                        <Button className="w-full">Save Changes</Button>
                    </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
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
