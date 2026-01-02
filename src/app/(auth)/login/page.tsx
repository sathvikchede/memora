'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';

export default function LoginPage() {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      console.error('Auth service is not available');
      return;
    }
    
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      // Use signInWithPopup for better preview compatibility
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Popup sign-in failed, trying redirect...", error);
      // Fallback to redirect if popup fails (e.g., blocked by browser)
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Redirect sign-in also failed:", redirectError);
        setIsLoading(false);
      }
    }
    // No need to set loading to false on success, as the page will redirect.
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-4xl font-bold">memora.</h1>
        <p className="text-muted-foreground">
          From memory to meaning.
        </p>
        <Button onClick={handleGoogleSignIn} className="w-full" disabled={!auth || isLoading}>
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-background/80 border-t-transparent rounded-full animate-spin" />
          ) : (
            'Sign in with Google'
          )}
        </Button>
      </div>
    </div>
  );
}
