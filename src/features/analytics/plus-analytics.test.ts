import { describe, expect, it } from "vitest";
import { buildPlusAnalytics, type AnalyticsReservation } from "./plus-analytics";

const now=new Date("2026-09-19T12:00:00Z");
const row=(overrides:Partial<AnalyticsReservation>):AnalyticsReservation=>({
  itemId:"item-1",itemName:"Beamer",status:"RETURNED",
  createdAt:new Date("2026-09-10T12:00:00Z"),
  handedOutAt:new Date("2026-09-11T08:00:00Z"),
  returnedAt:new Date("2026-09-12T14:00:00Z"),
  ...overrides,
});

describe("Plus analytics",()=>{
  it("derives only real reservation metrics",()=>{
    const rows=[
      row({}),
      row({createdAt:new Date("2026-09-12T12:00:00Z"),itemId:"item-1"}),
      row({createdAt:new Date("2026-09-14T12:00:00Z"),itemId:"item-2",itemName:"Pavillon",status:"APPROVED",handedOutAt:null,returnedAt:null}),
      row({createdAt:new Date("2026-09-15T12:00:00Z"),itemId:"item-3",itemName:"Stuhl",status:"CANCELLED",handedOutAt:null,returnedAt:null}),
      row({createdAt:new Date("2026-03-04T12:00:00Z"),itemId:"item-4",itemName:"Alt",status:"RETURNED"}),
    ];
    const result=buildPlusAnalytics(rows,now);
    expect(result.last30DaysReservations).toBe(4);
    expect(result.monthly).toHaveLength(6);
    expect(result.topItems[0]).toEqual({itemId:"item-1",name:"Beamer",count:2});
    expect(result.topItems.some(item=>item.name==="Stuhl")).toBe(false);
    expect(result.statusCounts.RETURNED).toBe(3);
    expect(result.statusCounts.CANCELLED).toBe(1);
    expect(result.averageCompletedLoanHours).toBe(30);
  });
});
