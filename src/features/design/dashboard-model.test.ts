import {describe,it,expect} from "vitest";
import {monthCells,dayKey,loansOnDay,usageSeries,inventoryLabelKey,type DashboardLoan} from "./dashboard-model";
const loan=(extra:Partial<DashboardLoan>={}):DashboardLoan=>({id:"r1",itemId:"i1",item:{id:"i1",name:"Pavillon"},user:{name:"Anna"},quantity:1,status:"APPROVED",startsAt:"2026-04-16T08:00:00.000Z",endsAt:"2026-04-17T08:00:00.000Z",createdAt:"2026-04-01T08:00:00.000Z",updatedAt:"2026-04-01T08:00:00.000Z",handedOutAt:null,returnedAt:null,approvedAt:null,...extra});
describe("data-backed concept dashboard",()=>{
 it("starts the month grid on Monday and includes the complete month",()=>{
  const cells=monthCells(2026,3);expect(cells).toHaveLength(35);expect(cells[0].key).toBe("2026-03-30");expect(cells.filter(c=>c.inMonth)).toHaveLength(30);expect(cells.at(-1)?.key).toBe("2026-05-03");
 });
 it("formats the local day without assuming UTC at midnight",()=>{
  expect(dayKey("2026-04-01T22:30:00.000Z","Europe/Berlin")).toBe("2026-04-02");
 });
 it("uses half-open reservations and excludes cancelled requests",()=>{
  const list=[loan({endsAt:"2026-04-16T22:00:00.000Z"}),loan({id:"cancelled",status:"CANCELLED"})];
  expect(loansOnDay(list,"2026-04-16").map(r=>r.id)).toEqual(["r1"]);
  expect(loansOnDay(list,"2026-04-17")).toEqual([]);
 });
 it("counts real handovers in six calendar months rather than inventing usage",()=>{
  const rows=[loan({status:"RETURNED",handedOutAt:"2026-03-20T12:00:00.000Z"}),loan({id:"r2",status:"HANDED_OUT",handedOutAt:"2026-04-02T12:00:00.000Z"}),loan({id:"pending",status:"PENDING"})];
  expect(usageSeries(rows,"2026-04-16T12:00:00.000Z").map(b=>b.count)).toEqual([0,0,0,0,1,1]);
  expect(usageSeries([],"2026-04-16T12:00:00.000Z").every(b=>b.count===0)).toBe(true);
 });
 it("does not count future or invalid handover timestamps",()=>{
  const rows=[loan({handedOutAt:"2026-04-30T12:00:00.000Z"}),loan({id:"bad",handedOutAt:"broken"})];
  expect(usageSeries(rows,"2026-04-16T12:00:00.000Z").reduce((n,b)=>n+b.count,0)).toBe(0);
 });
 it("does not describe a pending request as booked stock",()=>{
  expect(inventoryLabelKey("i1",[loan({status:"PENDING"})],"2026-04-16T12:00:00.000Z")).toBe("inStock");
  expect(inventoryLabelKey("i1",[loan({status:"APPROVED"})],"2026-04-16T12:00:00.000Z")).toBe("reserved");
  expect(inventoryLabelKey("i1",[loan({status:"HANDED_OUT"})],"2026-05-16T12:00:00.000Z")).toBe("onLoan");
 });
});
