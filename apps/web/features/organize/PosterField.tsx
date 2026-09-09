'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';

type PosterFieldProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  /** Smaller preview + quieter chrome for dialogs. */
  compact?: boolean;
};

export function PosterField({
  value,
  onChange,
  disabled,
  label = 'Flyer / poster',
  hint = 'Optional — JPEG, PNG, WebP, GIF, max 5MB. Hits Discover cards and the event cover.',
  compact = false,
}: PosterFieldProps) {
  const auth = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(Boolean(value) && !value.includes('/media/posters/'));

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const tid = toastPending(toastCopy.uploading);
    try {
      const uploaded = await auth.api.uploadPoster(file, file.name);
      onChange(uploaded.url);
      setShowUrl(false);
      toastResolve(tid, toastCopy.posterUploaded);
    } catch (err) {
      toastReject(tid, toastCopy.uploadFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-3')}>
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size={compact ? 'sm' : 'md'}
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : value.trim() ? 'Replace image' : 'Upload image'}
        </Button>
        {!compact ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => setShowUrl((open) => !open)}
          >
            {showUrl ? 'Hide URL' : 'Use image URL instead'}
          </Button>
        ) : null}
        {value ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange('')}>
            Clear
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      {showUrl && !compact ? (
        <label className="block space-y-2 text-sm text-text-secondary">
          Poster image URL
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/poster.jpg"
            disabled={disabled}
          />
        </label>
      ) : null}
      {value.trim() ? (
        <div
          className={cn(
            'relative overflow-hidden rounded-md border border-border bg-elevated',
            compact ? 'mx-auto h-40 w-[7.5rem]' : 'aspect-[3/4] max-h-56',
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.trim()} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}
