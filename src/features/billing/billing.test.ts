import { describe, expect, it } from "vitest";
import { hasPlus, itemImageLimit } from "./entitlements";

const now = new Date("2026-09-19T10:00:00Z");
const future = new Date("2026-10-19T10:00:00Z");
const past = new Date("2026-09-18T10:00:00Z");

describe("LeihNest Plus entitlements", () => {
  it.each(["active", "trialing"])("grants Plus for %s inside a live period", status => {
    expect(hasPlus({ status, currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(true);
  });

  it("keeps Plus for past_due inside the paid period", () => {
    expect(hasPlus({ status: "past_due", currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(true);
  });

  it.each(["canceled", "unpaid", "incomplete_expired"])("rejects %s", status => {
    expect(hasPlus({ status, currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(false);
  });

  it("expires Plus after the paid period", () => {
    expect(hasPlus({ status: "active", currentPeriodEnd: past, cancelAtPeriodEnd: true }, now)).toBe(false);
  });

  it("does not grant Plus when Stripe has no current paid-period boundary", () => {
    expect(hasPlus({ status: "active", currentPeriodEnd: null, cancelAtPeriodEnd: false }, now)).toBe(false);
    expect(hasPlus({ status: "past_due", currentPeriodEnd: null, cancelAtPeriodEnd: false }, now)).toBe(false);
  });

  it("maps Free to one image and Plus to five", () => {
    expect(itemImageLimit(null, now)).toBe(1);
    expect(itemImageLimit({ status: "active", currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(5);
  });
});

import { resolvePriceId } from "./stripe";
import { canReuseCheckout } from "./billing-service";

describe("Stripe plan price allowlist",()=>{
  it("maps only the configured monthly and yearly prices",()=>{
    const env={STRIPE_PLUS_MONTHLY_PRICE_ID:"price_month",STRIPE_PLUS_YEARLY_PRICE_ID:"price_year"} as NodeJS.ProcessEnv;
    expect(resolvePriceId("month",env)).toBe("price_month");
    expect(resolvePriceId("year",env)).toBe("price_year");
  });
  it("rejects missing or unsupported price configuration",()=>{
    expect(()=>resolvePriceId("month",{} as NodeJS.ProcessEnv)).toThrow("STRIPE_NOT_CONFIGURED");
    expect(()=>resolvePriceId("week" as never,{STRIPE_PLUS_MONTHLY_PRICE_ID:"price_month"} as NodeJS.ProcessEnv)).toThrow("STRIPE_NOT_CONFIGURED");
  });
});


describe("Checkout session reuse",()=>{
  const expires=new Date("2026-09-19T11:00:00Z");
  it("reuses the same live pending Checkout only for the same price",()=>{
    expect(canReuseCheckout({
      status:"checkout_pending",stripePriceId:"price_year",stripeCheckoutSessionId:"cs_live",stripeCheckoutExpiresAt:expires,
    },"price_year",now)).toBe(true);
    expect(canReuseCheckout({
      status:"checkout_pending",stripePriceId:"price_year",stripeCheckoutSessionId:"cs_live",stripeCheckoutExpiresAt:expires,
    },"price_month",now)).toBe(false);
  });
  it("does not reuse expired or incomplete pending state",()=>{
    expect(canReuseCheckout({
      status:"checkout_pending",stripePriceId:"price_year",stripeCheckoutSessionId:"cs_live",stripeCheckoutExpiresAt:new Date("2026-09-19T09:00:00Z"),
    },"price_year",now)).toBe(false);
    expect(canReuseCheckout({
      status:"checkout_pending",stripePriceId:"price_year",stripeCheckoutSessionId:null,stripeCheckoutExpiresAt:expires,
    },"price_year",now)).toBe(false);
  });
});
