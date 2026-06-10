import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("library page", () => {
  it("keeps the creature CR badge at a fixed width", () => {
    const source = readFileSync("src/app/library/page.tsx", "utf8");

    expect(source).toContain("w-16 shrink-0");
  });

  it("shows hit points before armor class on creature cards", () => {
    const source = readFileSync("src/app/library/page.tsx", "utf8");

    expect(source.indexOf(">HP<")).toBeLessThan(source.indexOf(">AC<"));
  });

  it("uses pointer cursor on filter select controls", () => {
    const source = readFileSync("src/app/library/page.tsx", "utf8");

    expect(source).toContain("h-10 cursor-pointer");
  });
});
