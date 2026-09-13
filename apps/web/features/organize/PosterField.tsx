'use client';

import { useRef, useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
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
  /** Poster-shaped upload affordance (create flow). */
  shaped?: boolean;
  /** Create-details dashed upload panel matching Phase F mock. */
  createPanel?: boolean;
};

export function PosterField({
  value,
  onChange,
  disabled,
  label = 'Flyer / poster',
  hint = 'Optional — JPEG, PNG, WebP, GIF, max 5MB. Hits Discover cards and the event cover.',
  compact = false,
  shaped = false,
  createPanel = false,
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

  if (createPanel) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-primary">
          {label} <span className="text-text-muted">(optional)</span>
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'relative flex h-28 w-full max-w-[13.5rem] shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-[#4a4a4a] bg-transparent transition-colors',
              'hover:border-accent/60 disabled:opacity-50',
            )}
          >
            {value.trim() ? (
              <>
                <img src={value.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <span className="relative z-10 rounded-md bg-black/65 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                  Change
                </span>
              </>
            ) : (
              <>
                <ByndIcon name="poster" className="size-6 text-accent" />
                <span className="text-sm font-semibold text-accent">
                  {uploading ? 'Uploading…' : 'Upload image'}
                </span>
              </>
            )}
          </button>
          <div className="min-w-0 space-y-2">
            <p className="max-w-sm text-sm leading-relaxed text-[#c47a4a]">
              {hint}
            </p>
            {value.trim() ? (
              <button
                type="button"
                className="text-xs text-text-muted underline underline-offset-2 hover:text-accent"
                disabled={disabled}
                onClick={() => onChange('')}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </div>
    );
  }

  if (shaped) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
        <div className="flex flex-wrap items-end gap-4">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'relative flex aspect-[3/4] w-28 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-sm border border-border/80 bg-elevated/40 transition-colors hover:border-accent/50 disabled:opacity-50 sm:w-32',
            )}
          >
            {value.trim() ? (
              <img src={value.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <span className="font-display text-2xl text-text-muted">+</span>
                <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                  {uploading ? 'Uploading…' : 'Add'}
                </span>
              </>
            )}
          </button>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>{value.trim() ? 'Poster added' : 'Add a poster'}</p>
            {value.trim() ? (
              <button
                type="button"
                className="text-xs text-text-muted underline underline-offset-2 hover:text-accent"
                disabled={disabled}
                onClick={() => onChange('')}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </div>
    );
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
            'relative overflow-hidden rounded-sm border border-border/80 bg-elevated',
            compact ? 'mx-auto h-40 w-[7.5rem]' : 'aspect-[3/4] max-h-56',
          )}
        >
          <img src={value.trim()} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}

