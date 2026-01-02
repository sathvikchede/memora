import { redirect } from 'next/navigation';

// In mock auth mode, we redirect directly to the main app page.
export default function Home() {
  redirect('/ask');
}
