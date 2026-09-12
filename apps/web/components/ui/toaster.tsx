'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

/** Short functional lines for routine feedback. */
export const toastCopy = {
  basicsSaved: 'Saved.',
  viewersOn: 'Audience pass saved.',
  viewersOff: 'Audience pass turned off.',
  published: 'It’s live.',
  unpublished: 'Event unpublished.',
  categoryAdded: 'Entry added.',
  categoryUpdated: (name: string) => `“${name}” saved.`,
  categoryDeleted: (name: string) => `“${name}” removed.`,
  categoryNameNeeded: 'Add a name first.',
  earlyBirdSaved: (n: number) =>
    n === 1 ? 'Early bird saved.' : `Early bird saved for ${String(n)} entries.`,
  daysSaved: 'Days saved.',
  dayPassesReady: 'Audience day passes ready.',
  mediaAdded: 'Link added.',
  mediaRemoved: 'Link removed.',
  draftSaved: 'Draft saved.',
  organizerCreated: 'Host profile created.',
  posterUploaded: 'Poster saved.',
  profileSaved: 'Profile saved.',
  payoutStarted: 'Payout details saved.',
  audienceSaved: 'Audience pass saved.',
  audienceRemoved: 'Audience pass removed.',
  entrySaved: 'Entry saved.',

  registered: 'Your spot is held.',
  confirmed: 'You’re in.',
  payDone: 'Payment received. Your pass should be ready.',
  payCancelled: 'Checkout cancelled. Your spot is still held.',

  saving: 'Saving…',
  publishing: 'Publishing…',
  uploading: 'Uploading…',
  registering: 'Holding your spot…',
  paying: 'Opening secure payment…',

  saveFailed: 'Couldn’t save. Try again.',
  publishFailed: 'Couldn’t publish. Try again.',
  uploadFailed: 'Upload failed. Try a smaller file.',
  registerFailed: 'Registration didn’t complete. Check your details.',
  payFailed: 'Payment didn’t finish. Your spot is still held.',
  payoutFailed: 'Payout setup failed. Check the fields.',
  genericFail: 'Something went wrong. Try again.',
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

export function toastResolve(id: string | number, message: string, description?: string) {
  return toast.success(message, { id, description, duration: 3400 });
}

export function toastReject(id: string | number, title: string, detail?: string) {
  return toast.error(title, {
    id,
    description: detail && detail !== title ? detail : undefined,
    duration: 5200,
  });
}
