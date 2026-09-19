import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("release media and billing configuration",()=>{
  it("keeps both Portainer compose files identical and persistent",()=>{
    const compose=readFileSync("compose.portainer.yaml","utf8");
    expect(readFileSync("docker-compose.portainer.yml","utf8")).toBe(compose);
    expect(compose).toContain("leihnest-uploads:/data/uploads");
    expect(compose).toContain("UPLOADS_DIR: /data/uploads");
    for(const name of ["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","STRIPE_PLUS_MONTHLY_PRICE_ID","STRIPE_PLUS_YEARLY_PRICE_ID"]){
      expect(compose).toContain(name);
    }
  });

  it("documents uploaded images and Stripe processing in privacy copy",()=>{
    const privacy=readFileSync("src/app/datenschutz/page.tsx","utf8");
    for(const term of ["Profilbilder","Gruppenbilder","Gegenstandsbilder","Stripe"]){
      expect(privacy).toContain(term);
    }
    expect(privacy).toContain("keine vollständigen Zahlungskartendaten");
    expect(privacy).toContain("19. September 2026");
  });
});
