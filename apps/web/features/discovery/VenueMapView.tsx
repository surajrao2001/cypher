'use client';

import { useEffect, useRef, useState } from 'react';

import { getGoogleMapsApiKey, loadGoogleMaps } from '@/lib/google-maps';
import { InlineNotice } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type Props = {
  lat: number;
  lng: number;
  venueLabel?: string | null;
  className?: string;
  /** Height/classes for the map canvas */
  mapClassName?: string;
};

/** Read-only Google Map with a pin + open in Google Maps. */
export function VenueMapView({ lat, lng, venueLabel, className, mapClassName }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let marker: google.maps.Marker | null = null;

    async function boot() {
      if (!mapRef.current) return;
      if (!getGoogleMapsApiKey()) {
        setError('Map key missing');
        return;
      }
      try {
        await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        const map = new google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: true,
          gestureHandling: 'cooperative',
          keyboardShortcuts: false,
          clickableIcons: false,
        });
        marker = new google.maps.Marker({
          map,
          position: { lat, lng },
          title: venueLabel || 'Venue',
        });
        setError(null);
      } catch {
        setError('Couldn’t load map');
      }
    }
    void boot();
    return () => {
      cancelled = true;
      marker?.setMap(null);
    };
  }, [lat, lng, venueLabel]);

  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className={className}>
      <div
        ref={mapRef}
        className={cn(
          'h-48 w-full overflow-hidden rounded-md border border-border bg-elevated',
          mapClassName,
        )}
        aria-label="Venue map"
      />
      {error ? (
        <InlineNotice className="mx-4 mt-2 text-xs">{error}</InlineNotice>
      ) : (
        <div className="mt-2 flex flex-wrap gap-3 px-4 pb-3 text-xs">
          <a
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            Open in Google Maps{venueLabel ? ` · ${venueLabel}` : ''}
          </a>
        </div>
      )}
    </div>
  );
}
