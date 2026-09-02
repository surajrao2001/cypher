import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: 'Enter' };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-6 py-16">
      <Link href="/discover" className="kicker mb-10 text-text-muted hover:text-accent">
        Night Cypher
      </Link>
      <LoginForm />
    </div>
  );
}
