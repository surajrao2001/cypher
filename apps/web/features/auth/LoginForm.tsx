'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import type { SocialProvider } from '@/lib/supabase/browser';

type Pending = SocialProvider | 'email' | null;

export function LoginForm() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');

  function rememberNext() {
    const next = searchParams.get('next');
    if (next?.startsWith('/')) {
      window.sessionStorage.setItem('cypher.authNext', next);
    } else {
      window.sessionStorage.removeItem('cypher.authNext');
    }
  }

  async function continueWith(provider: SocialProvider) {
    setPending(provider);
    setMessage(null);
    setInfo(null);
    try {
      rememberNext();
      await auth.signInWithProvider(provider);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not start sign-in.');
      setPending(null);
    }
  }

  async function continueWithEmail() {
    setPending('email');
    setMessage(null);
    setInfo(null);
    try {
      rememberNext();
      await auth.signInWithEmail(email);
      setInfo(`Check ${email.trim()} for a sign-in link. You can close this tab after you click it.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send email link.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <p className="kicker text-accent">Sign in</p>
        <h1 className="display-title text-5xl">Enter the floor</h1>
        <p className="text-sm text-text-secondary">
          Continue with Google or email. Your dancer card stays separate from your login
          account.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={pending !== null}
          onClick={() => void continueWith('google')}
        >
          {pending === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="w-full"
          disabled={pending !== null}
          onClick={() => {
            setShowEmail(true);
            setInfo(null);
            setMessage(null);
          }}
        >
          Continue with Email
        </Button>
      </div>

      {showEmail ? (
        <form
          className="space-y-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void continueWithEmail();
          }}
        >
          <label className="block space-y-2 text-sm text-text-secondary">
            Email
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={pending !== null || !email.trim()}>
            {pending === 'email' ? 'Sending link…' : 'Email me a sign-in link'}
          </Button>
        </form>
      ) : null}

      {info ? <p className="text-sm text-text-secondary">{info}</p> : null}
      {message ? <p className="text-sm text-error">{message}</p> : null}
      {auth.error && !message ? <p className="text-sm text-error">{auth.error}</p> : null}
    </div>
  );
}
