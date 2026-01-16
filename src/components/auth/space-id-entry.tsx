'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { getSpace, SpaceData } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';

interface SpaceIdEntryProps {
  onSpaceVerified: (spaceId: string, spaceData: SpaceData) => void;
}

export function SpaceIdEntry({ onSpaceVerified }: SpaceIdEntryProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [spaceId, setSpaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setError('');

    // Validate format (7 digits)
    if (!/^\d{7}$/.test(spaceId)) {
      setError('Space ID must be a 7-digit number');
      return;
    }

    setIsLoading(true);
    try {
      const space = await getSpace(firestore, spaceId);

      if (!space) {
        setError('Space not found. Please check the ID and try again.');
        return;
      }

      onSpaceVerified(spaceId, space);
    } catch (error) {
      console.error('Error verifying space:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify space. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleVerify();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Join a Space</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 7-digit Space ID to join
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spaceId">Space ID</Label>
            <Input
              id="spaceId"
              placeholder="1234567"
              value={spaceId}
              onChange={(e) => {
                // Only allow digits and max 7 characters
                const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                setSpaceId(value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
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
            className="mt-6 w-full"
            size="lg"
            onClick={handleVerify}
            disabled={isLoading || spaceId.length !== 7}
          >
            {isLoading ? 'Verifying...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
