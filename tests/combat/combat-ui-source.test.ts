import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("combat UI source", () => {
  it("creates encounters with UUIDs instead of name slugs", () => {
    const source = readFileSync("src/components/combat/encounter-form.tsx", "utf8");

    expect(source).toContain("id: crypto.randomUUID()");
    expect(source).not.toContain("createId(name)");
  });

  it("uses manual target AC controls instead of target selects", () => {
    const encounterTable = readFileSync("src/components/combat/encounter-table.tsx", "utf8");
    const quickCombat = readFileSync("src/components/combat/quick-combat.tsx", "utf8");

    expect(encounterTable).toContain('label="Target AC"');
    expect(encounterTable).not.toContain('label="Target"');
    expect(quickCombat).toContain('label="Target AC"');
    expect(quickCombat).not.toContain('label="Target"');
  });
});
