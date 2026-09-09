'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/features/organize/FormField';
import { DEFAULT_CENTER, getGoogleMapsApiKey, loadGoogleMaps } from '@/lib/google-maps';

export type VenueCoords = { lat: number; lng: number };

type PlaceHit = { coords: VenueCoords; label: string | null };

type Props = {
  venueName: string;
  onVenueNameChange: (value: string) => void;
  coords: VenueCoords | null;
  onCoordsChange: (coords: VenueCoords | null) => void;
  disabled?: boolean;
};

async function searchWithGoogle(q: string): Promise<PlaceHit | null> {
  try {
    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ address: q, region: 'IN' });
    const hit = result.results[0];
    if (!hit?.geometry?.location) return null;
    const label = hit.formatted_address?.split(',').slice(0, 2).join(',').trim() || null;
    return {
      coords: { lat: hit.geometry.location.lat(), lng: hit.geometry.location.lng() },
      label,
    };
  } catch {
    // Geocoding API often disabled while Maps JS works — caller falls back.
    return null;
  }
}

/** Free geocoder (no Google key) — India-biased. */
async function searchWithPhoton(q: string): Promise<PlaceHit | null> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '1');
  url.searchParams.set('lang', 'en');
  // Rough India center for ranking
  url.searchParams.set('lat', '22.5');
  url.searchParams.set('lon', '79');
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: { name?: string; city?: string; state?: string; country?: string };
    }>;
  };
  const feature = data.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  const p = feature?.properties;
  const label =
    [p?.name, p?.city, p?.state].filter(Boolean).join(', ').trim() ||
    null;
  return { coords: { lat, lng }, label };
}

/**
 * Venue name + drop a pin on Google Maps. Optional — clear removes the pin.
 */
export function VenueMapField({
  venueName,
  onVenueNameChange,
  coords,
  onCoordsChange,
  disabled,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const markerObj = useRef<google.maps.Marker | null>(null);
  const onCoordsChangeRef = useRef(onCoordsChange);
  onCoordsChangeRef.current = onCoordsChange;

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!mapRef.current || mapObj.current) return;
      if (!getGoogleMapsApiKey()) {
        setMapError('Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to apps/web/.env.local and restart Next.');
        return;
      }
      try {
        await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        const center = coords ?? DEFAULT_CENTER;
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: coords ? 15 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (disabled || !e.latLng) return;
          onCoordsChangeRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
        mapObj.current = map;
        setReady(true);
        setMapError(null);
      } catch (err) {
        setMapError(err instanceof Error ? err.message : 'Couldn’t load Google Maps');
      }
    }
    void boot();
    return () => {
      cancelled = true;
      markerObj.current?.setMap(null);
      markerObj.current = null;
      mapObj.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapObj.current;
    if (!map || !ready) return;

    if (!coords) {
      markerObj.current?.setMap(null);
      markerObj.current = null;
      return;
    }

    if (!markerObj.current) {
      const marker = new google.maps.Marker({
        map,
        position: coords,
        draggable: !disabled,
        title: 'Venue',
      });
      marker.addListener('dragend', () => {
        const p = marker.getPosition();
        if (p) onCoordsChangeRef.current({ lat: p.lat(), lng: p.lng() });
      });
      markerObj.current = marker;
    } else {
      markerObj.current.setPosition(coords);
      markerObj.current.setDraggable(!disabled);
    }
    map.panTo(coords);
    if ((map.getZoom() ?? 0) < 14) map.setZoom(15);
  }, [coords, disabled, ready]);

  async function runSearch() {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      // Prefer Google Geocoding when enabled; Photon works without an extra API.
      const googleHit = await searchWithGoogle(q);
      if (googleHit) {
        onCoordsChange(googleHit.coords);
        if (!venueName.trim() && googleHit.label) onVenueNameChange(googleHit.label);
        return;
      }
      const photonHit = await searchWithPhoton(q);
      if (photonHit) {
        onCoordsChange(photonHit.coords);
        if (!venueName.trim() && photonHit.label) onVenueNameChange(photonHit.label);
        return;
      }
      setSearchError('No place found — try “Andheri West, Mumbai” or a landmark');
    } catch {
      setSearchError('Search failed — tap the map to drop a pin instead');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <FormField label="Venue" hint="Studio, park, hall — or leave blank" optional>
        <Input
          value={venueName}
          onChange={(e) => onVenueNameChange(e.target.value)}
          placeholder="Studio / spot name"
          disabled={disabled}
        />
      </FormField>
      <FormField
        label="Pin on the map"
        hint="Search or tap the map so people can find the spot on the event page"
        optional
      >
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search — Andheri West, Bangalore…"
              disabled={disabled || searching || Boolean(mapError)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void runSearch();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={disabled || searching || !search.trim() || Boolean(mapError)}
              onClick={() => void runSearch()}
            >
              {searching ? 'Searching…' : 'Find'}
            </Button>
          </div>
          {searchError ? <p className="text-xs text-error">{searchError}</p> : null}
          {mapError ? <p className="text-xs text-error">{mapError}</p> : null}
          <div
            ref={mapRef}
            className="h-56 w-full overflow-hidden rounded-md border border-border bg-elevated"
            aria-label="Venue map"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
            <span>
              {coords
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : 'No pin yet — tap the map'}
            </span>
            {coords ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onCoordsChange(null)}
              >
                Clear pin
              </Button>
            ) : null}
          </div>
        </div>
      </FormField>
    </div>
  );
}
