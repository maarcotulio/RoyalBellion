import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("combat log source", () => {
  it("shows the outcome beside To Hit in the primary blue accent", () => {
    const source = readFileSync("src/components/ui/combat-log.tsx", "utf8");

    expect(source).toContain("outcomeLabel");
    expect(source).toContain("text-primary");
    expect(source).toContain("To Hit");
  });
});
