'use client';

import { indianPhoneSchema } from '@cypher/validation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';

function toE164(local: string): string {
  const digits = local.replace(/\D/g, '');
  return `+91${digits}`;
}

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const [localPhone, setLocalPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  async function sendCode() {
    const phone = toE164(localPhone);
    const parsed = indianPhoneSchema.safeParse(phone);
    if (!parsed.success) {
      setMessage('Enter a 10-digit Indian mobile starting with 6–9.');
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      await auth.requestOtp(phone);
      setStep('otp');
      setCooldown(45);
      const timer = window.setInterval(() => {
        setCooldown((value) => {
          if (value <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return value - 1;
        });
      }, 1000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the code.');
    } finally {
      setPending(false);
    }
  }

  async function verify() {
    const phone = toE164(localPhone);
    setPending(true);
    setMessage(null);
    try {
      await auth.verifyOtp(phone, code.trim());
      router.push('/profile');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not verify the code.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <p className="kicker text-accent">Phone OTP</p>
        <h1 className="display-title text-5xl">Enter the floor</h1>
        <p className="text-sm text-text-secondary">
          We text a one-time code. The number stays private — it never lands on your dancer card.
        </p>
      </div>

      {step === 'phone' ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void sendCode();
          }}
        >
          <label className="block space-y-2 text-sm text-text-secondary">
            Mobile
            <div className="flex gap-2">
              <span className="flex h-10 items-center rounded-md border border-border bg-elevated px-3 text-text-muted">
                +91
              </span>
              <Input
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="9876543210"
                value={localPhone}
                onChange={(event) => setLocalPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? 'Sending…' : 'Send code'}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void verify();
          }}
        >
          <label className="block space-y-2 text-sm text-text-secondary">
            Code
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder="6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
            />
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={pending || code.length < 6}>
            {pending ? 'Checking…' : 'Verify'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={pending || cooldown > 0}
            onClick={() => void sendCode()}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </Button>
        </form>
      )}

      {message ? <p className="text-sm text-error">{message}</p> : null}
    </div>
  );
}
