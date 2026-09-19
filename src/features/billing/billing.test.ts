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

  it("maps Free to one image and Plus to five", () => {
    expect(itemImageLimit(null, now)).toBe(1);
    expect(itemImageLimit({ status: "active", currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(5);
  });
});

import { resolvePriceId } from "./stripe";

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
