/**
 * Ambient types for Paystack's Inline v2 script (loaded via next/script in
 * app/give/[churchSlug]/page.tsx). Documents the assumed shape of
 * PaystackPop.resumeTransaction — verify against Paystack's current docs
 * if this doesn't match what actually loads at https://js.paystack.co/v2/inline.js.
 */
interface PaystackTransactionCallbacks {
  onSuccess?: (transaction: { reference: string; status: string }) => void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

interface PaystackPopInstance {
  resumeTransaction: (accessCode: string, callbacks?: PaystackTransactionCallbacks) => void;
}

interface PaystackPopConstructor {
  new (): PaystackPopInstance;
}

declare global {
  interface Window {
    PaystackPop: PaystackPopConstructor;
  }
}

export {};
