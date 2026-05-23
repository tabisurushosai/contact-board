import type { ContactBoardState, PremiumStatus } from "./types";

export const TRIAL_DAYS = 7;
export const STRIPE_PAYMENT_LINK = "https://example.com/stripe-payment-link-placeholder";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getPremiumStatus(state: ContactBoardState, now = Date.now()): PremiumStatus {
  const trialEndsAt = state.firstStartedAt + TRIAL_DAYS * DAY_IN_MS;
  const trialDaysRemaining = Math.max(0, Math.ceil((trialEndsAt - now) / DAY_IN_MS));
  const isTrialActive = now < trialEndsAt;

  return {
    isPremiumActive: state.premium.enabled || isTrialActive,
    isTrialActive,
    trialEndsAt,
    trialDaysRemaining
  };
}
