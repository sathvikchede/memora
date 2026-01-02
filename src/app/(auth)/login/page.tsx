'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';

export default function LoginPage() {
  const auth = useAuth();

  const handleGoogleSignIn = async () => {
    if (auth) {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } else {
      console.error('Auth service is not available');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-4xl font-bold">memora.</h1>
        <p className="text-muted-foreground">
          An information base that strictly answers based on the knowledge that
          it has gained through inputs.
        </p>
        <Button onClick={handleGoogleSignIn} className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
