'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 }; // Mumbai

let loaderPromise: Promise<typeof google> | null = null;
let optionsSet = false;

export function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
}

/** Load Maps JS once (maps + marker + geocoding). */
export function loadGoogleMaps(): Promise<typeof google> {
  const key = getGoogleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'));
  }
  if (!loaderPromise) {
    if (!optionsSet) {
      setOptions({ key, v: 'weekly' });
      optionsSet = true;
    }
    loaderPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('geocoding'),
    ]).then(() => google);
  }
  return loaderPromise;
}

export { DEFAULT_CENTER };
