export type SubscriptionSnapshot = {
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type PlanInterval = "month" | "year";
