import { redirect } from 'next/navigation';

// Redirect to the main app - AuthGate in (main)/layout.tsx handles authentication
export default function Home() {
  redirect('/ask');
}
