import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("creature detail page", () => {
  it("shows hit points before armor class in the stat block", () => {
    const source = readFileSync("src/app/creatures/[id]/page.tsx", "utf8");

    expect(source.indexOf('label="Hit Points"')).toBeLessThan(
      source.indexOf('label="Armor Class"'),
    );
  });
});
