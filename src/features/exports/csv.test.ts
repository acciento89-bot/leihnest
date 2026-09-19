import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("CSV export safety",()=>{
  it.each(["=1+1","+SUM(A1:A2)","-10+20","@cmd"])("neutralizes formula-leading cell %s",value=>{
    expect(csvCell(value)).toBe(`"'${value}"`);
  });
  it("quotes commas quotes and newlines",()=>{
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
  });
  it("serializes rows deterministically",()=>{
    expect(toCsv([["Name","Value"],["Beamer","1"]])).toBe('"Name","Value"\r\n"Beamer","1"\r\n');
  });
});
