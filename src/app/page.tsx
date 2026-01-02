import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect directly to the main app page for test mode.
  redirect('/ask');
}
