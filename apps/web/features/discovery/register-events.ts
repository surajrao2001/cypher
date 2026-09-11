export type OpenRegisterDetail = {
  mode: 'compete' | 'watch';
  categoryId?: string;
};

export const OPEN_REGISTER_EVENT = 'bynd8:open-register';

export function openEventRegister(detail: OpenRegisterDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_REGISTER_EVENT, { detail }));
}
