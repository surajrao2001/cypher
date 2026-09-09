'use client';

import type { CheckInListResponse, OrganizerDto } from '@cypher/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

export function CheckInPanel({ slug, eventId }: { slug: string; eventId: string }) {
  const auth = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: '', at: 0 });

  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [data, setData] = useState<CheckInListResponse | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraHint, setCameraHint] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const organizer = await auth.api.getMyOrganizerBySlug(slug);
    setOrg(organizer);
    setData(await auth.api.listCheckIns(organizer.id, eventId));
  }, [auth.api, eventId, slug]);

  useEffect(() => {
    void load().catch((error: unknown) =>
      setMessage(error instanceof Error ? error.message : 'Could not load check-ins'),
    );
  }, [load]);

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const checkInValue = useCallback(
    async (raw: string, channel: 'SCAN' | 'MANUAL' | 'CODE') => {
      if (!org || !raw.trim() || busyRef.current) return;
      const value = raw.trim();
      busyRef.current = true;
      setBusy(true);
      setMessage(null);
      try {
        await auth.api.checkIn(
          org.id,
          eventId,
          value.startsWith('cy1.')
            ? { qrToken: value, channel: channel === 'MANUAL' ? 'SCAN' : channel }
            : { registrationCode: value, channel },
        );
        setCode('');
        setMessage('Checked in.');
        await load();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Check-in failed');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [auth.api, eventId, load, org],
  );

  async function startCamera() {
    setCameraHint(null);
    setMessage(null);
    if (!window.isSecureContext) {
      setCameraHint('Camera needs HTTPS (or localhost). Use the code field meanwhile.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraHint('This browser can’t open the camera. Enter the code instead.');
      return;
    }
    if (typeof window.BarcodeDetector !== 'function') {
      setCameraHint(
        'Live QR decode isn’t available in this browser yet — paste the QR payload or type the code.',
      );
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraOn(true);
      scanningRef.current = true;
      void scanLoop();
    } catch {
      setCameraHint('Couldn’t open the camera — check permissions, or enter the code.');
      setCameraOn(false);
    }
  }

  function stopCamera() {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function scanLoop() {
    const Detector = window.BarcodeDetector;
    if (!Detector) return;
    let detector: BarcodeDetectorLike;
    try {
      detector = new Detector({ formats: ['qr_code'] });
    } catch {
      setCameraHint('QR detector failed to start — use the code field.');
      return;
    }

    while (scanningRef.current) {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !busyRef.current) {
        try {
          const codes = await detector.detect(video);
          const value = codes[0]?.rawValue?.trim();
          if (value) {
            const now = Date.now();
            if (value !== lastScanRef.current.value || now - lastScanRef.current.at > 2500) {
              lastScanRef.current = { value, at: now };
              await checkInValue(value, 'SCAN');
            }
          }
        } catch {
          // keep looping; transient frame errors are fine
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8">
      <div>
        <p className="kicker text-accent">Door ops</p>
        <h1 className="display-title text-5xl">Check-in</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Point the camera at a ticket QR, or type / paste the registration code.
        </p>
      </div>

      <div className="space-y-3">
        <div className="overflow-hidden rounded-md border border-border bg-elevated">
          <video
            ref={videoRef}
            className={`aspect-[4/3] w-full bg-black object-cover ${cameraOn ? '' : 'hidden'}`}
            muted
            playsInline
          />
          {!cameraOn ? (
            <div className="flex aspect-[4/3] items-center justify-center px-6 text-center text-sm text-text-muted">
              Camera off — start scan for door QR, or use the field below.
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {cameraOn ? (
            <Button type="button" variant="outline" onClick={stopCamera}>
              Stop camera
            </Button>
          ) : (
            <Button type="button" onClick={() => void startCamera()}>
              Start camera
            </Button>
          )}
        </div>
        {cameraHint ? <p className="text-sm text-text-muted">{cameraHint}</p> : null}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void checkInValue(code, code.trim().startsWith('cy1.') ? 'CODE' : 'MANUAL');
        }}
      >
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="QR payload or registration code"
        />
        <Button type="submit" disabled={busy || !code.trim()}>
          {busy ? 'Checking…' : 'Check in'}
        </Button>
      </form>
      {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Checked in" value={data?.totals.checkedIn ?? 0} />
        <Stat label="Confirmed" value={data?.totals.confirmed ?? 0} />
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {(data?.items ?? []).map((item) => (
          <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
            <span>{item.dancerName ?? item.entryName ?? item.registrationCode}</span>
            <span className="text-text-muted">
              {new Date(item.checkedInAt).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <p className="font-display text-3xl">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
