import type { SubscriptionSnapshot } from "./billing-types";

const PLUS_STATUSES = new Set(["active", "trialing", "past_due"]);

export function hasPlus(subscription: SubscriptionSnapshot | null | undefined, now = new Date()) {
  if (!subscription || !PLUS_STATUSES.has(subscription.status)) return false;
  if (!subscription.currentPeriodEnd) {
    return subscription.status === "active" || subscription.status === "trialing";
  }
  return subscription.currentPeriodEnd.getTime() > now.getTime();
}

export function itemImageLimit(subscription: SubscriptionSnapshot | null | undefined, now = new Date()): 1 | 5 {
  return hasPlus(subscription, now) ? 5 : 1;
}
