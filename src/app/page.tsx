'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to the main app for testing
    router.push('/ask');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading Test Environment...</p>
    </div>
  );
}
