'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

/** Casual hood-voice lines — keep short. */
export const toastCopy = {
  basicsSaved: 'What’s cooking is locked. Floor’s got a date.',
  viewersOn: 'Viewers pass is live. Crowd can roll up.',
  viewersOff: 'Viewers pass off. Compete-only night.',
  published: 'It’s live on Discover. Go pull the room.',
  unpublished: 'Back to draft. Nobody sees it but you.',
  categoryAdded: 'New category on the board. Nice.',
  categoryUpdated: (name: string) => `“${name}” updated. Clean.`,
  categoryDeleted: (name: string) => `“${name}” gone. Room to breathe.`,
  categoryNameNeeded: 'Gotta name the category first, cuh.',
  earlyBirdSaved: (n: number) =>
    n === 1 ? 'Early bird locked for that ticket.' : `Early bird locked for ${String(n)} tickets.`,
  daysSaved: 'Days named. Schedule’s not vibes anymore.',
  dayPassesReady: 'Day + all-days tickets ready. Crowd can pick.',
  mediaAdded: 'Link dropped. Poster’s not lonely anymore.',
  mediaRemoved: 'Link yeeted.',
  draftSaved: 'Draft’s in the bag. Categories next — don’t ghost it.',
  organizerCreated: 'Crew’s on the map. Time to throw something.',
  posterUploaded: 'Poster looks hard. Saved.',
  profileSaved: 'Profile locked. They know what to call you.',
  payoutStarted: 'Payout setup saved. Check Cashfree if they ping you.',

  registered: 'Spot’s held. Finish confirm before it ghosts.',
  confirmed: 'Confirmed. See you on the floor.',
  payDone: 'Payment’s in. Tickets should light up soon.',
  payCancelled: 'Checkout bounced — spot’s still held. Hit Pay again.',

  saving: 'Saving… hold up.',
  publishing: 'Flipping the switch…',
  uploading: 'Uploading… almost there.',
  registering: 'Locking your spot…',
  paying: 'Talking to Cashfree…',

  saveFailed: 'That save bounced. Try again?',
  publishFailed: 'Publish didn’t land. One more try.',
  uploadFailed: 'Upload flopped. Smaller file or retry?',
  registerFailed: 'Registration bounced. Check the deets.',
  payFailed: 'Checkout didn’t finish. Spot’s still held.',
  payoutFailed: 'Payout setup tripped. Check the fields.',
  genericFail: 'Something tripped. Run it back.',
} as const;

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      visibleToasts={3}
      duration={3400}
      gap={10}
      offset={16}
      expand={false}
      icons={{
        success: null,
        error: null,
        loading: null,
        info: null,
        warning: null,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group relative flex w-[min(100vw-2rem,21.5rem)] items-start gap-3 rounded-md border border-border bg-elevated/95 px-3.5 py-3 font-body text-sm text-text-primary shadow-[0_16px_48px_-16px_rgba(0,0,0,0.85)] backdrop-blur-md',
          title: 'pr-4 text-[13.5px] font-semibold leading-snug tracking-tight text-text-primary',
          description: 'mt-1 pr-2 text-xs leading-snug text-text-secondary',
          success: 'border-l-[3px] border-l-accent-2 border-y-border border-r-border',
          error: 'border-l-[3px] border-l-error border-y-border border-r-border',
          loading: 'border-l-[3px] border-l-accent border-y-border border-r-border',
          info: 'border-l-[3px] border-l-accent border-y-border border-r-border',
        },
      }}
    />
  );
}

export function toastSuccess(message: string, description?: string) {
  return toast.success(message, {
    description,
    duration: 3400,
  });
}

/** Casual title + optional API detail underneath. */
export function toastError(title: string, detail?: string) {
  return toast.error(title, {
    description: detail && detail !== title ? detail : undefined,
    duration: 5200,
  });
}

export function toastInfo(message: string, description?: string) {
  return toast(message, { description, duration: 4000 });
}

export function toastPending(message: string = toastCopy.saving) {
  return toast.loading(message);
}

export function toastDismiss(id?: string | number) {
  toast.dismiss(id);
}

/** Replace a pending toast with success. */
export function toastResolve(id: string | number, message: string, description?: string) {
  return toast.success(message, { id, description, duration: 3400 });
}

/** Replace a pending toast with error. */
export function toastReject(id: string | number, title: string, detail?: string) {
  return toast.error(title, {
    id,
    description: detail && detail !== title ? detail : undefined,
    duration: 5200,
  });
}
