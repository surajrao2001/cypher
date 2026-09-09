declare module '@cashfreepayments/cashfree-js' {
  export type CashfreeMode = 'sandbox' | 'production';

  export type CashfreeCheckoutOptions = {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_top' | '_modal' | string;
    returnUrl?: string;
  };

  export type CashfreeCheckoutResult = {
    error?: { message?: string } | null;
    paymentDetails?: { paymentMessage?: string } | null;
    redirect?: boolean;
  };

  export type CashfreeInstance = {
    checkout: (options: CashfreeCheckoutOptions) => Promise<CashfreeCheckoutResult | undefined>;
  };

  export function load(options: { mode: CashfreeMode }): Promise<CashfreeInstance | null>;
}
