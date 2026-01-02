'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // In a real app, you'd check if onboarding is complete
        router.push('/'); 
      } else {
        // For mock mode, we just go to onboarding to create the user profile
        router.push('/onboarding');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-4 text-muted-foreground">Setting up...</p>
    </div>
  );
}
