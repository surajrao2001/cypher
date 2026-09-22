'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { GoogleGlyph } from '@/components/brand/GoogleGlyph';
import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { friendlyError, InlineNotice } from '@/features/shell/AsyncState';
import { LEGAL_URLS } from '@/lib/release';
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
      const text = friendlyError(error, 'Could not start sign-in.');
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
      setMessage(friendlyError(error, 'Could not send email link.'));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[26rem]">
      <div className="rounded-xl border border-white/[0.08] bg-[#121212] px-5 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:px-7 sm:py-8">
        <div className="space-y-2">
          <h1 className="text-[1.65rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.85rem]">
            Welcome to <span className="text-accent">BYND8</span>
          </h1>
          <p className="text-[13px] leading-relaxed text-white/50">
            Sign in to discover battles, hold your spot, and keep your dancer card in one place.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => void continueWith('google')}
            className={cn(
              'flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-white/20 bg-[#1A1A1A] px-4 text-[14px] font-medium text-white transition-colors',
              'hover:bg-[#222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            <GoogleGlyph className="h-5 w-5" />
            <span className="normal-case tracking-normal">
              {pending === 'google' ? 'Waiting for Google…' : 'Continue with Google'}
            </span>
          </button>

          <div className="flex items-center gap-3" role="separator" aria-label="or">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">
              or
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <ByndIcon name="link" className="size-3.5 text-accent" />
            <span className="text-[12px] font-semibold text-accent">Email</span>
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void continueWithEmail();
            }}
          >
            <label className="block space-y-1.5 text-[12px] text-white/45">
              Email address
              <div className="relative">
                <ByndIcon
                  name="link"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35"
                />
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 rounded-md border-white/10 bg-[#0E0E0E] pl-10 text-[14px] text-white placeholder:text-white/30"
                />
              </div>
            </label>
            <Button
              type="submit"
              className="h-11 w-full rounded-md bg-accent text-[14px] font-semibold normal-case tracking-normal text-white hover:bg-accent/90"
              disabled={pending !== null || !email.trim()}
            >
              {pending === 'email' ? 'Sending link…' : 'Email me a sign-in link'}
            </Button>
          </form>
        </div>

        {info ? <InlineNotice className="mt-4">{info}</InlineNotice> : null}
        {message ? (
          <InlineNotice tone="warn" className="mt-4">
            {message}
          </InlineNotice>
        ) : null}
        {auth.error && !message ? (
          <InlineNotice tone="warn" className="mt-4">
            {friendlyError(auth.error)}
          </InlineNotice>
        ) : null}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-white/40">
          By signing in, you agree to our{' '}
          <a
            href={LEGAL_URLS.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href={LEGAL_URLS.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

      <p className="mt-6 text-center font-[family-name:var(--font-display)] text-sm italic tracking-wide text-white/55 sm:text-right">
        People. Events. Beyond.
        <span className="mt-1 block h-0.5 w-16 bg-accent sm:ml-auto" aria-hidden />
      </p>
    </div>
  );
}
