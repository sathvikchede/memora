'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // In mock auth mode, we bypass onboarding and go straight to the app.
    router.push('/ask');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-4 text-muted-foreground">Loading test environment...</p>
    </div>
  );
}
