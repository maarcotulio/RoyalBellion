import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  createCreature,
  deleteCreature,
  getCreature,
  listCreatures,
  updateCreature,
} from "@/lib/creatures/repository";
import { disconnectFromMongo } from "@/lib/db/mongoose";
import type { Creature } from "@/lib/schemas/creature";

const creatureId = "vitest-m1-creature";

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  const now = new Date().toISOString();

  return {
    id: creatureId,
    name: "Vitest M1 Creature",
    size: "medium",
    type: "humanoid",
    alignment: "unaligned",
    cr: "1/4",
    ac: { value: 12 },
    hp: { average: 9, formula: "2d8" },
    speed: { walk: 30 },
    stats: { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 },
    senses: ["passive Perception 10"],
    languages: [],
    traits: [],
    actions: [{ name: "Strike", description: "Basic attack." }],
    source: "manual",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("creature repository", () => {
  beforeEach(async () => {
    await deleteCreature(creatureId);
  });

  afterAll(async () => {
    await deleteCreature(creatureId);
    await disconnectFromMongo();
  });

  it("creates, reads, filters, updates, and deletes creatures", async () => {
    const created = await createCreature(makeCreature());

    expect(created.id).toBe(creatureId);

    const found = await getCreature(creatureId);
    expect(found?.name).toBe("Vitest M1 Creature");

    const filtered = await listCreatures({
      search: "Vitest",
      type: "humanoid",
      cr: "1/4",
    });
    expect(filtered.map((creature) => creature.id)).toContain(creatureId);

    const updated = await updateCreature(
      creatureId,
      makeCreature({
        name: "Vitest M1 Creature Updated",
        cr: "1/2",
        hp: { average: 13, formula: "3d8" },
      }),
    );
    expect(updated?.name).toBe("Vitest M1 Creature Updated");
    expect(updated?.cr).toBe("1/2");

    await expect(deleteCreature(creatureId)).resolves.toBe(true);
    await expect(getCreature(creatureId)).resolves.toBeNull();
  });
});
