export type ContactEntry = {
  id: string;
  name: string;
  note: string;
  updatedAt: number;
};

export type PremiumState = {
  enabled: boolean;
  activatedAt?: number;
};

export type ContactBoardState = {
  contacts: ContactEntry[];
  firstStartedAt: number;
  premium: PremiumState;
};

export type PremiumStatus = {
  isPremiumActive: boolean;
  isTrialActive: boolean;
  trialEndsAt: number;
  trialDaysRemaining: number;
};
