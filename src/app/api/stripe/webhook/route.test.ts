import { beforeEach, describe, expect, it, vi } from "vitest";

const state=vi.hoisted(()=>({
  constructEvent:vi.fn(),
  applyStripeEvent:vi.fn(),
}));

vi.mock("@/features/billing/stripe",()=>({
  getStripe:()=>({webhooks:{constructEvent:state.constructEvent}}),
}));
vi.mock("@/features/billing/webhook-service",()=>({
  applyStripeEvent:state.applyStripeEvent,
}));

import { POST } from "./route";

beforeEach(()=>{
  state.constructEvent.mockReset();
  state.applyStripeEvent.mockReset();
});

describe("Stripe webhook HTTP handling",()=>{
  it("returns 400 for an invalid Stripe signature",async()=>{
    state.constructEvent.mockImplementation(()=>{throw new Error("bad signature");});
    const response=await POST(new Request("https://leihnest.de/api/stripe/webhook",{
      method:"POST",body:"{}",headers:{"stripe-signature":"bad"},
    }));
    expect(response.status).toBe(400);
    expect(state.applyStripeEvent).not.toHaveBeenCalled();
  });

  it("returns 500 when a verified event cannot be processed so Stripe retries it",async()=>{
    state.constructEvent.mockReturnValue({id:"evt_1",type:"customer.subscription.updated"});
    state.applyStripeEvent.mockRejectedValue(new Error("database unavailable"));
    const response=await POST(new Request("https://leihnest.de/api/stripe/webhook",{
      method:"POST",body:"{}",headers:{"stripe-signature":"valid"},
    }));
    expect(response.status).toBe(500);
  });
});
