import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { subscriptionProjection } from "./webhook-service";

function subscription(overrides:Record<string,unknown>={}){
  return {
    id:"sub_1",
    customer:"cus_1",
    status:"active",
    cancel_at_period_end:false,
    metadata:{groupId:"group_1"},
    items:{data:[{
      current_period_end:1_800_000_000,
      price:{id:"price_month",recurring:{interval:"month"}},
    }]},
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("Stripe webhook subscription projection",()=>{
  it("maps current subscription state into the group projection",()=>{
    const row=subscriptionProjection(subscription(),1_790_000_000);
    expect(row).toMatchObject({
      groupId:"group_1",
      stripeCustomerId:"cus_1",
      stripeSubscriptionId:"sub_1",
      stripePriceId:"price_month",
      interval:"MONTH",
      status:"active",
      cancelAtPeriodEnd:false,
    });
    expect(row.currentPeriodEnd?.toISOString()).toBe(new Date(1_800_000_000*1000).toISOString());
    expect(row.stripeUpdatedAt.toISOString()).toBe(new Date(1_790_000_000*1000).toISOString());
  });

  it("supports the legacy top-level period end when Stripe sends it",()=>{
    const row=subscriptionProjection(subscription({current_period_end:1_810_000_000}),1_790_000_000);
    expect(row.currentPeriodEnd?.toISOString()).toBe(new Date(1_810_000_000*1000).toISOString());
  });

  it("maps annual prices without granting entitlement itself",()=>{
    const row=subscriptionProjection(subscription({items:{data:[{current_period_end:1_800_000_000,price:{id:"price_year",recurring:{interval:"year"}}}]}}),1_790_000_000);
    expect(row.interval).toBe("YEAR");
    expect(row.stripePriceId).toBe("price_year");
  });
});
