'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';

type PosterFieldProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function PosterField({ value, onChange, disabled }: PosterFieldProps) {
  const auth = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(Boolean(value) && !value.includes('/media/posters/'));

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await auth.api.uploadPoster(file, file.name);
      onChange(uploaded.url);
      setShowUrl(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">Event poster</p>
      <p className="text-xs text-text-muted">
        Upload an image (JPEG, PNG, WebP, GIF — max 5MB). Used on Discover cards and the event cover.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload image'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => setShowUrl((open) => !open)}
        >
          {showUrl ? 'Hide URL' : 'Use image URL instead'}
        </Button>
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
      {showUrl ? (
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
        <div className="relative aspect-[3/4] max-h-56 overflow-hidden rounded-md border border-border bg-elevated">
          <img src={value.trim()} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
