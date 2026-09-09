'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { GoogleGlyph } from '@/components/brand/GoogleGlyph';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import type { SocialProvider } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

type Pending = SocialProvider | 'email' | null;

export function LoginForm() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
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
      const text = error instanceof Error ? error.message : 'Could not start sign-in.';
      if (text !== 'Sign-in was cancelled') {
        setMessage(text);
      }
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
      setInfo(`Check ${email.trim()} for a sign-in link. You can close this tab after you open it.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send email link.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center">
      <div className="mb-8 space-y-5 lg:mb-10">
        <div className="flex justify-center">
          <BrandLogo variant="lockup" size="lg" href={null} priority />
        </div>
        <div className="space-y-2">
          <p className="kicker text-accent">Sign in</p>
          <h1 className="display-title text-4xl text-[#F4F2ED] sm:text-5xl lg:text-[2.75rem]">
            Enter the scene
          </h1>
          <p className="text-sm leading-relaxed text-text-secondary">
            Continue with Google or email. Your dancer card stays yours.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void continueWith('google')}
          className={cn(
            'flex h-14 w-full items-center justify-center gap-3 rounded-sm border border-[#dadce0] bg-white px-4 text-base font-semibold text-[#1f1f1f] shadow-sm transition-colors',
            'hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          <GoogleGlyph className="h-6 w-6" />
          <span className="normal-case tracking-normal">
            {pending === 'google' ? 'Waiting for Google…' : 'Continue with Google'}
          </span>
        </button>

        <div className="flex items-center gap-3" role="separator" aria-label="or">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          className="space-y-3"
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
              className="h-12 rounded-sm"
            />
          </label>
          <Button
            type="submit"
            size="lg"
            variant="secondary"
            className="h-12 w-full rounded-sm normal-case tracking-normal"
            disabled={pending !== null || !email.trim()}
          >
            {pending === 'email' ? 'Sending link…' : 'Email me a sign-in link'}
          </Button>
        </form>
      </div>

      {info ? <p className="mt-4 text-sm text-text-secondary">{info}</p> : null}
      {message ? <p className="mt-4 text-sm text-error">{message}</p> : null}
      {auth.error && !message ? <p className="mt-4 text-sm text-error">{auth.error}</p> : null}

      <p className="mt-10 text-[11px] uppercase tracking-[0.18em] text-text-muted">
        The culture is the centre. BYND8 builds around it.
      </p>
    </div>
  );
}
