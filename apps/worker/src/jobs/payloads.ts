export type ReservationExpiryJobPayload =
  | { mode?: 'expire'; registrationId: string }
  | { mode: 'sweep'; registrationId?: never };

export type NotificationJobPayload = {
  registrationId: string;
  type?: string;
};

export type MediaJobPayload = {
  assetId?: string;
  kind?: string;
};

export type ExportJobPayload = {
  exportId?: string;
  kind?: string;
};
