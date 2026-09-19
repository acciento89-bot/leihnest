import { beforeEach, describe, expect, it } from "vitest";
import { clearLimits, consumeLimit } from "./rate-limit";

beforeEach(clearLimits);

describe("fixed window limiter",()=>{
  it("allows requests until the configured limit",()=>{
    expect(consumeLimit("u",2,60_000,0)).toBe(true);
    expect(consumeLimit("u",2,60_000,1)).toBe(true);
    expect(consumeLimit("u",2,60_000,2)).toBe(false);
  });
  it("resets after the window",()=>{
    expect(consumeLimit("u",1,60_000,0)).toBe(true);
    expect(consumeLimit("u",1,60_000,59_999)).toBe(false);
    expect(consumeLimit("u",1,60_000,60_000)).toBe(true);
  });
});
